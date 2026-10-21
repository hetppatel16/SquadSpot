"""Import real, named points of interest for active SquadSpot cities from OpenStreetMap.

Version 2.0 adds stricter visitor-facing OSM filters, quality ranking, balanced
category selection, paginated duplicate checks, and a total per-city safety cap.

Run from the backend directory:
    python -m scripts.import_osm_pois --all
    python -m scripts.import_osm_pois --city Kochi

This script is intentionally separate from the live itinerary request path. It uses
Supabase's service-role client for a one-time/batch admin import and never deletes or
rewrites existing place records.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from typing import Any

# The main FOSSGIS endpoint can be overloaded or temporarily return HTTP 502.
# The second endpoint is a global-coverage public mirror listed by the OSM Wiki.
# Keep requests sequential and identify this importer with a User-Agent.
OVERPASS_ENDPOINTS = (
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
)
USER_AGENT = "SquadSpot-POI-Importer/2.1 (https://github.com/hetppatel16/SquadSpot)"
SOURCE_NAME = "OpenStreetMap"
# Start with two cities per request. If a group times out, split it automatically.
BATCH_SIZE = 2
DEFAULT_RADIUS_KM = 7.0
DEFAULT_DELAY_SECONDS = 8.0
REQUEST_TIMEOUT_SECONDS = 75
QUERY_TIMEOUT_SECONDS = 45
SPLIT_DELAY_SECONDS = 2.0
MAX_PLACES_PER_CITY = 200

# Keep selectors focused on named visitor-facing places. In particular, do not
# query every place of worship or every object carrying any historic tag: those
# broad selectors produced ordinary local facilities and industrial objects.
ADVENTURE_SPORTS = {
    "climbing", "surfing", "scuba_diving", "diving", "kayak", "canoe",
    "rafting", "sailing", "paragliding", "hang_gliding", "mountaineering",
    "hiking", "skiing", "snowboarding", "mountain_biking", "zip_line",
    "horse_riding", "bmx",
}
ADVENTURE_SPORT_PATTERN = "|".join(sorted(ADVENTURE_SPORTS))
OVERPASS_FILTERS = (
    '["tourism"~"^(attraction|museum|gallery|zoo|aquarium|theme_park|viewpoint|artwork|picnic_site)$"]',
    '["historic"~"^(archaeological_site|castle|fort|memorial|monument|palace|ruins|city_gate|manor|monastery|church|temple|mosque|synagogue|chapel)$"]',
    '["leisure"~"^(park|garden|nature_reserve|water_park|playground)$"]',
    f'["sport"~"^({ADVENTURE_SPORT_PATTERN})$"]',
    '["amenity"~"^(restaurant|cafe|fast_food|food_court|ice_cream|cinema|arts_centre|marketplace)$"]',
    '["shop"~"^(mall|department_store|gift|books|jewelry|antiques|art|craft|spices|clothes|shoes|outdoor)$"]',
    '["natural"~"^(beach|waterfall|peak|cave_entrance)$"]',
)

FOOD_AMENITIES = {"restaurant", "cafe", "fast_food", "food_court", "ice_cream"}
CULTURE_TOURISM = {"museum", "gallery", "artwork"}
HISTORIC_CULTURE = {
    "archaeological_site", "castle", "fort", "memorial", "monument",
    "palace", "ruins", "city_gate", "manor", "monastery",
    "church", "temple", "mosque", "synagogue", "chapel",
}
NATURE_LEISURE = {"park", "garden", "nature_reserve", "playground"}
NATURE_FEATURES = {"beach", "waterfall", "peak", "cave_entrance"}
SHOP_VALUES = {
    "mall", "department_store", "gift", "books", "jewelry", "antiques",
    "art", "craft", "spices", "clothes", "shoes", "outdoor",
}
LODGING_TOURISM = {"hotel", "motel", "hostel", "guest_house", "apartment", "chalet"}
INDUSTRIAL_MAN_MADE = {
    "works", "chimney", "storage_tank", "silo", "pipeline", "petroleum_well",
    "mineshaft", "wastewater_plant", "water_works",
}

# Balanced selection targets for a 200-place city import. These are targets, not
# fabricated data: if OSM has no qualifying places in a category, that quota remains
# unfilled and the importer selects from the other eligible categories up to limits.
CATEGORY_TARGETS = {
    "culture": 45,
    "nature": 40,
    "adventure": 30,
    "food": 35,
    "shopping": 30,
    "movie": 20,
}
MAX_PER_CATEGORY = 60

VIBE_SCORES: dict[str, dict[str, float]] = {
    "culture": {"family": 0.70, "relaxed": 0.65},
    "nature": {"chill": 0.75, "relaxed": 0.75, "family": 0.65, "romantic": 0.55},
    "food": {"chill": 0.65, "relaxed": 0.60, "energetic": 0.55, "family": 0.55},
    "shopping": {"energetic": 0.65, "family": 0.55, "chill": 0.45},
    "adventure": {"adventurous": 0.80, "energetic": 0.75, "family": 0.55},
    "movie": {"chill": 0.75, "family": 0.65, "romantic": 0.55},
}


class OverpassQueryTimeout(RuntimeError):
    """Raised when Overpass returns a successful HTTP response with a timed-out query."""


def _normalise_name(value: str) -> str:
    """Make name comparison resilient to case, accents and punctuation."""
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", " ", value.casefold()).strip()


def _distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    value = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(value), math.sqrt(max(0.0, 1.0 - value)))


def _element_coordinates(element: dict[str, Any]) -> tuple[float, float] | None:
    """OSM nodes have lat/lon; ways and relations are returned with center.lat/lon."""
    location = element if "lat" in element and "lon" in element else element.get("center")
    if not isinstance(location, dict) or location.get("lat") is None or location.get("lon") is None:
        return None
    try:
        latitude, longitude = float(location["lat"]), float(location["lon"])
    except (TypeError, ValueError):
        return None
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        return None
    return latitude, longitude


def _is_excluded_place(tags: dict[str, str]) -> bool:
    """Reject private, disused, lodging-only and industrial records."""
    access = str(tags.get("access", "")).lower()
    if access in {"private", "no"}:
        return True

    tourism = str(tags.get("tourism", "")).lower()
    if tourism in LODGING_TOURISM:
        # A hotel or guest house is not itself a Food/Culture recommendation.
        # A separately mapped restaurant in the property can still be imported.
        return True

    if str(tags.get("landuse", "")).lower() == "industrial":
        return True
    if str(tags.get("industrial", "")).lower() not in {"", "no", "false"}:
        return True
    if str(tags.get("man_made", "")).lower() in INDUSTRIAL_MAN_MADE:
        return True
    for lifecycle_prefix in ("disused:", "abandoned:", "demolished:", "razed:"):
        if any(key.startswith(lifecycle_prefix) for key in tags):
            return True
    return False


def infer_categories(tags: dict[str, str]) -> list[str]:
    """Map visitor-facing OSM tags to SquadSpot's existing categories.

    Generic place_of_worship and arbitrary historic=* objects are deliberately not
    treated as attractions. A worship site is accepted only when it is independently
    tagged as a tourism attraction or one of the recognised historic visitor types.
    """
    if _is_excluded_place(tags):
        return []

    categories: set[str] = set()
    tourism = str(tags.get("tourism", "")).lower()
    historic = str(tags.get("historic", "")).lower()
    amenity = str(tags.get("amenity", "")).lower()
    leisure = str(tags.get("leisure", "")).lower()
    natural = str(tags.get("natural", "")).lower()
    shop = str(tags.get("shop", "")).lower()
    sport = str(tags.get("sport", "")).lower()

    if amenity in FOOD_AMENITIES:
        categories.add("food")
    if amenity == "cinema":
        categories.add("movie")
    if shop in SHOP_VALUES or amenity == "marketplace":
        categories.add("shopping")
    if historic in HISTORIC_CULTURE or tourism in CULTURE_TOURISM or amenity == "arts_centre":
        categories.add("culture")
    if leisure in NATURE_LEISURE or natural in NATURE_FEATURES or tourism in {"viewpoint", "picnic_site"}:
        categories.add("nature")
    if tourism in {"zoo", "aquarium"}:
        categories.add("nature")
    if tourism == "theme_park" or leisure == "water_park" or sport in ADVENTURE_SPORTS:
        categories.add("adventure")

    # Generic tourism=attraction is useful, but it must not override a more
    # specific category such as Food or Nature.
    if tourism == "attraction" and not categories:
        categories.add("culture")
    return sorted(categories)


def _candidate_priority(
    tags: dict[str, str], categories: list[str]
) -> float:
    """Rank established visitor attractions above ordinary low-value map objects."""
    score = 1.0
    tourism = str(tags.get("tourism", "")).lower()
    historic = str(tags.get("historic", "")).lower()
    amenity = str(tags.get("amenity", "")).lower()
    leisure = str(tags.get("leisure", "")).lower()
    natural = str(tags.get("natural", "")).lower()
    shop = str(tags.get("shop", "")).lower()
    sport = str(tags.get("sport", "")).lower()

    score += {
        "museum": 20, "zoo": 16, "aquarium": 16, "theme_park": 18,
        "gallery": 16, "attraction": 12, "viewpoint": 11,
        "artwork": 8, "picnic_site": 7,
    }.get(tourism, 0)
    score += {
        "castle": 15, "fort": 15, "palace": 15, "archaeological_site": 14,
        "ruins": 12, "monastery": 11, "manor": 10, "city_gate": 10,
        "monument": 8, "memorial": 3, "church": 10,
        "temple": 10, "mosque": 10, "synagogue": 10, "chapel": 8,
    }.get(historic, 0)
    score += {
        "nature_reserve": 14, "park": 12, "garden": 10,
        "water_park": 15, "playground": 5,
    }.get(leisure, 0)
    score += {"beach": 12, "waterfall": 14, "peak": 9, "cave_entrance": 9}.get(natural, 0)
    score += {
        "restaurant": 8, "cafe": 7, "ice_cream": 6,
        "food_court": 5, "fast_food": 3, "cinema": 9,
        "arts_centre": 10, "marketplace": 9,
    }.get(amenity, 0)
    score += {
        "mall": 10, "department_store": 8, "antiques": 8,
        "craft": 8, "art": 8, "gift": 7, "spices": 7,
        "books": 6, "jewelry": 6, "clothes": 4, "shoes": 4,
        "outdoor": 5,
    }.get(shop, 0)
    if sport in ADVENTURE_SPORTS:
        score += 8
    if tags.get("website") or tags.get("contact:website"):
        score += 2
    if tags.get("description") or tags.get("description:en"):
        score += 1.5
    if _address_from_tags(tags):
        score += 1
    if tags.get("opening_hours"):
        score += 0.5

    # Small memorial objects can be valid cultural records but should rank below
    # museums, forts, palaces and named visitor attractions.
    lowered_name = _normalise_name(str(tags.get("name:en") or tags.get("name") or ""))
    if historic == "memorial" and any(
        term in lowered_name.split() for term in {"anchor", "boiler", "dredger", "engine"}
    ):
        score -= 2
    return score


def infer_vibes(categories: list[str]) -> dict[str, float]:
    """Attach modest heuristic vibe weights; these are not user ratings."""
    result: dict[str, float] = {}
    for category in categories:
        for vibe, score in VIBE_SCORES.get(category, {}).items():
            result[vibe] = max(result.get(vibe, 0.0), score)
    return result


def _address_from_tags(tags: dict[str, str]) -> str | None:
    full = tags.get("addr:full")
    if full:
        return full[:500]
    parts = [
        " ".join(x for x in [tags.get("addr:housenumber"), tags.get("addr:street")] if x),
        tags.get("addr:suburb") or tags.get("addr:neighbourhood"),
        tags.get("addr:city") or tags.get("addr:town") or tags.get("addr:village"),
        tags.get("addr:postcode"),
    ]
    address = ", ".join(part for part in parts if part)
    return address[:500] or None


def _visit_duration(categories: list[str]) -> int:
    if "movie" in categories:
        return 150
    if "food" in categories:
        return 60
    if "shopping" in categories:
        return 45
    if "adventure" in categories:
        return 120
    if "nature" in categories:
        return 60
    return 90


def _build_place_record(
    element: dict[str, Any], city_id: str
) -> tuple[dict[str, Any], list[str], dict[str, float], float] | None:
    tags = element.get("tags") or {}
    if not isinstance(tags, dict):
        return None
    name = (tags.get("name:en") or tags.get("name") or "").strip()
    if not name or len(name) > 200:
        return None
    coordinates = _element_coordinates(element)
    if coordinates is None:
        return None
    categories = infer_categories(tags)
    if not categories:
        return None

    element_type = element.get("type")
    element_id = element.get("id")
    if element_type not in {"node", "way", "relation"} or element_id is None:
        return None
    source_id = f"{element_type}/{element_id}"
    opening_hours = {}
    if tags.get("opening_hours"):
        # Preserve the original OSM schedule. We do not guess parsed opening times.
        opening_hours = {"raw": tags["opening_hours"][:500]}

    record = {
        "name": name,
        "city_id": city_id,
        "address": _address_from_tags(tags),
        "latitude": coordinates[0],
        "longitude": coordinates[1],
        "description": (tags.get("description:en") or tags.get("description") or None),
        "avg_visit_duration_minutes": _visit_duration(categories),
        "opening_hours": opening_hours,
        "website_url": tags.get("contact:website") or tags.get("website") or None,
        "contact_phone": tags.get("contact:phone") or tags.get("phone") or None,
        # Keep unknown values unknown: do not fabricate ratings or entry fees.
        "avg_cost_per_person": None,
        "rating": None,
        "price_level": None,
        "source": SOURCE_NAME,
        "source_id": source_id,
        "is_active": True,
    }
    return record, categories, infer_vibes(categories), _candidate_priority(tags, categories)


def _build_overpass_query(
    cities: list[dict[str, Any]],
    radius_km: float,
    filters: tuple[str, ...] = OVERPASS_FILTERS,
) -> str:
    clauses: list[str] = []
    radius_m = int(radius_km * 1000)
    for city in cities:
        lat, lon = float(city["latitude"]), float(city["longitude"])
        for selector in filters:
            clauses.append(f"  nwr(around:{radius_m},{lat:.6f},{lon:.6f})[name]{selector};")
    return f"[out:json][timeout:{QUERY_TIMEOUT_SECONDS}];\n(\n" + "\n".join(clauses) + "\n);\nout center tags;"


def _merge_unique_elements(*groups: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: dict[tuple[str, int], dict[str, Any]] = {}
    for group in groups:
        for element in group:
            key = (str(element.get("type", "")), int(element.get("id", -1)))
            if key[0] and key[1] >= 0:
                merged[key] = element
    return list(merged.values())


def _get_overpass_endpoints() -> tuple[str, ...]:
    """Return endpoints, allowing an operator to override them via environment."""
    override = os.getenv("SQUADSPOT_OVERPASS_ENDPOINTS", "").strip()
    if override:
        endpoints = tuple(item.strip() for item in override.split(",") if item.strip())
        if endpoints:
            return endpoints
    return OVERPASS_ENDPOINTS


def _fetch_overpass_once(
    cities: list[dict[str, Any]],
    radius_km: float,
    filters: tuple[str, ...],
) -> list[dict[str, Any]]:
    """Try the primary Overpass server, then a documented global mirror.

    We do not repeatedly hammer a server that has already returned a transient
    gateway/availability error. A query timeout is also retried once on the next
    endpoint; only after all configured endpoints time out does the caller split
    the query into smaller pieces.
    """
    query = _build_overpass_query(cities, radius_km, filters)
    body = urllib.parse.urlencode({"data": query}).encode("utf-8")
    endpoints = _get_overpass_endpoints()
    last_error: Exception | None = None
    query_timeout_error: OverpassQueryTimeout | None = None

    for endpoint_index, endpoint in enumerate(endpoints):
        request = urllib.request.Request(
            endpoint,
            data=body,
            headers={
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Accept": "application/json",
                "User-Agent": USER_AGENT,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
                payload = json.loads(response.read().decode("utf-8"))

            if payload.get("remark"):
                remark = str(payload["remark"])
                if "timed out" in remark.lower() or "timeout" in remark.lower():
                    query_timeout_error = OverpassQueryTimeout(remark)
                    last_error = query_timeout_error
                    if endpoint_index < len(endpoints) - 1:
                        print(f"  Query timed out on endpoint {endpoint_index + 1}; trying the next Overpass endpoint...")
                        continue
                    raise last_error
                raise RuntimeError(f"Overpass returned a warning: {remark}")

            return payload.get("elements") or []

        except OverpassQueryTimeout:
            raise
        except urllib.error.HTTPError as error:
            if error.code not in {429, 500, 502, 503, 504}:
                raise RuntimeError(
                    f"Overpass endpoint {endpoint} returned HTTP {error.code}: {error.reason}"
                ) from error
            last_error = error
            if endpoint_index < len(endpoints) - 1:
                print(
                    f"  Overpass endpoint {endpoint_index + 1} returned HTTP {error.code}; "
                    "switching to the next endpoint..."
                )
                continue
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            last_error = error
            if endpoint_index < len(endpoints) - 1:
                print(
                    f"  Overpass endpoint {endpoint_index + 1} connection/response issue; "
                    "switching to the next endpoint..."
                )
                continue

    endpoint_list = ", ".join(endpoints)
    if query_timeout_error is not None:
        raise query_timeout_error
    raise RuntimeError(
        f"All configured Overpass endpoints failed ({endpoint_list}). Last error: {last_error}. "
        "Try again later or set SQUADSPOT_OVERPASS_ENDPOINTS to a working interpreter endpoint."
    ) from last_error


def fetch_overpass_elements(
    cities: list[dict[str, Any]],
    radius_km: float,
    filters: tuple[str, ...] = OVERPASS_FILTERS,
) -> list[dict[str, Any]]:
    """Fetch data and adaptively split city groups or tag filters when a query times out."""
    try:
        return _fetch_overpass_once(cities, radius_km, filters)
    except OverpassQueryTimeout as error:
        if len(cities) > 1:
            midpoint = len(cities) // 2
            left, right = cities[:midpoint], cities[midpoint:]
            print(
                "  Query timed out for this city group; retrying as smaller groups: "
                + ", ".join(city["name"] for city in left)
                + " | "
                + ", ".join(city["name"] for city in right)
            )
            left_elements = fetch_overpass_elements(left, radius_km, filters)
            time.sleep(SPLIT_DELAY_SECONDS)
            right_elements = fetch_overpass_elements(right, radius_km, filters)
            return _merge_unique_elements(left_elements, right_elements)

        if len(filters) > 1:
            midpoint = len(filters) // 2
            first_filters, second_filters = filters[:midpoint], filters[midpoint:]
            print(
                f"  Query for {cities[0]['name']} timed out; splitting its place categories "
                f"into smaller requests ({len(first_filters)} + {len(second_filters)} filters)."
            )
            first_elements = fetch_overpass_elements(cities, radius_km, first_filters)
            time.sleep(SPLIT_DELAY_SECONDS)
            second_elements = fetch_overpass_elements(cities, radius_km, second_filters)
            return _merge_unique_elements(first_elements, second_elements)

        raise RuntimeError(
            f"Overpass query still timed out for {cities[0]['name']} with one place-category filter. "
            "Try again later or use a smaller --radius-km."
        ) from error


def _assign_to_nearest_city(
    element: dict[str, Any], cities: list[dict[str, Any]], radius_km: float
) -> dict[str, Any] | None:
    coordinates = _element_coordinates(element)
    if coordinates is None:
        return None
    nearest_city = min(
        cities,
        key=lambda city: _distance_km(
            coordinates[0], coordinates[1], float(city["latitude"]), float(city["longitude"])
        ),
    )
    distance = _distance_km(
        coordinates[0], coordinates[1], float(nearest_city["latitude"]), float(nearest_city["longitude"])
    )
    return nearest_city if distance <= radius_km else None


def _chunks(items: list[dict[str, Any]], size: int):
    for index in range(0, len(items), size):
        yield items[index : index + size]


def _load_all_rows(client, table: str, columns: str, filters: tuple[tuple[str, Any], ...]) -> list[dict[str, Any]]:
    """Read all matching rows in pages so large imports are not cut off silently."""
    rows: list[dict[str, Any]] = []
    page_size = 1000
    start = 0
    while True:
        query = client.table(table).select(columns)
        for column, value in filters:
            query = query.eq(column, value)
        page = query.range(start, start + page_size - 1).execute().data or []
        rows.extend(page)
        if len(page) < page_size:
            break
        start += page_size
    return rows


def _load_existing_names(client, city_id: str) -> tuple[set[str], int]:
    rows = _load_all_rows(client, "places", "id,name", (("city_id", city_id),))
    names = {_normalise_name(row.get("name", "")) for row in rows if row.get("name")}
    return names, len(rows)


def _load_existing_osm_ids(client) -> set[str]:
    rows = _load_all_rows(client, "places", "source_id", (("source", SOURCE_NAME),))
    return {row["source_id"] for row in rows if row.get("source_id")}


def _select_balanced_candidates(
    candidates: list[tuple[dict[str, Any], list[str], dict[str, float], float]],
    limit: int,
) -> list[tuple[dict[str, Any], list[str], dict[str, float], float]]:
    """Select a quality-ranked, category-balanced subset without inventing categories."""
    if limit <= 0 or not candidates:
        return []

    ordered = sorted(
        candidates,
        key=lambda item: (-item[3], _normalise_name(item[0]["name"]), item[0]["source_id"]),
    )
    if len(ordered) <= limit:
        return ordered

    scale = limit / MAX_PLACES_PER_CITY
    targets = {
        category: max(1, round(target * scale))
        for category, target in CATEGORY_TARGETS.items()
    }
    category_cap = max(1, round(MAX_PER_CATEGORY * scale))
    counts: dict[str, int] = defaultdict(int)
    selected: list[tuple[dict[str, Any], list[str], dict[str, float], float]] = []
    selected_ids: set[str] = set()

    def add_candidate(candidate) -> None:
        selected.append(candidate)
        selected_ids.add(candidate[0]["source_id"])
        for category in candidate[1]:
            counts[category] += 1

    # First pass: meet the target for each category where enough valid OSM records exist.
    for category in CATEGORY_TARGETS:
        for candidate in ordered:
            if len(selected) >= limit or counts[category] >= targets[category]:
                break
            if category not in candidate[1] or candidate[0]["source_id"] in selected_ids:
                continue
            if any(counts[item] >= category_cap for item in candidate[1]):
                continue
            add_candidate(candidate)

    # Second pass: fill spare capacity from the highest-quality remaining records,
    # while preventing any one category from dominating the result.
    for candidate in ordered:
        if len(selected) >= limit:
            break
        if candidate[0]["source_id"] in selected_ids:
            continue
        if not any(counts[category] < category_cap for category in candidate[1]):
            continue
        add_candidate(candidate)

    return selected


def _print_category_summary(candidates, prefix: str = "  Selected categories") -> None:
    counts: dict[str, int] = defaultdict(int)
    for _record, categories, _vibes, _priority in candidates:
        for category in categories:
            counts[category] += 1
    summary = ", ".join(f"{name}={counts.get(name, 0)}" for name in CATEGORY_TARGETS)
    print(f"{prefix}: {summary}")


def _write_city_records(
    client,
    city: dict[str, Any],
    candidates: list[tuple[dict[str, Any], list[str], dict[str, float], float]],
    category_ids: dict[str, str],
    vibe_ids: dict[str, str],
    known_osm_ids: set[str],
    dry_run: bool,
    max_places_per_city: int = MAX_PLACES_PER_CITY,
    sample_names_per_category: int = 0,
) -> int:
    existing_names, existing_count = _load_existing_names(client, city["id"])
    remaining_capacity = max(0, max_places_per_city - existing_count)
    if remaining_capacity == 0:
        print(
            f"  {city['name']}: already has {existing_count} places; "
            f"the {max_places_per_city}-place city safety cap prevents additional imports."
        )
        return 0

    eligible = []
    new_names = set(existing_names)
    for candidate in candidates:
        record, categories, vibes, priority = candidate
        name_key = _normalise_name(record["name"])
        source_id = record["source_id"]
        if not name_key or name_key in new_names or source_id in known_osm_ids:
            continue
        eligible.append(candidate)
        new_names.add(name_key)

    new_items = _select_balanced_candidates(eligible, remaining_capacity)
    if len(eligible) > len(new_items):
        print(
            f"  Limiting {city['name']} from {len(eligible)} eligible new records "
            f"to {len(new_items)} (remaining city capacity / category balance)."
        )

    if not new_items:
        print(f"  {city['name']}: no new places (existing records were kept).")
        return 0

    _print_category_summary(new_items)

    # Optional read-only preview to let an operator inspect real selected names
    # before approving a bulk import. A multi-category place may appear in more
    # than one category sample; it is still inserted only once.
    if sample_names_per_category > 0:
        print(f"  Sample selected places (up to {sample_names_per_category} per category):")
        for category in CATEGORY_TARGETS:
            matching = [item for item in new_items if category in item[1]]
            sample = matching[:sample_names_per_category]
            if sample:
                names = "; ".join(item[0]["name"] for item in sample)
                print(f"    {category}: {names}")
            else:
                print(f"    {category}: (none selected)")

    for record, _categories, _vibes, _priority in new_items:
        known_osm_ids.add(record["source_id"])

    if dry_run:
        print(f"  {city['name']}: {len(new_items)} new places would be imported.")
        return len(new_items)

    payload = [item[0] for item in new_items]
    inserted_response = client.table("places").insert(payload).execute()
    inserted_rows = inserted_response.data or []
    if len(inserted_rows) != len(new_items):
        raise RuntimeError(
            f"Supabase returned {len(inserted_rows)} inserted rows for {len(new_items)} records."
        )

    inserted_by_source = {row.get("source_id"): row for row in inserted_rows}
    category_links = []
    vibe_links = []
    for record, categories, vibes, _priority in new_items:
        inserted = inserted_by_source.get(record["source_id"])
        if not inserted or not inserted.get("id"):
            continue
        place_id = inserted["id"]
        for category in categories:
            if category in category_ids:
                category_links.append({"place_id": place_id, "category_id": category_ids[category]})
        for vibe, score in vibes.items():
            if vibe in vibe_ids:
                vibe_links.append(
                    {"place_id": place_id, "vibe_id": vibe_ids[vibe], "relevance_score": score}
                )

    if category_links:
        client.table("place_categories").insert(category_links).execute()
    if vibe_links:
        client.table("place_vibes").insert(vibe_links).execute()

    print(f"  {city['name']}: imported {len(inserted_rows)} new places.")
    return len(inserted_rows)


def run_import(args: argparse.Namespace) -> int:
    try:
        from app.core.db import get_supabase_admin_client

        client = get_supabase_admin_client()
    except Exception as error:
        raise RuntimeError(
            "Could not create the Supabase admin client. Run this from the backend folder "
            "and check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env."
        ) from error

    cities_response = (
        client.table("cities")
        .select("id,name,state_region,country,latitude,longitude")
        .eq("is_active", True)
        .order("name")
        .range(0, 4999)
        .execute()
    )
    cities = cities_response.data or []
    if args.city:
        wanted = _normalise_name(args.city)
        cities = [city for city in cities if _normalise_name(city["name"]) == wanted]
        if not cities:
            raise RuntimeError(f"No active city named '{args.city}' was found in public.cities.")
        if len(cities) > 1:
            matches = ", ".join(
                f"{city['name']} ({city.get('state_region') or city.get('country')})" for city in cities
            )
            raise RuntimeError(f"More than one city matches '{args.city}': {matches}. Use a unique city name.")
    if not cities:
        raise RuntimeError("No active cities were found in public.cities.")

    category_response = client.table("categories").select("id,name").execute()
    vibe_response = client.table("vibes").select("id,name").execute()
    category_ids = {row["name"].lower(): row["id"] for row in (category_response.data or [])}
    vibe_ids = {row["name"].lower(): row["id"] for row in (vibe_response.data or [])}
    missing_categories = sorted({"culture", "food", "movie", "nature", "adventure", "shopping"} - set(category_ids))
    missing_vibes = sorted({name for values in VIBE_SCORES.values() for name in values} - set(vibe_ids))
    if missing_categories:
        print("Warning: these category rows are missing and their mappings will be skipped: " + ", ".join(missing_categories))
    if missing_vibes:
        print("Warning: these vibe rows are missing and their mappings will be skipped: " + ", ".join(missing_vibes))

    known_osm_ids = _load_existing_osm_ids(client)
    total_imported_or_previewed = 0
    failed_batches = 0
    batches = list(_chunks(cities, BATCH_SIZE))
    print(
        f"Starting {'DRY RUN for ' if args.dry_run else ''}OSM import: "
        f"{len(cities)} active city/cities, radius {args.radius_km:g} km, "
        f"{len(batches)} sequential request group(s), adaptive timeout splitting enabled."
    )

    for batch_index, batch in enumerate(batches, start=1):
        city_labels = ", ".join(city["name"] for city in batch)
        print(f"\n[{batch_index}/{len(batches)}] Fetching: {city_labels}")
        try:
            elements = fetch_overpass_elements(batch, args.radius_km)
        except Exception as error:
            failed_batches += 1
            print(f"  Batch failed: {error}")
            continue

        grouped: dict[str, list[tuple[dict[str, Any], list[str], dict[str, float], float]]] = defaultdict(list)
        seen_per_city: dict[str, set[str]] = defaultdict(set)
        city_by_id = {city["id"]: city for city in batch}
        for element in elements:
            assigned_city = _assign_to_nearest_city(element, batch, args.radius_km)
            if not assigned_city:
                continue
            built = _build_place_record(element, assigned_city["id"])
            if not built:
                continue
            record, categories, vibes, _priority = built
            if record["source_id"] in seen_per_city[assigned_city["id"]]:
                continue
            seen_per_city[assigned_city["id"]].add(record["source_id"])
            grouped[assigned_city["id"]].append(built)

        for city_id, city in city_by_id.items():
            try:
                total_imported_or_previewed += _write_city_records(
                    client, city, grouped.get(city_id, []), category_ids, vibe_ids,
                    known_osm_ids, args.dry_run, args.max_places_per_city,
                    args.sample_names_per_category,
                )
            except Exception as error:
                failed_batches += 1
                print(f"  Database import failed for {city['name']}: {error}")

        if batch_index < len(batches) and args.delay_seconds > 0:
            time.sleep(args.delay_seconds)

    print("\nImport finished.")
    print(f"New places {'previewed' if args.dry_run else 'imported'}: {total_imported_or_previewed}")
    if failed_batches:
        print(f"Failed batch/city operations: {failed_batches}. You can safely rerun; imported OSM IDs and names are skipped.")
        return 1
    print("Existing places were not deleted or overwritten.")
    if args.dry_run:
        print("This was a dry run. No database rows were written.")
    return 0


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import named OSM places into the existing SquadSpot Supabase database."
    )
    target = parser.add_mutually_exclusive_group()
    target.add_argument("--all", action="store_true", help="Import all active cities from public.cities (default).")
    target.add_argument("--city", help="Import one exact active city name, e.g. Kochi.")
    parser.add_argument("--radius-km", type=float, default=DEFAULT_RADIUS_KM, help="Search radius around each city centre (default: 7 km; max: 25 km).")
    parser.add_argument("--delay-seconds", type=float, default=DEFAULT_DELAY_SECONDS, help="Pause between sequential Overpass request groups (default: 8 seconds).")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and count places without writing to Supabase.")
    parser.add_argument(
        "--max-places-per-city", type=int, default=MAX_PLACES_PER_CITY,
        help=f"Maximum total place records per city including existing records (default: {MAX_PLACES_PER_CITY}; max: 500).",
    )
    parser.add_argument(
        "--sample-names-per-category", type=int, default=0,
        help="Print up to N selected place names per category (useful with --dry-run; does not change selection).",
    )
    args = parser.parse_args(argv)
    if not 2 <= args.radius_km <= 25:
        parser.error("--radius-km must be between 2 and 25.")
    if not 0 <= args.delay_seconds <= 120:
        parser.error("--delay-seconds must be between 0 and 120.")
    if not 10 <= args.max_places_per_city <= 500:
        parser.error("--max-places-per-city must be between 10 and 500.")
    if not 0 <= args.sample_names_per_category <= 20:
        parser.error("--sample-names-per-category must be between 0 and 20.")
    if args.sample_names_per_category and not args.dry_run:
        parser.error("--sample-names-per-category can only be used with --dry-run.")
    return args


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        return run_import(args)
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

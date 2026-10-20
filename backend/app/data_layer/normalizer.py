# Phase 1: Convert raw POIs into optimization-ready format.
# Filters closed, over-budget; estimates travel times; normalizes ratings; sets preference/mood weights.

import json
import re
from typing import Any, Dict, List

from app.constraint_engine.constraints import budget_cost, budget_with_margin, check_time_window
from app.data_layer.cost_estimates import build_category_ranges, estimate_range
from app.data_layer.repository import get_all_pois

# Two places this close whose names start with the same word are treated as one place.
DUPLICATE_DISTANCE_KM = 0.075
_NAME_STOPWORDS = {"the", "and", "of", "at", "in", "for", "shri", "shree", "sri"}


def _distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in kilometers."""
    import math
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def _travel_minutes(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine-based travel time in minutes (MVP: 2 min/km)."""
    return _distance_km(lat1, lon1, lat2, lon2) * 2.0


def _poi_to_dict(poi) -> Dict[str, Any]:
    """Convert ORM POI to dict for pipeline (session-independent)."""
    mood = poi.mood_tags



    if isinstance(mood, str):
        try:
            mood = json.loads(mood) if mood else []
        except Exception:
            mood = []
    return {
        "id": poi.id,
        "name": poi.name,
        "latitude": float(poi.latitude),
        "longitude": float(poi.longitude),
        "category": poi.category,
        "categories": list(getattr(poi, "categories", []) or [poi.category]),
        "address": getattr(poi, "address", None),
        "avg_visit_duration_minutes": int(
            getattr(poi, "avg_visit_duration_minutes", 60) or 60
        ),
        "rating": float(poi.rating),
        "cost_estimate": (
            float(poi.cost_estimate) if poi.cost_estimate is not None else None
        ),
        "open_time": poi.open_time,
        "close_time": poi.close_time,
        "mood_tags": mood,
        "normalized_rating": min(1.0, float(poi.rating) / 5.0),
        "primary_image_url": getattr(poi, "primary_image_url", None),
        "description": getattr(poi, "description", None),
    }


def normalize(user_context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Fetch all POIs, filter closed/over-budget, add travel_from_user, preference_weight, mood weight.
    Returns list of dicts (POI data) for greedy_filter and downstream.
    """
    # Never recommend places from another city when a city has not been
    # resolved. The chosen city's city_id is the source of truth.
    city_id = user_context.get("city_id")
    if not city_id:
        return []

    raw = get_all_pois(city_id=city_id)
    user_lat = user_context.get("latitude", 0.0)
    user_lon = user_context.get("longitude", 0.0)
    budget_val = user_context.get("budget")
    if budget_val is None or float(budget_val) <= 0:
        budget = 2500.0
    else:
        budget = float(budget_val)
    max_distance_km = user_context.get("max_distance_km", 75)
    preferences = [p.lower() for p in (user_context.get("preferences") or [])]
    mood = (user_context.get("mood") or "").lower()

    places = [_poi_to_dict(poi) for poi in raw]
    city_cost_ranges = build_category_ranges(places)

    out = []
    for d in places:
        place_categories = {
            str(category).lower() for category in d.get("categories", [])
        }
        place_vibes = {
            str(tag).lower() for tag in (d.get("mood_tags") or [])
        }

        # Selected categories are filters, not just soft ranking hints. This
        # prevents a Food request from being filled with unrelated Culture POIs.
        if preferences and not place_categories.intersection(preferences):
            continue

        # Chill is represented as a vibe in the database, not a category.
        if mood and mood not in place_vibes:
            continue

        is_preferred = bool(place_categories.intersection(preferences))

        # Unknown prices are never treated as free: they get an estimated range,
        # labelled as an estimate, whose low end counts toward the budget.
        d["cost_estimate_range"] = (
            estimate_range(d["category"], city_cost_ranges) if d["cost_estimate"] is None else None
        )
        if budget_cost(d) > budget_with_margin(budget):
            continue
        d["over_budget"] = budget_cost(d) > budget
        d["distance_from_user_km"] = _distance_km(user_lat, user_lon, d["latitude"], d["longitude"])
        if d["distance_from_user_km"] > max_distance_km:
            continue
        # Preference weight: 1.0 if category in preferences, else 0.3
        d["preference_weight"] = 1.0 if is_preferred else 0.3
        d["travel_from_user_minutes"] = _travel_minutes(user_lat, user_lon, d["latitude"], d["longitude"])
        out.append(d)
    return _drop_near_duplicates(out)


def _main_name_word(name: str) -> str:
    words = [w for w in re.findall(r"[a-z0-9]+", (name or "").lower()) if w not in _NAME_STOPWORDS]
    return words[0] if words else ""


def _drop_near_duplicates(places: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Keep one place from any pair within 75 m whose names start with the same word,
    e.g. "Baroda Museum" and "Baroda Museum & Picture Gallery" from two data sources.
    The higher-rated one (then the one with a listed price) is kept.
    """
    ranked = sorted(
        places,
        key=lambda p: (p["normalized_rating"], p["cost_estimate"] is not None),
        reverse=True,
    )
    kept: List[Dict[str, Any]] = []
    for place in ranked:
        word = _main_name_word(place["name"])
        is_duplicate = word and any(
            _main_name_word(other["name"]) == word
            and _distance_km(place["latitude"], place["longitude"], other["latitude"], other["longitude"])
            <= DUPLICATE_DISTANCE_KM
            for other in kept
        )
        if not is_duplicate:
            kept.append(place)
    return kept

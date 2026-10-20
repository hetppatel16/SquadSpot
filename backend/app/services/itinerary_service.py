"""Build an itinerary using verified places belonging to the selected city."""

import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


def _normalize_city_name(value: Any) -> str:
    if not value:
        return "your selected city"
    city = str(value).strip().split(",", 1)[0].strip()
    return city or "your selected city"


def _requested_preferences(user_context: Dict[str, Any]) -> List[str]:
    preferences = user_context.get("preferences") or []
    if isinstance(preferences, str):
        preferences = [preferences]
    return [str(item).strip().lower() for item in preferences if str(item).strip()]


def _empty_itinerary(user_context: Dict[str, Any], reason: str) -> Dict[str, Any]:
    """Return an honest empty result instead of inventing generic attractions."""
    city = _normalize_city_name(user_context.get("city") or user_context.get("location"))
    return {
        "title": f"Places in {city.title()}",
        "message": reason,
        "ordered_places": [],
        "timeline": [],
        "cost_breakdown": {"total": 0.0, "per_stop": []},
        "route": [],
        "total_satisfaction_score": 0.0,
    }


def _no_matching_places_message(user_context: Dict[str, Any]) -> str:
    city = _normalize_city_name(user_context.get("city") or user_context.get("location"))
    preferences = _requested_preferences(user_context)
    mood = str(user_context.get("mood") or "").strip().lower()

    requested = preferences[:]
    if mood:
        requested.append(mood)

    if requested:
        selection = ", ".join(requested)
        return (
            f"There are currently no verified places in {city} matching "
            f"your selected preferences ({selection}). Try changing your preferences."
        )
    return f"There are currently no verified places available in {city}. Please try another city."


def get_itinerary(user_context: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a city-scoped itinerary from the active places in Supabase."""
    from app.data_layer.normalizer import normalize
    from app.greedy_filter.filter import filter_top_k
    from app.ga_engine.ga_core import run_ga
    from app.scheduler.schedule import build_schedule
    from app.data_layer.repository import supabase

    requested_city = str(user_context.get("city") or "").strip()
    if not requested_city:
        return _empty_itinerary(user_context, "Please select a city before generating an itinerary.")

    # The frontend sends a label such as "Kochi, Kerala". Match the city name
    # and, when supplied, its state to avoid selecting a different city with
    # the same name.
    city_parts = [part.strip() for part in requested_city.split(",") if part.strip()]
    city_name = city_parts[0]
    city_query = (
        supabase.table("cities")
        .select("id, name, state_region, country, latitude, longitude")
        .eq("is_active", True)
        .ilike("name", city_name)
    )
    if len(city_parts) > 1:
        second_part = city_parts[1]
        if second_part.lower() not in {"india", "ind"}:
            city_query = city_query.ilike("state_region", second_part)
        else:
            city_query = city_query.ilike("country", second_part)

    city_response = city_query.limit(1).execute()
    if not city_response.data:
        return _empty_itinerary(
            user_context,
            f"{city_name} is not available in the active city list. Please select a listed city.",
        )

    city_data = city_response.data[0]
    user_context["city_id"] = city_data["id"]
    user_context["city"] = city_data["name"]
    user_context["latitude"] = float(city_data["latitude"])
    user_context["longitude"] = float(city_data["longitude"])

    # The normalizer now fetches only active places attached to this city_id.
    normalized_pois = normalize(user_context)
    if not normalized_pois:
        return _empty_itinerary(user_context, _no_matching_places_message(user_context))

    candidates = filter_top_k(normalized_pois, user_context, top_k=50)
    if not candidates:
        return _empty_itinerary(user_context, _no_matching_places_message(user_context))

    best_route_ids = run_ga(candidates, user_context)
    if not best_route_ids:
        return _empty_itinerary(user_context, _no_matching_places_message(user_context))

    poi_lookup = {poi["id"]: poi for poi in candidates}
    schedule = build_schedule(
        best_route_ids,
        user_context,
        poi_lookup,
        start_minutes=600,
    )

    ordered_places: List[Dict[str, Any]] = []
    timeline: List[Dict[str, Any]] = []
    for stop in schedule["timeline"]:
        poi = poi_lookup.get(stop["poi_id"])
        if not poi:
            continue

        place_id = str(poi["id"])
        latitude = float(poi["latitude"])
        longitude = float(poi["longitude"])
        address = poi.get("address")
        category = poi.get("category") or "Activity"
        raw_cost = poi.get("cost_estimate")
        cost = float(raw_cost) if raw_cost is not None else None

        ordered_places.append({
            "id": place_id,
            "name": poi["name"],
            "latitude": latitude,
            "longitude": longitude,
            "address": address,
        })
        timeline.append({
            "id": place_id,
            "place_id": place_id,
            "name": poi["name"],
            "category": category,
            "type": "Stop",
            "time": stop["arrival_time"],
            "price": cost,
            "cost": cost,
            "description": poi.get("description") or "Recommended based on your selected preferences.",
            "image_url": poi.get("primary_image_url"),
            "latitude": latitude,
            "longitude": longitude,
            "address": address,
        })

    if not timeline:
        return _empty_itinerary(user_context, _no_matching_places_message(user_context))

    return {
        "title": f"Perfect day in {city_data['name']}",
        "message": None,
        "ordered_places": ordered_places,
        "timeline": timeline,
        "cost_breakdown": {
            # This total is the subtotal of known per-person attraction fees.
            "total": schedule["cost_breakdown"]["total"],
            "per_stop": [item["cost"] for item in schedule["cost_breakdown"]["per_stop"]],
            "unknown_count": schedule["cost_breakdown"]["unknown_count"],
        },
        "route": schedule["route"],
        "total_satisfaction_score": schedule["total_satisfaction_score"],
    }

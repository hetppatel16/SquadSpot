# Phase 1: Convert raw POIs into optimization-ready format.
# Filters closed, over-budget; estimates travel times; normalizes ratings; sets preference/mood weights.

import json
from typing import Any, Dict, List

from app.constraint_engine.constraints import check_time_window
from app.data_layer.repository import get_all_pois


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
        "rating": float(poi.rating),
        "cost_estimate": float(poi.cost_estimate),
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
    raw = get_all_pois()
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

    out = []
    for poi in raw:
        d = _poi_to_dict(poi)
        is_preferred = d["category"].lower() in preferences
        
        # Soft budget cutoff for preferred categories to prevent pruning them when budget is tight.
        max_cost = max(budget, 500.0) if is_preferred else budget
        if d["cost_estimate"] > max_cost:
            continue
        d["distance_from_user_km"] = _distance_km(user_lat, user_lon, d["latitude"], d["longitude"])
        if d["distance_from_user_km"] > max_distance_km:
            continue
        # Preference weight: 1.0 if category in preferences, else 0.3
        d["preference_weight"] = 1.0 if is_preferred else 0.3
        d["travel_from_user_minutes"] = _travel_minutes(user_lat, user_lon, d["latitude"], d["longitude"])
        out.append(d)
    return out

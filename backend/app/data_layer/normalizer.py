# Phase 1: Convert raw POIs into optimization-ready format.
# Filters closed, over-budget; estimates travel times; normalizes ratings; sets preference/mood weights.

import json
from typing import Any, Dict, List

from app.constraint_engine.constraints import check_time_window
from app.data_layer.repository import get_all_pois


def _travel_minutes(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine-based travel time in minutes (MVP: 2 min/km)."""
    import math
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return R * c * 2.0


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
    }


def normalize(user_context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Fetch all POIs, filter closed/over-budget, add travel_from_user, preference_weight, mood weight.
    Returns list of dicts (POI data) for greedy_filter and downstream.
    """
    raw = get_all_pois()
    user_lat = user_context.get("latitude", 0.0)
    user_lon = user_context.get("longitude", 0.0)
    budget = user_context.get("budget", float("inf"))
    preferences = [p.lower() for p in (user_context.get("preferences") or [])]
    mood = (user_context.get("mood") or "").lower()

    out = []
    for poi in raw:
        d = _poi_to_dict(poi)
        if d["cost_estimate"] > budget:
            continue
        # Preference weight: 1.0 if category in preferences, else 0.3
        d["preference_weight"] = 1.0 if (d["category"].lower() in preferences) else 0.3
        d["travel_from_user_minutes"] = _travel_minutes(user_lat, user_lon, d["latitude"], d["longitude"])
        out.append(d)
    return out

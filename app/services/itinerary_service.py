# Orchestrates: normalizer -> greedy filter -> GA -> local optimizer -> scheduler.
# Single entry for "get itinerary from user context".

from typing import Any, Dict

from app.data_layer.normalizer import normalize
from app.greedy_filter.filter import filter_top_k
from app.ga_engine.ga_core import run_ga
from app.local_optimizer.refine import refine
from app.scheduler.schedule import build_schedule


def get_itinerary(user_context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Full pipeline: normalize -> filter top K -> GA -> local refine -> schedule.
    user_context: budget, total_time_minutes, preferences (list), mood, latitude, longitude.
    Returns: { "ordered_places": [...], "timeline": [...], "cost_breakdown": {...}, "route": [...], "total_satisfaction_score": float }
    """
    normalized = normalize(user_context)
    if not normalized:
        return {
            "ordered_places": [],
            "timeline": [],
            "cost_breakdown": {"total": 0.0, "per_stop": []},
            "route": [],
            "total_satisfaction_score": 0.0,
        }
    filtered = filter_top_k(normalized, user_context, top_k=100)
    if not filtered:
        filtered = normalized[:50]
    route_ids = run_ga(filtered, user_context, population_size=30, generations=50)
    poi_lookup = {p["id"]: p for p in filtered}
    route_ids = refine(route_ids, user_context, poi_lookup, max_iters=15)
    # Build full poi_lookup from normalized (in case GA returned ids not in filtered - fallback)
    for p in normalized:
        poi_lookup.setdefault(p["id"], p)
    start_minutes = 9 * 60  # 09:00 IST default
    schedule = build_schedule(route_ids, user_context, poi_lookup, start_minutes=start_minutes)
    ordered_places = [poi_lookup.get(pid) for pid in route_ids if poi_lookup.get(pid)]
    return {
        "ordered_places": ordered_places,
        "timeline": schedule["timeline"],
        "cost_breakdown": schedule["cost_breakdown"],
        "route": schedule["route"],
        "total_satisfaction_score": schedule["total_satisfaction_score"],
    }

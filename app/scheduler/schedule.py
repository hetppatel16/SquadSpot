# Build timeline (arrival/departure per stop), cost breakdown, route summary, total score.

from typing import Any, Dict, List

from app.scoring_engine.fitness import _travel_minutes, evaluate as fitness_evaluate


def build_schedule(
    route: List[int],
    user_context: Dict[str, Any],
    poi_lookup: Dict[int, Dict[str, Any]],
    start_minutes: int = 0,
) -> Dict[str, Any]:
    """
    start_minutes: minutes since midnight (IST) when user starts.
    Returns: { "timeline": [...], "cost_breakdown": {...}, "route": [...], "total_satisfaction_score": float }
    """
    timeline = []
    cost_breakdown = {"total": 0.0, "per_stop": []}
    route_summary = []
    user_lat = user_context.get("latitude", 0.0)
    user_lon = user_context.get("longitude", 0.0)
    prev_lat, prev_lon = user_lat, user_lon
    arrival_m = start_minutes

    for poi_id in route:
        poi = poi_lookup.get(poi_id)
        if not poi:
            continue
        travel_m = _travel_minutes(prev_lat, prev_lon, poi["latitude"], poi["longitude"])
        arrival_m += int(travel_m)
        arrival_m = arrival_m % (24 * 60)
        depart_m = arrival_m + 60  # 60 min visit
        timeline.append({
            "poi_id": poi_id,
            "name": poi.get("name", ""),
            "arrival_minutes": arrival_m,
            "departure_minutes": depart_m,
            "arrival_time": _minutes_to_hhmm(arrival_m),
            "departure_time": _minutes_to_hhmm(depart_m),
        })
        cost_breakdown["per_stop"].append({"poi_id": poi_id, "cost": poi.get("cost_estimate", 0)})
        cost_breakdown["total"] += poi.get("cost_estimate", 0)
        route_summary.append({"poi_id": poi_id, "name": poi.get("name", ""), "lat": poi["latitude"], "lon": poi["longitude"]})
        prev_lat, prev_lon = poi["latitude"], poi["longitude"]
        arrival_m = depart_m

    score = fitness_evaluate(route, user_context, poi_lookup)
    return {
        "timeline": timeline,
        "cost_breakdown": cost_breakdown,
        "route": route_summary,
        "total_satisfaction_score": round(score, 2),
    }


def _minutes_to_hhmm(m: int) -> str:
    m = m % (24 * 60)
    h, mm = divmod(m, 60)
    return f"{h:02d}:{mm:02d}"

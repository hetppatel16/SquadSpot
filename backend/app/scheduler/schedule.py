# Build timeline (arrival/departure per stop), cost breakdown, route summary, total score.

from typing import Any, Dict, List

from app.constraint_engine.constraints import DAY_MINUTES, fits_night_limit
from app.scoring_engine.fitness import _travel_minutes, evaluate as fitness_evaluate


def build_schedule(
    route: List[int],
    user_context: Dict[str, Any],
    poi_lookup: Dict[int, Dict[str, Any]],
    start_minutes: int = 0,
) -> Dict[str, Any]:
    """
    start_minutes: minutes since midnight (IST) when user starts.
    Stops that would break the late-night limit (see constraints) are left out.
    Returns: { "timeline", "cost_breakdown", "route", "total_satisfaction_score", "total_duration_minutes" }
    """
    timeline = []
    cost_breakdown = {
        "total": 0.0,
        "per_stop": [],
        "unknown_count": 0,
        "estimated_min": 0.0,
        "estimated_max": 0.0,
    }
    route_summary = []
    kept_route: List[int] = []
    user_lat = user_context.get("latitude", 0.0)
    user_lon = user_context.get("longitude", 0.0)
    prev_lat, prev_lon = user_lat, user_lon
    arrival_m = start_minutes
    stops_after_midnight = 0

    for poi_id in route:
        poi = poi_lookup.get(poi_id)
        if not poi:
            continue
        travel_m = _travel_minutes(prev_lat, prev_lon, poi["latitude"], poi["longitude"])
        # Clock time keeps counting past midnight so late stops stay in order.
        arrival_m += int(travel_m)
        visit_minutes = int(poi.get("avg_visit_duration_minutes") or 60)
        depart_m = arrival_m + visit_minutes
        if arrival_m >= DAY_MINUTES:
            stops_after_midnight += 1
        if not fits_night_limit(depart_m, stops_after_midnight):
            # Every later stop would be even later, so the day ends here.
            break

        kept_route.append(poi_id)
        timeline.append({
            "poi_id": poi_id,
            "name": poi.get("name", ""),
            "arrival_minutes": arrival_m,
            "departure_minutes": depart_m,
            "arrival_time": _minutes_to_hhmm(arrival_m),
            "departure_time": _minutes_to_hhmm(depart_m),
            "next_day": arrival_m >= DAY_MINUTES,
        })
        stop_cost = poi.get("cost_estimate")
        estimate = poi.get("cost_estimate_range")
        cost_breakdown["per_stop"].append({
            "poi_id": poi_id,
            "cost": stop_cost,
            "cost_known": stop_cost is not None,
            "estimate": list(estimate) if estimate else None,
        })
        if stop_cost is None:
            cost_breakdown["unknown_count"] += 1
            if estimate:
                cost_breakdown["estimated_min"] += float(estimate[0])
                cost_breakdown["estimated_max"] += float(estimate[1])
        else:
            cost_breakdown["total"] += float(stop_cost)
        route_summary.append({"poi_id": poi_id, "name": poi.get("name", ""), "lat": poi["latitude"], "lon": poi["longitude"]})
        prev_lat, prev_lon = poi["latitude"], poi["longitude"]
        arrival_m = depart_m

    score = fitness_evaluate(kept_route, user_context, poi_lookup)
    total_duration = (timeline[-1]["departure_minutes"] - start_minutes) if timeline else 0
    return {
        "timeline": timeline,
        "cost_breakdown": cost_breakdown,
        "route": route_summary,
        "total_satisfaction_score": round(score, 2),
        "total_duration_minutes": total_duration,
    }


def _minutes_to_hhmm(m: int) -> str:
    m = m % (24 * 60)
    h, mm = divmod(m, 60)
    return f"{h:02d}:{mm:02d}"

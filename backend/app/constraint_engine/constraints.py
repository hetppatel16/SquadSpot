# Time window, budget, and total-time checks. Used by normalizer and scoring_engine.

from typing import Any, Dict, List

# A single place may cost up to this fraction over the per-person budget.
# Such places are still offered but flagged as over budget in the response.
BUDGET_TOLERANCE = 0.20

DAY_MINUTES = 24 * 60
# A plan may run past midnight for a couple of stops, but never beyond 01:00.
LATEST_END_MINUTES = DAY_MINUTES + 60
MAX_STOPS_AFTER_MIDNIGHT = 2


def budget_cost(poi: Dict[str, Any]) -> float:
    """Per-person cost used for budget checks: the listed fee, else the low end of its estimate."""
    cost = poi.get("cost_estimate")
    if cost is not None:
        return float(cost)
    estimate = poi.get("cost_estimate_range")
    return float(estimate[0]) if estimate else 0.0


def budget_with_margin(budget: float) -> float:
    """Highest per-person cost (one place, or a whole route) still allowed for this budget."""
    return budget * (1 + BUDGET_TOLERANCE)


def fits_night_limit(departure_minutes: int, stops_after_midnight: int) -> bool:
    """True if a stop ends by 01:00 and no more than two stops start after midnight."""
    return departure_minutes <= LATEST_END_MINUTES and stops_after_midnight <= MAX_STOPS_AFTER_MIDNIGHT


def check_time_window(open_time: str, close_time: str, arrival_minutes: int) -> bool:
    """
    True if arrival_minutes (minutes since day start, 0-1439) falls within open_time-close_time.
    Times are "HH:MM" in IST; we compare as minutes-from-midnight.
    """
    open_m = _to_minutes(open_time)
    close_m = _to_minutes(close_time)
    if close_m <= open_m:  # spans midnight
        return arrival_minutes >= open_m or arrival_minutes < close_m
    return open_m <= arrival_minutes < close_m


def _to_minutes(hhmm: str) -> int:
    """Convert "HH:MM" to minutes since midnight."""
    parts = hhmm.strip().split(":")
    return int(parts[0]) * 60 + int(parts[1]) if len(parts) == 2 else 0


def check_budget(total_cost: float, budget: float) -> bool:
    """True if total_cost <= budget."""
    return total_cost <= budget


def check_total_time(total_minutes: float, available_minutes: float) -> bool:
    """True if total_minutes <= available_minutes."""
    return total_minutes <= available_minutes


def total_route_cost(poi_costs: List[float]) -> float:
    """Sum of cost_estimate for each POI in the route."""
    return sum(poi_costs)

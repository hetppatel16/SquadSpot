# Time window, budget, and total-time checks. Used by normalizer and scoring_engine.

from typing import List


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

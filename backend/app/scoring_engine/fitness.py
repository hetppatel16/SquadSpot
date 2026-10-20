# Greedy score (for pre-filter) and fitness (for GA). All scoring logic lives here.
# GA engine only calls evaluate(); it does not know mood/rating/traffic semantics.

import math
from typing import Any, Dict, List

from app.constraint_engine.constraints import (
    DAY_MINUTES,
    _to_minutes,
    budget_cost,
    check_time_window,
    budget_with_margin,
    fits_night_limit,
)

# Weights for fitness; can move to config later.
W_COVERAGE = 0.3
W_PREFERENCE = 0.2
W_MOOD = 0.15
W_RATING = 0.15
W_TRAVEL_PENALTY = 0.15
W_WAITING_PENALTY = 0.1
W_BUDGET_PENALTY = 0.1
# Rewards filling the requested time; without it the per-stop averages above
# would always prefer a single stop.
W_TIME_USE = 0.1

# Minutes per km for travel estimate (MVP heuristic).
MIN_PER_KM = 2.0


def _travel_minutes(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine-based travel time in minutes (MVP: MIN_PER_KM per km)."""
    R = 6371  # km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    km = R * c
    return km * MIN_PER_KM


def greedy_score(poi: Dict[str, Any], user_context: Dict[str, Any], travel_time_from_user: float) -> float:
    """
    Score for greedy pre-filter: preference_weight * rating / travel_time.
    Higher is better. Used by greedy_filter to take top K.
    """
    pref = poi.get("preference_weight", 0.5)
    rating = poi.get("normalized_rating", poi.get("rating", 0) / 5.0)
    t = max(travel_time_from_user, 1.0)  # avoid div by zero
    return pref * rating / t


def evaluate(
    route: List[int],
    user_context: Dict[str, Any],
    poi_lookup: Dict[int, Dict[str, Any]],
) -> float:
    """
    Fitness for a route (ordered list of POI ids). Higher is better.
    Combines: coverage_score, preference_match, mood_match, rating_score, minus travel/waiting/budget penalties.
    """
    if not route:
        return 0.0
        
    budget_val = user_context.get("budget")
    if budget_val is None or float(budget_val) <= 0:
        budget = 2500.0
    else:
        budget = float(budget_val)
        
    total_time_minutes = user_context.get("total_time_minutes", 480)
    user_lat = user_context.get("latitude", 0.0)
    user_lon = user_context.get("longitude", 0.0)
    user_mood = (user_context.get("mood") or "").lower()
    preferences = [p.lower() for p in (user_context.get("preferences") or [])]

    total_cost = 0.0
    total_minutes = 0.0
    prev_lat, prev_lon = user_lat, user_lon
    arrival_minutes = user_context.get("start_time_minutes", 600)  # default 10:00 AM (minutes since midnight)
    preference_sum = 0.0
    mood_sum = 0.0
    rating_sum = 0.0
    travel_penalty_sum = 0.0
    waiting_penalty_sum = 0.0
    stops_after_midnight = 0

    covered_categories = set()

    for poi_id in route:
        poi = poi_lookup.get(poi_id)
        if not poi:
            continue
            
        # Category coverage tracking
        poi_categories = {
            str(category).lower()
            for category in poi.get("categories", [poi.get("category", "")])
            if category
        }
        covered_categories.update(poi_categories.intersection(preferences))
            
        # Travel to this POI
        travel_m = _travel_minutes(prev_lat, prev_lon, poi["latitude"], poi["longitude"])
        total_minutes += travel_m
        # Clock time keeps counting past midnight (e.g. 1470 = 00:30 next day).
        arrival_minutes = int(arrival_minutes + travel_m)
        travel_penalty_sum += travel_m * 0.01  # small penalty per minute
        time_of_day = arrival_minutes % DAY_MINUTES

        # Time window check
        open_t = poi.get("open_time", "00:00")
        close_t = poi.get("close_time", "23:59")
        if not check_time_window(open_t, close_t, time_of_day):
            waiting_penalty_sum += 100  # heavy penalty if closed
        else:
            open_m = _to_minutes(open_t)
            if time_of_day < open_m:
                waiting_penalty_sum += (open_m - time_of_day) * 0.02  # waiting

        # Visit: add score components
        preference_sum += poi.get("preference_weight", 0.5)
        rating_sum += poi.get("normalized_rating", poi.get("rating", 0) / 5.0)
        mood_tags = poi.get("mood_tags") or []
        if isinstance(mood_tags, str):
            import json
            try:
                mood_tags = json.loads(mood_tags) if mood_tags else []
            except Exception:
                mood_tags = []
        if user_mood and user_mood in [str(m).lower() for m in mood_tags]:
            mood_sum += 1.0
        else:
            mood_sum += 0.3  # small default

        # Unknown prices count with the low end of their estimated range.
        total_cost += budget_cost(poi)

        # Use each place's stored visit duration instead of assuming every
        # attraction takes exactly one hour.
        visit_minutes = int(poi.get("avg_visit_duration_minutes") or 60)
        total_minutes += visit_minutes
        if arrival_minutes >= DAY_MINUTES:
            stops_after_midnight += 1
        departure_minutes = arrival_minutes + visit_minutes
        if not fits_night_limit(departure_minutes, stops_after_midnight):
            waiting_penalty_sum += 100  # treated like a closed place
        arrival_minutes = departure_minutes
        prev_lat, prev_lon = poi["latitude"], poi["longitude"]

    n = len(route)
    if n == 0:
        return 0.0
        
    preference_score = preference_sum / n
    mood_score = mood_sum / n
    rating_score = rating_sum / n
    
    # Calculate coverage of feasible preferences in the candidates pool to avoid penalizing if the database lacks a category
    available_categories = {
        str(category).lower()
        for poi in poi_lookup.values()
        for category in poi.get("categories", [poi.get("category", "")])
        if category
    }
    feasible_preferences = set(preferences).intersection(available_categories)
    
    if feasible_preferences:
        coverage_score = len(covered_categories.intersection(feasible_preferences)) / len(feasible_preferences)
    else:
        coverage_score = 1.0
        
    # Going over budget costs in proportion to the overspend; going beyond the
    # allowed margin outweighs every reward, so such routes are effectively rejected.
    budget_penalty = max(0.0, total_cost - budget) / budget
    if total_cost > budget_with_margin(budget):
        budget_penalty += 10.0
    time_penalty = max(0.0, total_minutes - total_time_minutes) * 0.05
    time_use = min(1.0, total_minutes / total_time_minutes) if total_time_minutes else 0.0

    fitness = (
        W_COVERAGE * coverage_score
        + W_PREFERENCE * preference_score
        + W_MOOD * mood_score
        + W_RATING * rating_score
        + W_TIME_USE * time_use
        - W_TRAVEL_PENALTY * min(travel_penalty_sum, 50.0)
        - W_WAITING_PENALTY * min(waiting_penalty_sum, 50.0)
        - W_BUDGET_PENALTY * budget_penalty
        - W_BUDGET_PENALTY * time_penalty
    )
    return max(0.0, fitness)

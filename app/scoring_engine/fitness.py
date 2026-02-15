# Greedy score (for pre-filter) and fitness (for GA). All scoring logic lives here.
# GA engine only calls evaluate(); it does not know mood/rating/traffic semantics.

import math
from typing import Any, Dict, List

from app.constraint_engine.constraints import check_time_window, _to_minutes

# Weights for fitness; can move to config later.
W_PREFERENCE = 0.25
W_MOOD = 0.2
W_RATING = 0.2
W_TRAVEL_PENALTY = 0.15
W_WAITING_PENALTY = 0.1
W_BUDGET_PENALTY = 0.1

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
    Combines: preference_match, mood_match, rating_score, minus travel/waiting/budget penalties.
    """
    if not route:
        return 0.0
    budget = user_context.get("budget", float("inf"))
    total_time_minutes = user_context.get("total_time_minutes", 480)
    user_lat = user_context.get("latitude", 0.0)
    user_lon = user_context.get("longitude", 0.0)
    user_mood = (user_context.get("mood") or "").lower()

    total_cost = 0.0
    total_minutes = 0.0
    prev_lat, prev_lon = user_lat, user_lon
    arrival_minutes = 0  # minutes since midnight (IST)
    preference_sum = 0.0
    mood_sum = 0.0
    rating_sum = 0.0
    travel_penalty_sum = 0.0
    waiting_penalty_sum = 0.0

    for poi_id in route:
        poi = poi_lookup.get(poi_id)
        if not poi:
            continue
        # Travel to this POI
        travel_m = _travel_minutes(prev_lat, prev_lon, poi["latitude"], poi["longitude"])
        total_minutes += travel_m
        arrival_minutes = int(arrival_minutes + travel_m) % (24 * 60)
        travel_penalty_sum += travel_m * 0.01  # small penalty per minute

        # Time window check
        open_t = poi.get("open_time", "00:00")
        close_t = poi.get("close_time", "23:59")
        if not check_time_window(open_t, close_t, arrival_minutes):
            waiting_penalty_sum += 100  # heavy penalty if closed
        else:
            open_m = _to_minutes(open_t)
            if arrival_minutes < open_m:
                waiting_penalty_sum += (open_m - arrival_minutes) * 0.02  # waiting

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

        cost = poi.get("cost_estimate", 0)
        total_cost += cost
        # Assume 60 min per visit for simplicity
        total_minutes += 60
        arrival_minutes = (arrival_minutes + 60) % (24 * 60)
        prev_lat, prev_lon = poi["latitude"], poi["longitude"]

    n = len(route)
    if n == 0:
        return 0.0
    preference_score = preference_sum / n
    mood_score = mood_sum / n
    rating_score = rating_sum / n
    budget_penalty = max(0, total_cost - budget) * 0.1
    time_penalty = max(0, total_minutes - total_time_minutes) * 0.05

    fitness = (
        W_PREFERENCE * preference_score
        + W_MOOD * mood_score
        + W_RATING * rating_score
        - W_TRAVEL_PENALTY * min(travel_penalty_sum, 50)
        - W_WAITING_PENALTY * min(waiting_penalty_sum, 50)
        - W_BUDGET_PENALTY * budget_penalty
        - W_BUDGET_PENALTY * time_penalty
    )
    return max(0.0, fitness)

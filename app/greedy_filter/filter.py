# Greedy pre-filter: score each POI, take top K. Used before GA.

from typing import Any, Dict, List

from app.scoring_engine.fitness import greedy_score


def filter_top_k(normalized_pois: List[Dict[str, Any]], user_context: Dict[str, Any], top_k: int = 100) -> List[Dict[str, Any]]:
    """
    Score each POI with greedy_score (preference * rating / travel_time), sort desc, return top_k.
    """
    scored = []
    for poi in normalized_pois:
        t = poi.get("travel_from_user_minutes", 1.0)
        s = greedy_score(poi, user_context, t)
        scored.append((s, poi))
    scored.sort(key=lambda x: -x[0])
    return [p for _, p in scored[:top_k]]

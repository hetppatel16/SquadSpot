# Greedy pre-filter: score each POI, take top K. Used before GA.

from typing import Any, Dict, List

from app.scoring_engine.fitness import greedy_score


def filter_top_k(normalized_pois: List[Dict[str, Any]], user_context: Dict[str, Any], top_k: int = 100) -> List[Dict[str, Any]]:
    """
    Score each POI with greedy_score, sort desc, ensure all requested preferences are represented,
    and return top_k candidates.
    """
    preferences = [p.lower() for p in (user_context.get("preferences") or [])]
    
    scored = []
    for poi in normalized_pois:
        t = poi.get("travel_from_user_minutes", 1.0)
        s = greedy_score(poi, user_context, t)
        scored.append((s, poi))
        
    scored.sort(key=lambda x: -x[0])
    
    if not preferences:
        return [p for _, p in scored[:top_k]]
        
    selected_ids = set()
    selected_pois = []
    
    # 1. First pass: Allocate some slots to guarantee representation of each requested category
    # (e.g. up to 10 or 15 slots per category depending on total capacity)
    per_cat_limit = max(5, top_k // (len(preferences) * 2))
    
    for pref in preferences:
        cat_count = 0
        for s, poi in scored:
            if poi.get("category", "").lower() == pref:
                if poi["id"] not in selected_ids:
                    selected_pois.append(poi)
                    selected_ids.add(poi["id"])
                    cat_count += 1
                    if cat_count >= per_cat_limit:
                        break
                        
    # 2. Second pass: Fill the remaining slots with the highest scoring candidates overall
    for s, poi in scored:
        if len(selected_pois) >= top_k:
            break
        if poi["id"] not in selected_ids:
            selected_pois.append(poi)
            selected_ids.add(poi["id"])
            
    return selected_pois

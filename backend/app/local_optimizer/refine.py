# Local optimization: try pairwise swaps; accept if fitness improves.

import random
from typing import Any, Dict, List

from app.scoring_engine.fitness import evaluate as fitness_evaluate


def refine(route: List[int], user_context: Dict[str, Any], poi_lookup: Dict[int, Dict[str, Any]], max_iters: int = 20) -> List[int]:
    """
    Try swapping pairs of stops; accept if fitness improves. Return refined route.
    """
    if len(route) < 2:
        return route
    best = list(route)
    best_score = fitness_evaluate(best, user_context, poi_lookup)
    for _ in range(max_iters):
        i, j = random.sample(range(len(best)), 2)
        candidate = list(best)
        candidate[i], candidate[j] = candidate[j], candidate[i]
        s = fitness_evaluate(candidate, user_context, poi_lookup)
        if s > best_score:
            best = candidate
            best_score = s
    return best

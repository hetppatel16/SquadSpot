# Custom GA: chromosome = ordered list of POI ids. Fitness = scoring_engine.evaluate(route).

import random
from typing import Any, Dict, List, Tuple

from app.scoring_engine.fitness import evaluate as fitness_evaluate

MAX_STOPS = 8


def _stop_range(total_time_minutes: int, candidate_count: int) -> Tuple[int, int]:
    """Allowed stop count: 1-3 for outings up to 3 hours, else about one stop per 90 minutes."""
    if total_time_minutes <= 180:
        low, high = 1, 3
    else:
        low = min(MAX_STOPS, round(total_time_minutes / 90))
        high = min(MAX_STOPS, low + 1)
    return min(low, candidate_count), min(high, candidate_count)


def run_ga(
    candidates: List[Dict[str, Any]],
    user_context: Dict[str, Any],
    population_size: int = 50,
    generations: int = 100,
    mutation_rate: float = 0.1,
) -> List[int]:
    """
    Run genetic algorithm. candidates = list of POI dicts (from greedy filter).
    Returns best route as list of POI ids.
    """
    if not candidates:
        return []
        
    poi_lookup = {p["id"]: p for p in candidates}
    ids = [p["id"] for p in candidates]
    
    # Dynamic Route Sizing based on Total Trip Duration
    total_time_minutes = user_context.get("total_time_minutes", 240)
    min_stops, max_stops = _stop_range(total_time_minutes, len(ids))

    def random_route() -> List[int]:
        n = random.randint(min_stops, max_stops)
        return random.sample(ids, n)

    def mutate(route: List[int]) -> List[int]:
        r = list(route)
        if len(r) < 2:
            return r
        # Standard Swap Mutation
        i, j = random.sample(range(len(r)), 2)
        r[i], r[j] = r[j], r[i]
        return r

    def crossover(a: List[int], b: List[int]) -> List[int]:
        if not a or not b:
            return list(a or b)
            
        # Determine child length dynamically to protect targeted cluster sizes
        target_len = random.randint(min_stops, max_stops)
        
        start = random.choice(a)
        child = [start]
        
        # Build child ensuring unique POI assignments without breaking bounds
        while len(child) < target_len:
            pool = [x for x in (a + b) if x not in child]
            if not pool:
                # If parents run dry, draw from overall available candidates
                pool = [x for x in ids if x not in child]
            if not pool:
                break
            child.append(random.choice(pool))
        return child

    # Initialize diverse initial population 
    population = [random_route() for _ in range(population_size)]
    
    for _ in range(generations):
        scored = [(fitness_evaluate(r, user_context, poi_lookup), r) for r in population]
        scored.sort(key=lambda x: -x[0])
        
        # Elitist Strategy: Keep top half, refill with generation mutations
        keep = population_size // 2
        new_pop = [r for _, r in scored[:keep]]
        
        while len(new_pop) < population_size:
            p1 = random.choice(scored[:keep])[1]
            p2 = random.choice(scored[:keep])[1]
            child = crossover(p1, p2)
            if random.random() < mutation_rate:
                child = mutate(child)
            # Prevent illegal empty configurations from polluting runtime iterations
            if child:
                new_pop.append(child)
                
        population = new_pop

    best = max(population, key=lambda r: fitness_evaluate(r, user_context, poi_lookup))
    return best
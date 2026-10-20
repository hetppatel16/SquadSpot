# Custom GA: chromosome = ordered list of POI ids. Fitness = scoring_engine.evaluate(route).

import math
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
    options = run_ga_options(candidates, user_context, 1, population_size, generations, mutation_rate)
    return options[0] if options else []


def run_ga_options(
    candidates: List[Dict[str, Any]],
    user_context: Dict[str, Any],
    count: int = 3,
    population_size: int = 50,
    generations: int = 100,
    mutation_rate: float = 0.1,
) -> List[List[int]]:
    """
    Run the genetic algorithm once and return up to `count` routes, best first,
    each visiting a different set of places (re-orderings of the same places
    do not count as separate options).
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

    # Best-scoring order seen for each distinct set of places, across all
    # generations; the alternative options are drawn from here.
    best_by_place_set: Dict[frozenset, Tuple[float, List[int]]] = {}

    def score_population(routes: List[List[int]]) -> List[Tuple[float, List[int]]]:
        scored_routes = [(fitness_evaluate(r, user_context, poi_lookup), r) for r in routes]
        for score, route in scored_routes:
            key = frozenset(route)
            if key not in best_by_place_set or score > best_by_place_set[key][0]:
                best_by_place_set[key] = (score, route)
        return scored_routes

    # Initialize diverse initial population
    population = [random_route() for _ in range(population_size)]

    for _ in range(generations):
        scored = score_population(population)
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

    score_population(population)
    ranked = [route for _, route in sorted(best_by_place_set.values(), key=lambda item: -item[0])]
    return _pick_varied_routes(ranked, count)


def _pick_varied_routes(ranked_routes: List[List[int]], count: int) -> List[List[int]]:
    """
    Take the best route, then alternatives in score order that swap out at
    least half of the places; when the city has too few places for that, fall
    back to alternatives that differ by at least one place.
    """
    chosen: List[List[int]] = []
    for strict in (True, False):
        for route in ranked_routes:
            if len(chosen) >= count:
                return chosen
            if route not in chosen and all(_differs_enough(route, other, strict) for other in chosen):
                chosen.append(route)
    return chosen


def _differs_enough(route: List[int], other: List[int], strict: bool) -> bool:
    new_places = len(set(route) - set(other))
    needed = math.ceil(max(len(route), len(other)) / 2) if strict else 1
    return new_places >= needed
# Custom GA: chromosome = ordered list of POI ids. Fitness = scoring_engine.evaluate(route).

import random
from typing import Any, Dict, List

from app.scoring_engine.fitness import evaluate as fitness_evaluate


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

    def random_route() -> List[int]:
        n = random.randint(1, min(8, len(ids)))
        return random.sample(ids, n)

    def mutate(route: List[int]) -> List[int]:
        r = list(route)
        if len(r) < 2:
            return r
        i, j = random.sample(range(len(r)), 2)
        r[i], r[j] = r[j], r[i]
        return r

    def crossover(a: List[int], b: List[int]) -> List[int]:
        if not a or not b:
            return a or b
        n = min(len(a), len(b), 6)
        start = random.choice(a)
        child = [start]
        for _ in range(n - 1):
            last = child[-1]
            pool = [x for x in (a + b) if x not in child]
            if not pool:
                break
            # Prefer POIs that appear in both or in a
            next_id = random.choice(pool)
            child.append(next_id)
        return child

    population = [random_route() for _ in range(population_size)]
    for _ in range(generations):
        scored = [(fitness_evaluate(r, user_context, poi_lookup), r) for r in population]
        scored.sort(key=lambda x: -x[0])
        # Keep top half, refill with offspring + mutations
        keep = population_size // 2
        new_pop = [r for _, r in scored[:keep]]
        while len(new_pop) < population_size:
            p1 = random.choice(scored[:keep])[1]
            p2 = random.choice(scored[:keep])[1]
            child = crossover(p1, p2)
            if random.random() < mutation_rate:
                child = mutate(child)
            new_pop.append(child)
        population = new_pop

    best = max(population, key=lambda r: fitness_evaluate(r, user_context, poi_lookup))
    return best

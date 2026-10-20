# Estimated per-person spend for places whose price is not listed.
# Estimates are ranges and are always labelled as estimates in the UI. They come
# from known prices of the same category in the same city; a fixed fallback range
# is used when the city has too few known prices for that category.

import math
from typing import Dict, Iterable, List, Tuple

CostRange = Tuple[float, float]

# Fewer known prices than this are too few to describe a category in a city.
MIN_KNOWN_PRICES = 5

# Rough per-person ranges in rupees, used only when a city lacks enough data.
FALLBACK_RANGES: Dict[str, CostRange] = {
    "food": (150, 400),
    "culture": (0, 100),
    "nature": (0, 50),
    "shopping": (300, 1500),
    "adventure": (200, 800),
    "movie": (200, 400),
}
DEFAULT_RANGE: CostRange = (0, 300)


def build_category_ranges(places: Iterable[Dict]) -> Dict[str, CostRange]:
    """Map each category to the typical (25th-75th percentile) known price in this city."""
    known: Dict[str, List[float]] = {}
    for place in places:
        cost = place.get("cost_estimate")
        if cost is None:
            continue
        for category in place.get("categories") or [place.get("category")]:
            if category:
                known.setdefault(str(category).lower(), []).append(float(cost))

    ranges: Dict[str, CostRange] = {}
    for category, costs in known.items():
        if len(costs) >= MIN_KNOWN_PRICES:
            costs.sort()
            ranges[category] = (_percentile(costs, 0.25), _percentile(costs, 0.75))
    return ranges


def estimate_range(category: str, city_ranges: Dict[str, CostRange]) -> CostRange:
    """Estimated per-person spend for a place of this category, rounded to ₹10."""
    key = str(category or "").lower()
    low, high = city_ranges.get(key) or FALLBACK_RANGES.get(key) or DEFAULT_RANGE
    return (math.floor(low / 10) * 10, math.ceil(high / 10) * 10)


def _percentile(sorted_values: List[float], fraction: float) -> float:
    return sorted_values[round(fraction * (len(sorted_values) - 1))]

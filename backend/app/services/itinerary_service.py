from typing import Any, Dict, List, Tuple

def _normalize_city_name(value: Any) -> str:
    if not value:
        return "your city"
    text = str(value).strip()
    if not text:
        return "your city"
    return text.split(",")[0].strip() or text


def _infer_preferences(user_context: Dict[str, Any]) -> List[str]:
    prefs = user_context.get("preferences") or []
    if isinstance(prefs, str):
        prefs = [prefs]
    normalized = [str(item).strip().lower() for item in prefs if str(item).strip()]
    return normalized


def _build_fallback_itinerary(user_context: Dict[str, Any]) -> Dict[str, Any]:
    budget = float(user_context.get("budget") or 0)
    city = _normalize_city_name(user_context.get("location") or user_context.get("city"))
    prefs = _infer_preferences(user_context)
    mood = str(user_context.get("mood") or "relaxed").lower()

    if budget <= 0:
        budget = 2500

    vibe_pref = "food" if "food" in prefs else "nature" if "nature" in prefs else "culture" if "culture" in prefs else "adventure" if "adventure" in prefs else "chill"
    if mood in {"adventurous", "adventure"}:
        vibe_pref = "adventure"
    elif mood in {"relaxed", "chill"}:
        vibe_pref = "chill"

    stops: List[Dict[str, Any]] = []
    if vibe_pref == "food":
        stops = [
            {"name": f"Local Food Trail in {city}", "category": "Food", "type": "Lunch", "time": "12:30 PM", "price": min(450.0, budget * 0.25), "description": "A curated local food stop that fits your budget and flavor profile.", "image_url": "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=600"},
            {"name": f"Sunset Cafe in {city}", "category": "Food", "type": "Coffee Break", "time": "04:30 PM", "price": min(300.0, budget * 0.15), "description": "Relax at a scenic cafe before the evening plan.", "image_url": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600"},
        ]
    elif vibe_pref == "adventure":
        stops = [
            {"name": f"Adventure Point in {city}", "category": "Adventure", "type": "Outdoor Activity", "time": "10:30 AM", "price": min(700.0, budget * 0.3), "description": "An energetic activity to maximize excitement.", "image_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600"},
            {"name": f"Scenic Viewpoint in {city}", "category": "Sightseeing", "type": "Evening Walk", "time": "06:30 PM", "price": min(200.0, budget * 0.1), "description": "Enjoy the skyline and a relaxed walk.", "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600"},
        ]
    elif vibe_pref == "culture":
        stops = [
            {"name": f"Heritage Site in {city}", "category": "Culture", "type": "Museum / Landmark", "time": "11:00 AM", "price": min(500.0, budget * 0.2), "description": "A meaningful cultural landmark with local history.", "image_url": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=600"},
            {"name": f"Local Market in {city}", "category": "Shopping", "type": "Street Walk", "time": "05:00 PM", "price": min(400.0, budget * 0.15), "description": "Browse handcrafted stores and local finds.", "image_url": "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600"},
        ]
    else:
        stops = [
            {"name": f"Garden / Park in {city}", "category": "Nature", "type": "Leisure Walk", "time": "11:00 AM", "price": min(150.0, budget * 0.08), "description": "A calm outdoor stop for a balanced day.", "image_url": "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=600"},
            {"name": f"Cafe Stop in {city}", "category": "Food", "type": "Chill Break", "time": "04:00 PM", "price": min(250.0, budget * 0.12), "description": "Take a relaxed break and enjoy local flavors.", "image_url": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600"},
        ]

    if budget < 1200:
        stops = stops[:1]

    timeline = []
    for index, stop in enumerate(stops):
        timeline.append({
            "id": f"stop-{index + 1}",
            "name": stop["name"],
            "category": stop["category"],
            "type": stop["type"],
            "time": stop["time"],
            "price": float(stop["price"]),
            "cost": float(stop["price"]),
            "description": stop["description"],
            "image_url": stop["image_url"]  # Added field in fallback paths
        })

    total_cost = round(sum(item["price"] for item in timeline), 2)
    if total_cost > budget and budget > 0:
        scaled = [round(min(item["price"], budget * 0.35), 2) for item in timeline]
        for idx, item in enumerate(timeline):
            item["price"] = scaled[idx]
            item["cost"] = scaled[idx]
        total_cost = round(sum(item["price"] for item in timeline), 2)

    return {
        "title": f"Perfect Day in {city.title()}",
        "ordered_places": [
            {"id": item["id"], "name": item["name"], "latitude": 0.0, "longitude": 0.0}
            for item in timeline
        ],
        "timeline": timeline,
        "cost_breakdown": {"total": total_cost, "per_stop": [item["price"] for item in timeline]},
        "route": [],
        "total_satisfaction_score": round(min(99.0, 85.0 + (budget / 5000) * 8), 2),
    }


def get_itinerary(user_context: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a trip plan from city, budget, preferences, and mood."""
    try:
        from app.data_layer.normalizer import normalize
        from app.greedy_filter.filter import filter_top_k
        from app.ga_engine.ga_core import run_ga
        from app.scheduler.schedule import build_schedule
        from app.data_layer.repository import supabase

        city_name = user_context.get("city")
        if city_name:
            # Clean and match the city name case-insensitively
            clean_city = city_name.split(",")[0].strip()
            res = supabase.table("cities").select("*").ilike("name", clean_city).execute()
            if res.data:
                city_data = res.data[0]
                user_context["city_id"] = city_data["id"]
                # Override default user coordinates with city coordinates for center mapping
                user_context["latitude"] = float(city_data["latitude"])
                user_context["longitude"] = float(city_data["longitude"])

        # Phase 1: Normalization (fetch database records, filter distance/budget constraints)
        normalized_pois = normalize(user_context)
        
        if not normalized_pois:
            return _build_fallback_itinerary(user_context)

        # Phase 2: Greedy pre-filter (select top candidates)
        candidates = filter_top_k(normalized_pois, user_context, top_k=50)

        if not candidates:
            return _build_fallback_itinerary(user_context)

        # Phase 3: Genetic Algorithm (optimize stop sequence)
        best_route_ids = run_ga(candidates, user_context)

        if not best_route_ids:
            return _build_fallback_itinerary(user_context)

        # Phase 4: Schedule building (assign timelines, costs, route summaries)
        poi_lookup = {p["id"]: p for p in candidates}
        schedule = build_schedule(best_route_ids, user_context, poi_lookup, start_minutes=600)  # Start at 10:00 AM (600 mins)

        # Map optimization format to frontend API model structure
        ordered_places = []
        timeline = []
        for stop in schedule["timeline"]:
            poi = poi_lookup[stop["poi_id"]]
            ordered_places.append({
                "id": str(poi["id"]),
                "name": poi["name"],
                "latitude": poi["latitude"],
                "longitude": poi["longitude"]
            })
            
            # Extract image_url property cleanly from our POI data structure
            # Supports both dictionary objects and Custom Class attribute lookups gracefully
            poi_image = poi.get("primary_image_url") if isinstance(poi, dict) else getattr(poi, "primary_image_url", None)
            poi_desc = poi.get("description") if isinstance(poi, dict) else getattr(poi, "description", None)
            poi_category = poi.get("category") if isinstance(poi, dict) else getattr(poi, "category", "Activity")
            poi_cost = poi.get("cost_estimate") if isinstance(poi, dict) else getattr(poi, "cost_estimate", 0)

            timeline.append({
                "id": str(poi["id"] if isinstance(poi, dict) else poi.id),
                "name": poi["name"] if isinstance(poi, dict) else poi.name,
                "category": poi_category,
                "type": "Stop",
                "time": stop["arrival_time"],
                "price": poi_cost,
                "cost": poi_cost,
                "description": poi_desc or f"Recommended based on your preferences.",
                "image_url": poi_image # Injected database field link into live pipeline timeline
            })

        city_title = city_name.split(",")[0].strip() if city_name else "Your City"
        return {
            "title": f"Perfect day in {city_title}",
            "ordered_places": ordered_places,
            "timeline": timeline,
            "cost_breakdown": {
                "total": schedule["cost_breakdown"]["total"],
                "per_stop": [item["cost"] for item in schedule["cost_breakdown"]["per_stop"]]
            },
            "route": schedule["route"],
            "total_satisfaction_score": schedule["total_satisfaction_score"]
        }
    except Exception as e:
        print("Error in Genetic Algorithm itinerary pipeline:", e)
        import traceback
        traceback.print_exc()

    return _build_fallback_itinerary(user_context)
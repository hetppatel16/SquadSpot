# FastAPI routes: POST /itinerary, GET /pois, GET /health.

import logging

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.schemas import ItineraryRequest, ItineraryResponse
from app.services.itinerary_service import get_itinerary
from app.data_layer.repository import (
    get_all_pois,
    search_active_cities,
)
from app.core.security import get_current_user
from app.constraint_engine.constraints import _to_minutes

router = APIRouter(prefix="/api", tags=["itinerary"])
logger = logging.getLogger(__name__)

DEFAULT_START_MINUTES = 10 * 60  # 10:00


@router.post("/itinerary", response_model=ItineraryResponse)
def post_itinerary(req: ItineraryRequest, current_user=Depends(get_current_user)):
    """Generate itinerary from user constraints and preferences."""
    try:
        ctx = {
            "budget": req.budget,
            "total_time_minutes": req.total_time_minutes,
            "preferences": req.preferences,
            "mood": req.mood,
            "latitude": req.latitude,
            "longitude": req.longitude,
            "city": req.city,
            "start_time_minutes": _to_minutes(req.start_time) if req.start_time else DEFAULT_START_MINUTES,
            "use_my_location": req.use_my_location,
        }
        result = get_itinerary(ctx)
        return ItineraryResponse(**result)
    except Exception:
        logger.exception("Itinerary generation failed for an authenticated request")
        raise HTTPException(
            status_code=500,
            detail="Unable to generate an itinerary right now. Please try again.",
        )


@router.get("/pois")
def get_pois():
    """List all POIs (for debugging or mobile sync)."""
    pois = get_all_pois()
    return [{"id": p.id, "name": p.name, "category": p.category, "latitude": p.latitude, "longitude": p.longitude} for p in pois]
@router.get("/cities", tags=["cities"])
def get_cities(
    search: str | None = Query(default=None, max_length=80),
    limit: int = Query(default=50, ge=1, le=100),
):
    """
    Get active cities.
    Supports optional city-name search.
    """

    try:
        cities = search_active_cities(
            search=search,
            limit=limit,
        )

        return cities

    except Exception:
        logger.exception("Failed to fetch cities from Supabase")

        raise HTTPException(
            status_code=503,
            detail="Unable to fetch cities right now. Please try again.",
        )


@router.get("/health")
def health():
    return {"status": "ok"}

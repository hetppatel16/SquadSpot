# FastAPI routes: POST /itinerary, GET /pois, GET /health.

from fastapi import APIRouter, HTTPException

from app.api.schemas import ItineraryRequest, ItineraryResponse
from app.services.itinerary_service import get_itinerary
from app.data_layer.repository import get_all_pois

router = APIRouter(prefix="/api", tags=["itinerary"])


@router.post("/itinerary", response_model=ItineraryResponse)
def post_itinerary(req: ItineraryRequest):
    """Generate itinerary from user constraints and preferences."""
    try:
        ctx = {
            "budget": req.budget,
            "total_time_minutes": req.total_time_minutes,
            "preferences": req.preferences,
            "mood": req.mood,
            "latitude": req.latitude,
            "longitude": req.longitude,
        }
        result = get_itinerary(ctx)
        return ItineraryResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pois")
def get_pois():
    """List all POIs (for debugging or mobile sync)."""
    pois = get_all_pois()
    return [{"id": p.id, "name": p.name, "category": p.category, "latitude": p.latitude, "longitude": p.longitude} for p in pois]


@router.get("/health")
def health():
    return {"status": "ok"}

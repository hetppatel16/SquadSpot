# Pydantic request/response models for itinerary API.

from typing import List, Optional

from pydantic import BaseModel, Field


class ItineraryRequest(BaseModel):
    budget: float = Field(..., description="Max budget (e.g. rupees)")
    total_time_minutes: int = Field(..., description="Available time in minutes")
    preferences: List[str] = Field(default_factory=list, description="e.g. food, movie, culture")
    mood: Optional[str] = Field(None, description="e.g. relaxed, adventurous")
    latitude: float = Field(..., description="User location lat")
    longitude: float = Field(..., description="User location lon")


class ItineraryResponse(BaseModel):
    ordered_places: List[dict]
    timeline: List[dict]
    cost_breakdown: dict
    route: List[dict]
    total_satisfaction_score: float

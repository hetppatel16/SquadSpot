# Pydantic request/response models for itinerary API.

from typing import List, Optional

from pydantic import BaseModel, Field

from pydantic import BaseModel, EmailStr

class SignUpRequest(BaseModel):
    name: str
    email: EmailStr  
    password: str
    phone: str

class LoginRequest(BaseModel):
    email: EmailStr  
    password: str


class ItineraryRequest(BaseModel):
    budget: float = Field(..., description="Max budget (e.g. rupees)")
    total_time_minutes: int = Field(..., description="Available time in minutes")
    preferences: List[str] = Field(default_factory=list, description="e.g. food, movie, culture")
    mood: Optional[str] = Field(None, description="e.g. relaxed, adventurous")
    latitude: float = Field(..., description="User location lat")
    longitude: float = Field(..., description="User location lon")
    city: Optional[str] = Field(None, description="Selected city name")


class ItineraryResponse(BaseModel):
    title: Optional[str] = Field(None, description="Itinerary title")
    ordered_places: List[dict]
    timeline: List[dict]
    cost_breakdown: dict
    route: List[dict]
    total_satisfaction_score: float

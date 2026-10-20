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
    budget: float = Field(
        ...,
        gt=0,
        allow_inf_nan=False,
        description="Max budget (e.g. rupees)"
    )
    total_time_minutes: int = Field(
    ...,
    gt=0,
    description="Available time in minutes"
    )
    preferences: List[str] = Field(default_factory=list, description="e.g. food, movie, culture")
    mood: Optional[str] = Field(None, description="e.g. relaxed, adventurous")
    # Optional: the itinerary is planned from the selected city's centre.
    # Defaults to Vadodara, the city SquadSpot was first built for.
    latitude: float = Field(22.3072, description="User location lat")
    longitude: float = Field(73.1812, description="User location lon")
    city: Optional[str] = Field(None, description="Selected city name")
    start_time: Optional[str] = Field(
        None,
        pattern=r"^([01]\d|2[0-3]):[0-5]\d$",
        description="Outing start time as HH:MM (defaults to 10:00)",
    )


class ItineraryResponse(BaseModel):
    title: Optional[str] = Field(None, description="Itinerary title")
    message: Optional[str] = Field(None, description="Explanation when no matching places are available")
    ordered_places: List[dict]
    timeline: List[dict]
    cost_breakdown: dict
    route: List[dict]
    total_satisfaction_score: float
    total_duration_minutes: int = Field(0, description="Minutes from start to leaving the last stop")
    exceeds_duration: bool = Field(False, description="True when the plan runs longer than requested")

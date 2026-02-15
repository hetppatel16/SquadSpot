# POI (Point of Interest) model and database schema.
# Single source of truth for place data used by the algorithm and API.
# SQLAlchemy declarative base; table name: pois.
# Timezone: IST for MVP; other timezones can be added later.

from datetime import datetime
from zoneinfo import ZoneInfo
from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import declarative_base

# IST for created_at and for interpreting open/close times in MVP.
IST = ZoneInfo("Asia/Kolkata")

# Base class for all models in this app (only POI for now).
Base = declarative_base()


class POI(Base):
    """
    One place (cafe, movie, park, restaurant, etc.) that can appear in an itinerary.
    Stored in table 'pois'. Used by data_layer (repository, normalizer) and downstream pipeline.
    """

    __tablename__ = "pois"

    # Primary key; auto-increment.
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Display name (e.g. "Cafe A", "Movie Theater B").
    name = Column(String(255), nullable=False)

    # Location for distance/travel and map.
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Category for preference matching (e.g. food, movie, culture).
    category = Column(String(64), nullable=False)

    # Rating, e.g. 0–5 or 0–10; normalized later in scoring.
    rating = Column(Float, nullable=False)

    # Estimated cost per visit (same currency as user budget, e.g. rupees).
    cost_estimate = Column(Float, nullable=False)

    # Open/close as "HH:MM" strings; interpreted as IST for MVP.
    open_time = Column(String(5), nullable=False)
    close_time = Column(String(5), nullable=False)

    # Mood tags for mood_match scoring (e.g. ["relaxed", "adventurous"]).
    # Stored as JSON string in SQLite for portability.
    mood_tags = Column(Text, nullable=True)

    # Optional: when this POI was added (auditing / sync); stored in IST.
    created_at = Column(DateTime, default=lambda: datetime.now(IST), nullable=True)

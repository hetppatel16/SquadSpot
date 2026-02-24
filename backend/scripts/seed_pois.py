# Seed sample POIs into the database. Run from project root: python -m scripts.seed_pois
# Creates tables if missing, then inserts 30 sample POIs (mix of categories, moods, costs).

import json
import sys
from pathlib import Path

# Add project root so "app" is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.data_layer.database import create_tables, get_session
from app.data_layer.models import POI


def seed():
    create_tables()
    with get_session() as session:
        # Check if already seeded
        if session.query(POI).count() > 0:
            print("POIs already present; skip seeding.")
            return
        samples = [
            {"name": "Cafe A", "latitude": 28.6139, "longitude": 77.2090, "category": "food", "rating": 4.5, "cost_estimate": 300, "open_time": "08:00", "close_time": "22:00", "mood_tags": ["relaxed"]},
            {"name": "Movie B", "latitude": 28.6140, "longitude": 77.2095, "category": "movie", "rating": 4.2, "cost_estimate": 250, "open_time": "10:00", "close_time": "23:00", "mood_tags": ["relaxed", "adventurous"]},
            {"name": "Park C", "latitude": 28.6145, "longitude": 77.2100, "category": "culture", "rating": 4.8, "cost_estimate": 0, "open_time": "06:00", "close_time": "20:00", "mood_tags": ["relaxed"]},
            {"name": "Restaurant D", "latitude": 28.6150, "longitude": 77.2105, "category": "food", "rating": 4.0, "cost_estimate": 600, "open_time": "12:00", "close_time": "23:00", "mood_tags": ["relaxed"]},
            {"name": "Arcade E", "latitude": 28.6155, "longitude": 77.2110, "category": "movie", "rating": 3.8, "cost_estimate": 400, "open_time": "11:00", "close_time": "22:00", "mood_tags": ["adventurous"]},
        ]
        for s in samples:
            mood = json.dumps(s["mood_tags"]) if isinstance(s["mood_tags"], list) else s["mood_tags"]
            poi = POI(
                name=s["name"],
                latitude=s["latitude"],
                longitude=s["longitude"],
                category=s["category"],
                rating=s["rating"],
                cost_estimate=s["cost_estimate"],
                open_time=s["open_time"],
                close_time=s["close_time"],
                mood_tags=mood,
            )
            session.add(poi)
        # Add more variety (25 more)
        categories = ["food", "movie", "culture"]
        moods_list = [["relaxed"], ["adventurous"], ["relaxed", "adventurous"]]
        for i in range(25):
            lat = 28.6139 + (i % 10) * 0.01
            lon = 77.2090 + (i % 10) * 0.01
            poi = POI(
                name=f"Place {i+6}",
                latitude=lat,
                longitude=lon,
                category=categories[i % 3],
                rating=3.5 + (i % 5) * 0.2,
                cost_estimate=(i % 5) * 150,
                open_time="09:00",
                close_time="21:00",
                mood_tags=json.dumps(moods_list[i % 3]),
            )
            session.add(poi)
    print("Seeded 30 POIs.")


if __name__ == "__main__":
    seed()

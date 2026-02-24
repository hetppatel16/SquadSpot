# Seed sample POIs into the database. Run from project root: python -m scripts.seed_pois
# Creates tables if missing, then inserts POIs for cities supported by the frontend.

import json
import sys
from pathlib import Path

# Add project root so "app" is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.data_layer.database import create_tables, get_session
from app.data_layer.models import POI


# Real-ish POIs for cities the frontend supports
CITY_POIS = [
    # ── Vadodara, Gujarat ─────────────────────────────────────────────
    {"name": "Sayaji Baug", "latitude": 22.3100, "longitude": 73.1900, "category": "culture", "rating": 4.7, "cost_estimate": 0, "open_time": "05:30", "close_time": "21:00", "mood_tags": ["relaxed"]},
    {"name": "Laxmi Vilas Palace", "latitude": 22.2933, "longitude": 73.1907, "category": "culture", "rating": 4.8, "cost_estimate": 250, "open_time": "09:30", "close_time": "17:00", "mood_tags": ["relaxed", "adventurous"]},
    {"name": "Mandvi Gate", "latitude": 22.2982, "longitude": 73.2023, "category": "culture", "rating": 4.2, "cost_estimate": 0, "open_time": "00:00", "close_time": "23:59", "mood_tags": ["relaxed"]},
    {"name": "EME Temple", "latitude": 22.3137, "longitude": 73.1816, "category": "culture", "rating": 4.5, "cost_estimate": 0, "open_time": "06:00", "close_time": "20:00", "mood_tags": ["relaxed"]},
    {"name": "Raju Omlet", "latitude": 22.2995, "longitude": 73.2015, "category": "food", "rating": 4.3, "cost_estimate": 150, "open_time": "17:00", "close_time": "23:30", "mood_tags": ["relaxed", "adventurous"]},
    {"name": "Kala Ghoda Cafe", "latitude": 22.3050, "longitude": 73.1950, "category": "food", "rating": 4.4, "cost_estimate": 300, "open_time": "10:00", "close_time": "22:00", "mood_tags": ["relaxed"]},
    {"name": "Ratribazar", "latitude": 22.3000, "longitude": 73.2000, "category": "food", "rating": 4.1, "cost_estimate": 200, "open_time": "18:00", "close_time": "00:00", "mood_tags": ["adventurous"]},
    {"name": "Dairy Den", "latitude": 22.3010, "longitude": 73.1960, "category": "food", "rating": 4.3, "cost_estimate": 100, "open_time": "11:00", "close_time": "23:00", "mood_tags": ["relaxed"]},
    {"name": "Inox Multiplex", "latitude": 22.3070, "longitude": 73.1870, "category": "movie", "rating": 4.2, "cost_estimate": 300, "open_time": "09:00", "close_time": "00:00", "mood_tags": ["relaxed", "adventurous"]},
    {"name": "Cinepolis Vadodara", "latitude": 22.3200, "longitude": 73.1750, "category": "movie", "rating": 4.0, "cost_estimate": 280, "open_time": "09:00", "close_time": "00:00", "mood_tags": ["relaxed"]},
    {"name": "Ajwa Fun World", "latitude": 22.2600, "longitude": 73.1250, "category": "nature", "rating": 4.1, "cost_estimate": 400, "open_time": "10:00", "close_time": "18:00", "mood_tags": ["adventurous"]},
    {"name": "Sursagar Lake", "latitude": 22.2997, "longitude": 73.1960, "category": "nature", "rating": 4.0, "cost_estimate": 0, "open_time": "00:00", "close_time": "23:59", "mood_tags": ["relaxed"]},
    {"name": "Baroda Museum", "latitude": 22.3085, "longitude": 73.1885, "category": "culture", "rating": 4.6, "cost_estimate": 20, "open_time": "10:30", "close_time": "17:30", "mood_tags": ["relaxed"]},
    {"name": "Haldiram's Vadodara", "latitude": 22.3105, "longitude": 73.1810, "category": "food", "rating": 4.0, "cost_estimate": 250, "open_time": "09:00", "close_time": "22:30", "mood_tags": ["relaxed"]},
    {"name": "Kamati Baug", "latitude": 22.3095, "longitude": 73.1890, "category": "nature", "rating": 4.5, "cost_estimate": 0, "open_time": "06:00", "close_time": "20:00", "mood_tags": ["relaxed"]},

    # ── Ahmedabad, Gujarat ────────────────────────────────────────────
    {"name": "Sabarmati Ashram", "latitude": 23.0607, "longitude": 72.5800, "category": "culture", "rating": 4.8, "cost_estimate": 0, "open_time": "08:30", "close_time": "18:00", "mood_tags": ["relaxed"]},
    {"name": "Kankaria Lake", "latitude": 23.0069, "longitude": 72.6005, "category": "nature", "rating": 4.5, "cost_estimate": 25, "open_time": "09:00", "close_time": "22:00", "mood_tags": ["relaxed", "adventurous"]},
    {"name": "Manek Chowk", "latitude": 23.0255, "longitude": 72.5873, "category": "food", "rating": 4.6, "cost_estimate": 200, "open_time": "20:00", "close_time": "02:00", "mood_tags": ["adventurous"]},
    {"name": "Law Garden Night Market", "latitude": 23.0287, "longitude": 72.5620, "category": "food", "rating": 4.4, "cost_estimate": 300, "open_time": "18:00", "close_time": "23:00", "mood_tags": ["adventurous"]},
    {"name": "Science City", "latitude": 23.0725, "longitude": 72.5123, "category": "culture", "rating": 4.3, "cost_estimate": 350, "open_time": "10:00", "close_time": "19:30", "mood_tags": ["adventurous"]},
    {"name": "SG Highway Food Street", "latitude": 23.0350, "longitude": 72.5070, "category": "food", "rating": 4.2, "cost_estimate": 250, "open_time": "11:00", "close_time": "23:30", "mood_tags": ["relaxed"]},
    {"name": "Adalaj Stepwell", "latitude": 23.1668, "longitude": 72.5823, "category": "culture", "rating": 4.7, "cost_estimate": 0, "open_time": "08:00", "close_time": "17:00", "mood_tags": ["relaxed"]},
    {"name": "Cinepolis Ahmedabad", "latitude": 23.0300, "longitude": 72.5100, "category": "movie", "rating": 4.1, "cost_estimate": 300, "open_time": "09:00", "close_time": "00:00", "mood_tags": ["relaxed"]},

    # ── Surat, Gujarat ────────────────────────────────────────────────
    {"name": "Dumas Beach", "latitude": 21.0883, "longitude": 72.7146, "category": "nature", "rating": 4.2, "cost_estimate": 0, "open_time": "00:00", "close_time": "23:59", "mood_tags": ["relaxed", "adventurous"]},
    {"name": "Dutch Garden", "latitude": 21.1960, "longitude": 72.8310, "category": "nature", "rating": 4.0, "cost_estimate": 0, "open_time": "06:00", "close_time": "21:00", "mood_tags": ["relaxed"]},
    {"name": "Surat Castle", "latitude": 21.1889, "longitude": 72.8361, "category": "culture", "rating": 4.1, "cost_estimate": 0, "open_time": "08:00", "close_time": "18:00", "mood_tags": ["relaxed"]},
    {"name": "Surat Locho Corner", "latitude": 21.1950, "longitude": 72.8300, "category": "food", "rating": 4.5, "cost_estimate": 100, "open_time": "07:00", "close_time": "22:00", "mood_tags": ["relaxed"]},
    {"name": "VR Surat Mall", "latitude": 21.1427, "longitude": 72.7711, "category": "movie", "rating": 4.2, "cost_estimate": 350, "open_time": "10:00", "close_time": "22:00", "mood_tags": ["relaxed", "adventurous"]},

    # ── Mumbai, Maharashtra ───────────────────────────────────────────
    {"name": "Gateway of India", "latitude": 18.9220, "longitude": 72.8347, "category": "culture", "rating": 4.7, "cost_estimate": 0, "open_time": "00:00", "close_time": "23:59", "mood_tags": ["relaxed"]},
    {"name": "Marine Drive", "latitude": 18.9432, "longitude": 72.8235, "category": "nature", "rating": 4.8, "cost_estimate": 0, "open_time": "00:00", "close_time": "23:59", "mood_tags": ["relaxed"]},
    {"name": "Leopold Cafe", "latitude": 18.9228, "longitude": 72.8318, "category": "food", "rating": 4.3, "cost_estimate": 500, "open_time": "07:30", "close_time": "00:30", "mood_tags": ["relaxed", "adventurous"]},
    {"name": "Juhu Beach", "latitude": 19.0948, "longitude": 72.8267, "category": "nature", "rating": 4.4, "cost_estimate": 0, "open_time": "00:00", "close_time": "23:59", "mood_tags": ["relaxed", "adventurous"]},
    {"name": "PVR IMAX Mumbai", "latitude": 18.9700, "longitude": 72.8200, "category": "movie", "rating": 4.5, "cost_estimate": 450, "open_time": "09:00", "close_time": "00:00", "mood_tags": ["relaxed"]},
    {"name": "Bademiya Kebabs", "latitude": 18.9230, "longitude": 72.8325, "category": "food", "rating": 4.5, "cost_estimate": 350, "open_time": "19:00", "close_time": "04:00", "mood_tags": ["adventurous"]},

    # ── Delhi, India ──────────────────────────────────────────────────
    {"name": "India Gate", "latitude": 28.6129, "longitude": 77.2295, "category": "culture", "rating": 4.8, "cost_estimate": 0, "open_time": "00:00", "close_time": "23:59", "mood_tags": ["relaxed"]},
    {"name": "Chandni Chowk", "latitude": 28.6507, "longitude": 77.2334, "category": "food", "rating": 4.6, "cost_estimate": 200, "open_time": "10:00", "close_time": "22:00", "mood_tags": ["adventurous"]},
    {"name": "Qutub Minar", "latitude": 28.5245, "longitude": 77.1855, "category": "culture", "rating": 4.7, "cost_estimate": 35, "open_time": "07:00", "close_time": "17:00", "mood_tags": ["relaxed"]},
    {"name": "Hauz Khas Village", "latitude": 28.5494, "longitude": 77.2001, "category": "food", "rating": 4.3, "cost_estimate": 400, "open_time": "12:00", "close_time": "00:00", "mood_tags": ["relaxed", "adventurous"]},
    {"name": "PVR Select Citywalk", "latitude": 28.5290, "longitude": 77.2190, "category": "movie", "rating": 4.4, "cost_estimate": 400, "open_time": "09:00", "close_time": "00:00", "mood_tags": ["relaxed"]},

    # ── Jaipur, Rajasthan ─────────────────────────────────────────────
    {"name": "Hawa Mahal", "latitude": 26.9239, "longitude": 75.8267, "category": "culture", "rating": 4.7, "cost_estimate": 50, "open_time": "09:00", "close_time": "17:00", "mood_tags": ["relaxed"]},
    {"name": "Nahargarh Fort", "latitude": 26.9379, "longitude": 75.8156, "category": "culture", "rating": 4.6, "cost_estimate": 200, "open_time": "10:00", "close_time": "18:00", "mood_tags": ["adventurous"]},
    {"name": "Chokhi Dhani", "latitude": 26.7750, "longitude": 75.8200, "category": "food", "rating": 4.5, "cost_estimate": 700, "open_time": "17:00", "close_time": "23:00", "mood_tags": ["adventurous"]},
    {"name": "Raj Mandir Cinema", "latitude": 26.9100, "longitude": 75.8050, "category": "movie", "rating": 4.5, "cost_estimate": 200, "open_time": "09:00", "close_time": "23:00", "mood_tags": ["relaxed"]},

    # ── Bangalore, Karnataka ──────────────────────────────────────────
    {"name": "Cubbon Park", "latitude": 12.9763, "longitude": 77.5929, "category": "nature", "rating": 4.6, "cost_estimate": 0, "open_time": "06:00", "close_time": "18:00", "mood_tags": ["relaxed"]},
    {"name": "VV Puram Food Street", "latitude": 12.9494, "longitude": 77.5734, "category": "food", "rating": 4.5, "cost_estimate": 200, "open_time": "17:00", "close_time": "23:00", "mood_tags": ["adventurous"]},
    {"name": "Lalbagh Garden", "latitude": 12.9507, "longitude": 77.5848, "category": "nature", "rating": 4.7, "cost_estimate": 20, "open_time": "06:00", "close_time": "19:00", "mood_tags": ["relaxed"]},
    {"name": "INOX Garuda Mall", "latitude": 12.9706, "longitude": 77.6101, "category": "movie", "rating": 4.2, "cost_estimate": 350, "open_time": "09:00", "close_time": "00:00", "mood_tags": ["relaxed"]},

    # ── Pune, Maharashtra ─────────────────────────────────────────────
    {"name": "Shaniwar Wada", "latitude": 18.5195, "longitude": 73.8553, "category": "culture", "rating": 4.5, "cost_estimate": 25, "open_time": "08:00", "close_time": "18:30", "mood_tags": ["relaxed"]},
    {"name": "FC Road", "latitude": 18.5290, "longitude": 73.8410, "category": "food", "rating": 4.4, "cost_estimate": 250, "open_time": "10:00", "close_time": "23:00", "mood_tags": ["relaxed", "adventurous"]},
    {"name": "Sinhagad Fort", "latitude": 18.3661, "longitude": 73.7558, "category": "nature", "rating": 4.6, "cost_estimate": 0, "open_time": "05:00", "close_time": "18:00", "mood_tags": ["adventurous"]},

    # ── Goa, India ────────────────────────────────────────────────────
    {"name": "Baga Beach", "latitude": 15.5554, "longitude": 73.7514, "category": "nature", "rating": 4.5, "cost_estimate": 0, "open_time": "00:00", "close_time": "23:59", "mood_tags": ["relaxed", "adventurous"]},
    {"name": "Thalassa Restaurant", "latitude": 15.6050, "longitude": 73.7450, "category": "food", "rating": 4.6, "cost_estimate": 800, "open_time": "12:30", "close_time": "23:00", "mood_tags": ["relaxed"]},
    {"name": "Fort Aguada", "latitude": 15.4920, "longitude": 73.7735, "category": "culture", "rating": 4.4, "cost_estimate": 0, "open_time": "08:00", "close_time": "17:30", "mood_tags": ["relaxed", "adventurous"]},

    # ── Udaipur, Rajasthan ────────────────────────────────────────────
    {"name": "City Palace Udaipur", "latitude": 24.5764, "longitude": 73.6913, "category": "culture", "rating": 4.8, "cost_estimate": 300, "open_time": "09:30", "close_time": "17:30", "mood_tags": ["relaxed"]},
    {"name": "Lake Pichola Boat Ride", "latitude": 24.5726, "longitude": 73.6803, "category": "nature", "rating": 4.7, "cost_estimate": 400, "open_time": "10:00", "close_time": "18:00", "mood_tags": ["relaxed", "adventurous"]},
    {"name": "Ambrai Restaurant", "latitude": 24.5740, "longitude": 73.6830, "category": "food", "rating": 4.5, "cost_estimate": 600, "open_time": "12:00", "close_time": "23:00", "mood_tags": ["relaxed"]},

    # ── Rajkot, Gujarat ───────────────────────────────────────────────
    {"name": "Aji Dam Garden", "latitude": 22.2830, "longitude": 70.7610, "category": "nature", "rating": 4.1, "cost_estimate": 0, "open_time": "06:00", "close_time": "20:00", "mood_tags": ["relaxed"]},
    {"name": "Rotary Dolls Museum", "latitude": 22.3039, "longitude": 70.8027, "category": "culture", "rating": 4.3, "cost_estimate": 50, "open_time": "09:30", "close_time": "18:00", "mood_tags": ["relaxed"]},
    {"name": "Temptations Rajkot", "latitude": 22.3050, "longitude": 70.8000, "category": "food", "rating": 4.2, "cost_estimate": 200, "open_time": "11:00", "close_time": "22:30", "mood_tags": ["relaxed"]},

    # ── Indore, MP ────────────────────────────────────────────────────
    {"name": "Sarafa Bazaar", "latitude": 22.7196, "longitude": 75.8577, "category": "food", "rating": 4.7, "cost_estimate": 150, "open_time": "20:00", "close_time": "02:00", "mood_tags": ["adventurous"]},
    {"name": "Rajwada Palace", "latitude": 22.7180, "longitude": 75.8568, "category": "culture", "rating": 4.4, "cost_estimate": 0, "open_time": "10:00", "close_time": "17:00", "mood_tags": ["relaxed"]},
    {"name": "Patalpani Waterfall", "latitude": 22.5730, "longitude": 75.7780, "category": "nature", "rating": 4.3, "cost_estimate": 0, "open_time": "06:00", "close_time": "18:00", "mood_tags": ["adventurous"]},
]


def seed():
    create_tables()
    with get_session() as session:
        # Check if already seeded
        if session.query(POI).count() > 0:
            print("POIs already present; skip seeding.")
            return
        for s in CITY_POIS:
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
    print(f"Seeded {len(CITY_POIS)} POIs across all supported cities.")


if __name__ == "__main__":
    seed()

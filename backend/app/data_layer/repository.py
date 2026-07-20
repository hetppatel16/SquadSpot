# POI repository: read POIs from Supabase.
# Used by normalizer to fetch the full candidate set before filtering.
import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# Load Environment Variables from your active backend/.env file
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("Missing Supabase credentials in backend environment configurations.")

# Initialize global repository client connection
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
TABLE_NAME = "places"  # Matches the target table populated by your seeder script

class SupabasePOI:
    """
    A lightweight wrapper class that mimics the old SQLAlchemy POI model structure.
    This ensures that properties like poi.name, poi.latitude, and poi.mood_tags
    remain fully functional across your data normalizer and GA core engine.
    """
    def __init__(self, data: dict):
        self.id = data.get("id")
        self.name = data.get("name")
        self.latitude = float(data.get("latitude", 0.0))
        self.longitude = float(data.get("longitude", 0.0))
        self.rating = float(data.get("rating")) if data.get("rating") is not None else 4.0
        self.cost_estimate = float(data.get("avg_cost_per_person")) if data.get("avg_cost_per_person") is not None else 0.0
        self.description = data.get("description")
        self.primary_image_url = data.get("primary_image_url")

        
        # Parse opening hours for open_time and close_time
        # Default to 09:00 - 22:00 if not specified
        op_hours = data.get("opening_hours") or {}
        self.open_time = op_hours.get("open_time", "09:00")
        self.close_time = op_hours.get("close_time", "22:00")
        
        # Extract category from place_categories list
        pc = data.get("place_categories") or []
        if pc and len(pc) > 0:
            cat_obj = pc[0].get("categories") or {}
            self.category = cat_obj.get("name", "culture")
        else:
            self.category = "culture"
            
        # Extract mood tags from place_vibes list
        pv = data.get("place_vibes") or []
        self.mood_tags = []
        for vibe_item in pv:
            vibe_obj = vibe_item.get("vibes") or {}
            vname = vibe_obj.get("name")
            if vname:
                self.mood_tags.append(vname.lower())


def get_all_pois():
    """
    Return all POIs from the Supabase database.
    Used by the normalizer to fetch the full candidate set before filtering.
    Returns: list of SupabasePOI instances.
    """
    try:
        response = supabase.table(TABLE_NAME).select(
            "*, place_categories(categories(name)), place_vibes(vibes(name))"
        ).execute()
        # Convert raw dictionaries into structured objects matching the expected signature
        return [SupabasePOI(row) for row in response.data]
    except Exception as error:
        print(f"Error fetching all POIs from Supabase: {error}")
        return []


def get_poi_by_id(poi_id: str):
    """
    Return a single POI by id, or None if not found.
    Useful for lookups when we have an id from an itinerary (e.g. after GA).
    """
    try:
        response = supabase.table(TABLE_NAME).select(
            "*, place_categories(categories(name)), place_vibes(vibes(name))"
        ).eq("id", poi_id).execute()
        if response.data and len(response.data) > 0:
            return SupabasePOI(response.data[0])
        return None
    except Exception as error:
        print(f"Error fetching POI by ID ({poi_id}) from Supabase: {error}")
        return None
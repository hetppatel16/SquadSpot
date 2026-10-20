# POI repository: read POIs from Supabase.
# Used by normalizer to fetch the full candidate set before filtering.
import logging
import os
from dotenv import load_dotenv
from supabase import create_client, Client

logger = logging.getLogger(__name__)

# Load Environment Variables from your active backend/.env file
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("Missing Supabase URL or Anon Key.")

# Client for backend database operations
SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Separate client for authentication token verification
supabase_auth: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
TABLE_NAME = "places"  # Matches the target table populated by your seeder script

class SupabasePOI:
    """
    A lightweight wrapper around one Supabase `places` row (originally shaped like the old SQLAlchemy POI model).
    This ensures that properties like poi.name, poi.latitude, and poi.mood_tags
    remain fully functional across your data normalizer and GA core engine.
    """
    def __init__(self, data: dict):
        self.id = data.get("id")
        self.name = data.get("name")
        self.latitude = float(data.get("latitude", 0.0))
        self.longitude = float(data.get("longitude", 0.0))
        self.rating = float(data.get("rating")) if data.get("rating") is not None else 4.0
        self.cost_estimate = (
            float(data["avg_cost_per_person"])
            if data.get("avg_cost_per_person") is not None
            else None
        )
        self.description = data.get("description")
        self.primary_image_url = data.get("primary_image_url")

        
        # Parse opening hours for open_time and close_time
        # Default to 09:00 - 22:00 if not specified
        op_hours = data.get("opening_hours") or {}
        self.open_time = op_hours.get("open_time", "09:00")
        self.close_time = op_hours.get("close_time", "22:00")
        
        self.address = data.get("address")
        self.avg_visit_duration_minutes = int(
            data.get("avg_visit_duration_minutes") or 60
        )

        # Keep every linked category: a place can belong to more than one category.
        pc = data.get("place_categories") or []
        self.categories = []
        for category_item in pc:
            category_obj = category_item.get("categories") or {}
            category_name = category_obj.get("name")
            if category_name:
                self.categories.append(str(category_name).lower())
        self.category = self.categories[0] if self.categories else "uncategorized"

        # Extract mood tags from place_vibes list
        pv = data.get("place_vibes") or []
        self.mood_tags = []
        for vibe_item in pv:
            vibe_obj = vibe_item.get("vibes") or {}
            vname = vibe_obj.get("name")
            if vname:
                self.mood_tags.append(vname.lower())


def get_all_pois(city_id: str | None = None):
    """
    Return active POIs, optionally restricted to one selected city.

    Itinerary generation must provide city_id. Keeping the optional argument
    allows the existing /api/pois diagnostic endpoint to list all active POIs.
    """
    try:
        query = supabase.table(TABLE_NAME).select(
            "*, place_categories(categories(name)), place_vibes(vibes(name))"
        ).eq("is_active", True)
        if city_id:
            query = query.eq("city_id", city_id)

        response = query.execute()
        return [SupabasePOI(row) for row in (response.data or [])]
    except Exception as error:
        logger.exception("Error fetching POIs from Supabase")
        raise RuntimeError("Could not load places from the database.") from error


def _escape_like(text: str) -> str:
    """Make %, _ and \\ in user input match literally in an ILIKE pattern."""
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def search_active_cities(search: str = None, limit: int = 20):
    """
    Fetch active cities from Supabase.
    If a search term is provided, filter cities by name.
    """
    query = (
        supabase_auth.table("cities")
        .select(
            "id, name, state_region, country, "
            "latitude, longitude, timezone"
        )
        .eq("is_active", True)
        .order("name")
        .limit(limit)
    )

    # Apply city-name search if the user entered something.
    if search and search.strip():
        # PostgREST also treats * as a wildcard, so it is dropped from the search text.
        term = _escape_like(search.strip().replace("*", ""))
        query = query.ilike("name", f"%{term}%")

    response = query.execute()

    return response.data or []
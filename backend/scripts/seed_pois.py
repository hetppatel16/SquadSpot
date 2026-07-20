# Seed sample POIs into Supabase. Run from project root: python -m scripts.seed_pois
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Add project root so core configuration files can be evaluated
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Load Environment Variables from your active backend/.env file
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Missing Supabase credentials in your backend/.env file.")
    sys.exit(1)

# Initialize Supabase Client with service role key to bypass RLS policies
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Define categories
CATEGORIES = [
    {"name": "culture", "icon": "landmark", "description": "Cultural landmarks, historical monuments, and museums"},
    {"name": "food", "icon": "utensils", "description": "Local food spots, restaurants, cafes, and food markets"},
    {"name": "movie", "icon": "video", "description": "Multiplexes, movie theaters, and entertainment centers"},
    {"name": "nature", "icon": "tree", "description": "Parks, lakes, beaches, and gardens"},
    {"name": "adventure", "icon": "mountain", "description": "Theme parks, high-energy activities, and outdoor spots"},
    {"name": "shopping", "icon": "shopping-bag", "description": "Local markets, night markets, and malls"}
]

# Define vibes
VIBES = [
    {"name": "relaxed", "icon": "coffee", "description": "Calm, slow-paced, and peaceful atmosphere"},
    {"name": "adventurous", "icon": "mountain", "description": "Energetic, exciting, and thrill-seeking vibe"},
    {"name": "chill", "icon": "coffee", "description": "Casual hangout and comfortable atmosphere"},
    {"name": "energetic", "icon": "bolt", "description": "Lively, crowded, and buzzing environment"},
    {"name": "romantic", "icon": "heart", "description": "Scenic, intimate, and cozy settings"},
    {"name": "family", "icon": "users", "description": "All-ages friendly, safe, and wholesome"}
]

# Real-ish POIs mapped explicitly to city names with added primary image URLs
CITY_POIS = [
    # ── Vadodara, Gujarat ─────────────────────────────────────────────
    {"name": "Sayaji Baug", "city": "Vadodara", "latitude": 22.3100, "longitude": 73.1900, "category": "culture", "rating": 4.7, "cost_estimate": 0, "open_time": "05:30", "close_time": "21:00", "mood_tags": ["relaxed", "chill"], "image_url": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=600"},
    {"name": "Laxmi Vilas Palace", "city": "Vadodara", "latitude": 22.2933, "longitude": 73.1907, "category": "culture", "rating": 4.8, "cost_estimate": 250, "open_time": "09:30", "close_time": "17:00", "mood_tags": ["relaxed", "adventurous"], "image_url": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=600"},
    {"name": "Mandvi Gate", "city": "Vadodara", "latitude": 22.2982, "longitude": 73.2023, "category": "culture", "rating": 4.2, "cost_estimate": 0, "open_time": "00:00", "close_time": "23:59", "mood_tags": ["relaxed"], "image_url": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=600"},
    {"name": "EME Temple", "city": "Vadodara", "latitude": 22.3137, "longitude": 73.1816, "category": "culture", "rating": 4.5, "cost_estimate": 0, "open_time": "06:00", "close_time": "20:00", "mood_tags": ["relaxed"], "image_url": "https://images.unsplash.com/photo-1600100397608-f010f423b971?q=80&w=600"},
    {"name": "Raju Omlet", "city": "Vadodara", "latitude": 22.2995, "longitude": 73.2015, "category": "food", "rating": 4.3, "cost_estimate": 150, "open_time": "17:00", "close_time": "23:30", "mood_tags": ["relaxed", "adventurous", "chill"], "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600"},
    {"name": "Kala Ghoda Cafe", "city": "Vadodara", "latitude": 22.3050, "longitude": 73.1950, "category": "food", "rating": 4.4, "cost_estimate": 300, "open_time": "10:00", "close_time": "22:00", "mood_tags": ["relaxed", "chill"], "image_url": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600"},
    {"name": "Ratribazar", "city": "Vadodara", "latitude": 22.3000, "longitude": 73.2000, "category": "food", "rating": 4.1, "cost_estimate": 200, "open_time": "18:00", "close_time": "00:00", "mood_tags": ["adventurous", "energetic"], "image_url": "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=600"},
    {"name": "Dairy Den", "city": "Vadodara", "latitude": 22.3010, "longitude": 73.1960, "category": "food", "rating": 4.3, "cost_estimate": 100, "open_time": "11:00", "close_time": "23:00", "mood_tags": ["relaxed", "chill"], "image_url": "https://images.unsplash.com/photo-1501443715937-a99e994646f5?q=80&w=600"},
    {"name": "Inox Multiplex", "city": "Vadodara", "latitude": 22.3070, "longitude": 73.1870, "category": "movie", "rating": 4.2, "cost_estimate": 300, "open_time": "09:00", "close_time": "00:00", "mood_tags": ["relaxed", "chill"], "image_url": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600"},
    {"name": "Cinepolis Vadodara", "city": "Vadodara", "latitude": 22.3200, "longitude": 73.1750, "category": "movie", "rating": 4.0, "cost_estimate": 280, "open_time": "09:00", "close_time": "00:00", "mood_tags": ["relaxed", "chill"], "image_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600"},
    {"name": "Ajwa Fun World", "city": "Vadodara", "latitude": 22.2600, "longitude": 73.1250, "category": "adventure", "rating": 4.1, "cost_estimate": 400, "open_time": "10:00", "close_time": "18:00", "mood_tags": ["adventurous", "energetic"], "image_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600"},
    {"name": "Sursagar Lake", "city": "Vadodara", "latitude": 22.2997, "longitude": 73.1960, "category": "nature", "rating": 4.0, "cost_estimate": 0, "open_time": "00:00", "close_time": "23:59", "mood_tags": ["relaxed", "chill"], "image_url": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=600"},
    {"name": "Baroda Museum", "city": "Vadodara", "latitude": 22.3085, "longitude": 73.1885, "category": "culture", "rating": 4.6, "cost_estimate": 20, "open_time": "10:30", "close_time": "17:30", "mood_tags": ["relaxed"], "image_url": "https://images.unsplash.com/photo-1554941068-a252680d25d9?q=80&w=600"},
    {"name": "Haldiram's Vadodara", "city": "Vadodara", "latitude": 22.3105, "longitude": 73.1810, "category": "food", "rating": 4.0, "cost_estimate": 250, "open_time": "09:00", "close_time": "22:30", "mood_tags": ["relaxed", "family"], "image_url": "https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=600"},
    {"name": "Kamati Baug", "city": "Vadodara", "latitude": 22.3095, "longitude": 73.1890, "category": "nature", "rating": 4.5, "cost_estimate": 0, "open_time": "06:00", "close_time": "20:00", "mood_tags": ["relaxed", "chill", "family"], "image_url": "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=600"},

    # ── Ahmedabad, Gujarat ────────────────────────────────────────────
    {"name": "Sabarmati Ashram", "city": "Ahmedabad", "latitude": 23.0607, "longitude": 72.5800, "category": "culture", "rating": 4.8, "cost_estimate": 0, "open_time": "08:30", "close_time": "18:00", "mood_tags": ["relaxed"], "image_url": "https://images.unsplash.com/photo-1603202167313-a719619a311f?q=80&w=600"},
    {"name": "Kankaria Lake", "city": "Ahmedabad", "latitude": 23.0069, "longitude": 72.6005, "category": "nature", "rating": 4.5, "cost_estimate": 25, "open_time": "09:00", "close_time": "22:00", "mood_tags": ["relaxed", "adventurous", "family"], "image_url": "https://images.unsplash.com/photo-1543872084-c7bd3822856f?q=80&w=600"},
    {"name": "Manek Chowk", "city": "Ahmedabad", "latitude": 23.0255, "longitude": 72.5873, "category": "food", "rating": 4.6, "cost_estimate": 200, "open_time": "20:00", "close_time": "02:00", "mood_tags": ["adventurous", "energetic"], "image_url": "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=600"},
    {"name": "Law Garden Night Market", "city": "Ahmedabad", "latitude": 23.0287, "longitude": 72.5620, "category": "shopping", "rating": 4.4, "cost_estimate": 300, "open_time": "18:00", "close_time": "23:00", "mood_tags": ["adventurous", "energetic", "chill"], "image_url": "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600"},
    {"name": "Science City", "city": "Ahmedabad", "latitude": 23.0725, "longitude": 72.5123, "category": "culture", "rating": 4.3, "cost_estimate": 350, "open_time": "10:00", "close_time": "19:30", "mood_tags": ["adventurous", "family"], "image_url": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=600"},
    {"name": "SG Highway Food Street", "city": "Ahmedabad", "latitude": 23.0350, "longitude": 72.5070, "category": "food", "rating": 4.2, "cost_estimate": 250, "open_time": "11:00", "close_time": "23:30", "mood_tags": ["relaxed", "chill"], "image_url": "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=600"},
    {"name": "Adalaj Stepwell", "city": "Ahmedabad", "latitude": 23.1668, "longitude": 72.5823, "category": "culture", "rating": 4.7, "cost_estimate": 0, "open_time": "08:00", "close_time": "17:00", "mood_tags": ["relaxed"], "image_url": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=600"},
    {"name": "Cinepolis Ahmedabad", "city": "Ahmedabad", "latitude": 23.0300, "longitude": 72.5100, "category": "movie", "rating": 4.1, "cost_estimate": 300, "open_time": "09:00", "close_time": "00:00", "mood_tags": ["relaxed", "chill"], "image_url": "https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?q=80&w=600"},

    # ── Surat, Gujarat ────────────────────────────────────────────────
    {"name": "Dumas Beach", "city": "Surat", "latitude": 21.0883, "longitude": 72.7146, "category": "nature", "rating": 4.2, "cost_estimate": 0, "open_time": "00:00", "close_time": "23:59", "mood_tags": ["relaxed", "adventurous", "chill"], "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600"},
    {"name": "Dutch Garden", "city": "Surat", "latitude": 21.1960, "longitude": 72.8310, "category": "nature", "rating": 4.0, "cost_estimate": 0, "open_time": "06:00", "close_time": "21:00", "mood_tags": ["relaxed", "chill"], "image_url": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=600"},
    {"name": "Surat Castle", "city": "Surat", "latitude": 21.1889, "longitude": 72.8361, "category": "culture", "rating": 4.1, "cost_estimate": 0, "open_time": "08:00", "close_time": "18:00", "mood_tags": ["relaxed"], "image_url": "https://images.unsplash.com/photo-1599340515911-37d45e43f119?q=80&w=600"},
    {"name": "Surat Locho Corner", "city": "Surat", "latitude": 21.1950, "longitude": 72.8300, "category": "food", "rating": 4.5, "cost_estimate": 100, "open_time": "07:00", "close_time": "22:00", "mood_tags": ["relaxed", "chill"], "image_url": "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=600"},
    {"name": "VR Surat Mall", "city": "Surat", "latitude": 21.1427, "longitude": 72.7711, "category": "shopping", "rating": 4.2, "cost_estimate": 350, "open_time": "10:00", "close_time": "22:00", "mood_tags": ["relaxed", "adventurous", "chill"], "image_url": "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600"},

    # ── Mumbai, Maharashtra ───────────────────────────────────────────
    {"name": "Gateway of India", "city": "Mumbai", "latitude": 18.9220, "longitude": 72.8347, "category": "culture", "rating": 4.7, "cost_estimate": 0, "open_time": "00:00", "close_time": "23:59", "mood_tags": ["relaxed", "family"], "image_url": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=600"},
    {"name": "Marine Drive", "city": "Mumbai", "latitude": 18.9432, "longitude": 72.8235, "category": "nature", "rating": 4.8, "cost_estimate": 0, "open_time": "00:00", "close_time": "23:59", "mood_tags": ["relaxed", "chill", "romantic"], "image_url": "https://images.unsplash.com/photo-1496372412473-e8548ffd82bc?q=80&w=600"},
    {"name": "Leopold Cafe", "city": "Mumbai", "latitude": 18.9228, "longitude": 72.8318, "category": "food", "rating": 4.3, "cost_estimate": 500, "open_time": "07:30", "close_time": "00:30", "mood_tags": ["relaxed", "adventurous", "chill"], "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600"},
    {"name": "Juhu Beach", "city": "Mumbai", "latitude": 19.0948, "longitude": 72.8267, "category": "nature", "rating": 4.4, "cost_estimate": 0, "open_time": "00:00", "close_time": "23:59", "mood_tags": ["relaxed", "adventurous", "chill"], "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600"},
    {"name": "PVR IMAX Mumbai", "city": "Mumbai", "latitude": 18.9700, "longitude": 72.8200, "category": "movie", "rating": 4.5, "cost_estimate": 450, "open_time": "09:00", "close_time": "00:00", "mood_tags": ["relaxed", "chill"], "image_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600"},
    {"name": "Bademiya Kebabs", "city": "Mumbai", "latitude": 18.9230, "longitude": 72.8325, "category": "food", "rating": 4.5, "cost_estimate": 350, "open_time": "19:00", "close_time": "04:00", "mood_tags": ["adventurous", "energetic"], "image_url": "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?q=80&w=600"},

    # ── Delhi, India ──────────────────────────────────────────────────
    {"name": "India Gate", "city": "Delhi", "latitude": 28.6129, "longitude": 77.2295, "category": "culture", "rating": 4.8, "cost_estimate": 0, "open_time": "00:00", "close_time": "23:59", "mood_tags": ["relaxed", "family"], "image_url": "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=600"},
    {"name": "Chandni Chowk", "city": "Delhi", "latitude": 28.6507, "longitude": 77.2334, "category": "food", "rating": 4.6, "cost_estimate": 200, "open_time": "10:00", "close_time": "22:00", "mood_tags": ["adventurous", "energetic"], "image_url": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=600"},
    {"name": "Qutub Minar", "city": "Delhi", "latitude": 28.5245, "longitude": 77.1855, "category": "culture", "rating": 4.7, "cost_estimate": 35, "open_time": "07:00", "close_time": "17:00", "mood_tags": ["relaxed", "family"], "image_url": "https://images.unsplash.com/photo-1610016302534-6f67f1c968d8?q=80&w=600"},
    {"name": "Hauz Khas Village", "city": "Delhi", "latitude": 28.5494, "longitude": 77.2001, "category": "food", "rating": 4.3, "cost_estimate": 400, "open_time": "12:00", "close_time": "00:00", "mood_tags": ["relaxed", "adventurous", "chill"], "image_url": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600"},
    {"name": "PVR Select Citywalk", "city": "Delhi", "latitude": 28.5290, "longitude": 77.2190, "category": "movie", "rating": 4.4, "cost_estimate": 400, "open_time": "09:00", "close_time": "00:00", "mood_tags": ["relaxed", "chill", "shopping"], "image_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600"},

    # ── Jaipur, Rajasthan ─────────────────────────────────────────────
    {"name": "Hawa Mahal", "city": "Jaipur", "latitude": 26.9239, "longitude": 75.8267, "category": "culture", "rating": 4.7, "cost_estimate": 50, "open_time": "09:00", "close_time": "17:00", "mood_tags": ["relaxed", "family"], "image_url": "https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?q=80&w=600"},
    {"name": "Nahargarh Fort", "city": "Jaipur", "latitude": 26.9379, "longitude": 75.8156, "category": "culture", "rating": 4.6, "cost_estimate": 200, "open_time": "10:00", "close_time": "18:00", "mood_tags": ["adventurous", "romantic"], "image_url": "https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=600"},
    {"name": "Chokhi Dhani", "city": "Jaipur", "latitude": 26.7750, "longitude": 75.8200, "category": "food", "rating": 4.5, "cost_estimate": 700, "open_time": "17:00", "close_time": "23:00", "mood_tags": ["adventurous", "family"], "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=600"},
    {"name": "Raj Mandir Cinema", "city": "Jaipur", "latitude": 26.9100, "longitude": 75.8050, "category": "movie", "rating": 4.5, "cost_estimate": 200, "open_time": "09:00", "close_time": "23:00", "mood_tags": ["relaxed", "chill"], "image_url": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600"},

    # ── Bangalore, Karnataka ──────────────────────────────────────────
    {"name": "Cubbon Park", "city": "Bangalore", "latitude": 12.9763, "longitude": 77.5929, "category": "nature", "rating": 4.6, "cost_estimate": 0, "open_time": "06:00", "close_time": "18:00", "mood_tags": ["relaxed", "chill"], "image_url": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?q=80&w=600"},
    {"name": "VV Puram Food Street", "city": "Bangalore", "latitude": 12.9494, "longitude": 77.5734, "category": "food", "rating": 4.5, "cost_estimate": 200, "open_time": "17:00", "close_time": "23:00", "mood_tags": ["adventurous", "energetic"], "image_url": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=600"},
    {"name": "Lalbagh Garden", "city": "Bangalore", "latitude": 12.9507, "longitude": 77.5848, "category": "nature", "rating": 4.7, "cost_estimate": 20, "open_time": "06:00", "close_time": "19:00", "mood_tags": ["relaxed", "family"], "image_url": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=600"},
    {"name": "INOX Garuda Mall", "city": "Bangalore", "latitude": 12.9706, "longitude": 77.6101, "category": "movie", "rating": 4.2, "cost_estimate": 350, "open_time": "09:00", "close_time": "00:00", "mood_tags": ["relaxed", "chill"], "image_url": "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600"},

    # ── Pune, Maharashtra ─────────────────────────────────────────────
    {"name": "Shaniwar Wada", "city": "Pune", "latitude": 18.5195, "longitude": 73.8553, "category": "culture", "rating": 4.5, "cost_estimate": 25, "open_time": "08:00", "close_time": "18:30", "mood_tags": ["relaxed", "family"], "image_url": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=600"},
    {"name": "FC Road", "city": "Pune", "latitude": 18.5290, "longitude": 73.8410, "category": "food", "rating": 4.4, "cost_estimate": 250, "open_time": "10:00", "close_time": "23:00", "mood_tags": ["relaxed", "adventurous", "chill"], "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600"},
    {"name": "Sinhagad Fort", "city": "Pune", "latitude": 18.3661, "longitude": 73.7558, "category": "nature", "rating": 4.6, "cost_estimate": 0, "open_time": "05:00", "close_time": "18:00", "mood_tags": ["adventurous", "energetic"], "image_url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600"},

    # ── Goa, India ────────────────────────────────────────────────────
    {"name": "Baga Beach", "city": "Goa", "latitude": 15.5554, "longitude": 73.7514, "category": "nature", "rating": 4.5, "cost_estimate": 0, "open_time": "00:00", "close_time": "23:59", "mood_tags": ["relaxed", "adventurous", "chill"], "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600"},
    {"name": "Thalassa Restaurant", "city": "Goa", "latitude": 15.6050, "longitude": 73.7450, "category": "food", "rating": 4.6, "cost_estimate": 800, "open_time": "12:30", "close_time": "23:00", "mood_tags": ["relaxed", "chill", "romantic"], "image_url": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=600"},
    {"name": "Fort Aguada", "city": "Goa", "latitude": 15.4920, "longitude": 73.7735, "category": "culture", "rating": 4.4, "cost_estimate": 0, "open_time": "08:00", "close_time": "17:30", "mood_tags": ["relaxed", "adventurous"], "image_url": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=600"},

    # ── Udaipur, Rajasthan ────────────────────────────────────────────
    {"name": "City Palace Udaipur", "city": "Udaipur", "latitude": 24.5764, "longitude": 73.6913, "category": "culture", "rating": 4.8, "cost_estimate": 300, "open_time": "09:30", "close_time": "17:30", "mood_tags": ["relaxed", "family"], "image_url": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=600"},
    {"name": "Lake Pichola Boat Ride", "city": "Udaipur", "latitude": 24.5726, "longitude": 73.6803, "category": "nature", "rating": 4.7, "cost_estimate": 400, "open_time": "10:00", "close_time": "18:00", "mood_tags": ["relaxed", "adventurous", "romantic"], "image_url": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=600"},
    {"name": "Ambrai Restaurant", "city": "Udaipur", "latitude": 24.5740, "longitude": 73.6830, "category": "food", "rating": 4.5, "cost_estimate": 600, "open_time": "12:00", "close_time": "23:00", "mood_tags": ["relaxed", "chill", "romantic"], "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600"},

    # ── Rajkot, Gujarat ───────────────────────────────────────────────
    {"name": "Aji Dam Garden", "city": "Rajkot", "latitude": 22.2830, "longitude": 70.7610, "category": "nature", "rating": 4.1, "cost_estimate": 0, "open_time": "06:00", "close_time": "20:00", "mood_tags": ["relaxed", "family"], "image_url": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=600"},
    {"name": "Rotary Dolls Museum", "city": "Rajkot", "latitude": 22.3039, "longitude": 70.8027, "category": "culture", "rating": 4.3, "cost_estimate": 50, "open_time": "09:30", "close_time": "18:00", "mood_tags": ["relaxed", "family"], "image_url": "https://images.unsplash.com/photo-1554941068-a252680d25d9?q=80&w=600"},
    {"name": "Temptations Rajkot", "city": "Rajkot", "latitude": 22.3050, "longitude": 70.8000, "category": "food", "rating": 4.2, "cost_estimate": 200, "open_time": "11:00", "close_time": "22:30", "mood_tags": ["relaxed", "chill"], "image_url": "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600"},

    # ── Indore, MP ────────────────────────────────────────────────────
    {"name": "Sarafa Bazaar", "city": "Indore", "latitude": 22.7196, "longitude": 75.8577, "category": "food", "rating": 4.7, "cost_estimate": 150, "open_time": "20:00", "close_time": "02:00", "mood_tags": ["adventurous", "energetic"], "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600"},
    {"name": "Rajwada Palace", "city": "Indore", "latitude": 22.7180, "longitude": 75.8568, "category": "culture", "rating": 4.4, "cost_estimate": 0, "open_time": "10:00", "close_time": "17:00", "mood_tags": ["relaxed", "family"], "image_url": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=600"},
    {"name": "Patalpani Waterfall", "city": "Indore", "latitude": 22.5730, "longitude": 75.7780, "category": "nature", "rating": 4.3, "cost_estimate": 0, "open_time": "06:00", "close_time": "18:00", "mood_tags": ["adventurous"], "image_url": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600"}
]

def seed():
    print("Beginning live relational database seeding in cloud Supabase instance...")

    # 1. Fetch live cities to map IDs
    try:
        cities_res = supabase.table("cities").select("id", "name").execute()
        city_map = {c["name"].lower(): c["id"] for c in cities_res.data}
        print(f"Loaded {len(city_map)} cities from Supabase database.")
    except Exception as error:
        print(f"Error fetching cities from database: {error}")
        return

    # 2. Seed Categories
    category_map = {}
    print("Seeding categories...")
    for cat in CATEGORIES:
        try:
            res = supabase.table("categories").upsert(cat, on_conflict="name").execute()
            category_map[cat["name"]] = res.data[0]["id"]
        except Exception as error:
            print(f"Error seeding category {cat['name']}: {error}")
            return
    print(f"Successfully seeded {len(CATEGORIES)} categories.")

    # 3. Seed Vibes
    vibe_map = {}
    print("Seeding vibes...")
    for vibe in VIBES:
        try:
            res = supabase.table("vibes").upsert(vibe, on_conflict="name").execute()
            vibe_map[vibe["name"]] = res.data[0]["id"]
        except Exception as error:
            print(f"Error seeding vibe {vibe['name']}: {error}")
            return
    print(f"Successfully seeded {len(VIBES)} vibes.")

    # 4. Clean out existing places data (to re-seed with proper relational fields)
    print("Clearing out existing place tables...")
    try:
        # Standard filter to match all values
        supabase.table("place_categories").delete().neq("place_id", "00000000-0000-0000-0000-000000000000").execute()
        supabase.table("place_vibes").delete().neq("place_id", "00000000-0000-0000-0000-000000000000").execute()
        supabase.table("places").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("Cleared existing place mappings successfully.")
    except Exception as error:
        print(f"Error clearing existing places: {error}")
        return

    # 5. Insert Relational Places
    print(f"Inserting {len(CITY_POIS)} new relational places...")
    inserted_count = 0
    for poi in CITY_POIS:
        city_name = poi["city"].lower()
        if city_name not in city_map:
            print(f"Skipping {poi['name']} - City '{poi['city']}' not found in database cities list.")
            continue
        
        city_id = city_map[city_name]
        cost = float(poi["cost_estimate"])
        
        # Heuristic for price level 1-4
        if cost <= 100:
            price_level = 1
        elif cost <= 300:
            price_level = 2
        elif cost <= 600:
            price_level = 3
        else:
            price_level = 4
            
        opening_hours = {
            "open_time": poi["open_time"],
            "close_time": poi["close_time"]
        }
        
        place_data = {
            "name": poi["name"],
            "city_id": city_id,
            "latitude": poi["latitude"],
            "longitude": poi["longitude"],
            "price_level": price_level,
            "avg_cost_per_person": cost,
            "rating": poi["rating"],
            "opening_hours": opening_hours,
            "avg_visit_duration_minutes": 60,
            "is_active": True,
            "primary_image_url": poi.get("image_url")  # Injected the primary image URL mapping
        }
        
        try:
            place_res = supabase.table("places").insert(place_data).execute()
            if not place_res.data:
                print(f"Failed to insert place: {poi['name']}")
                continue
                
            place_id = place_res.data[0]["id"]
            
            # Map Category Join
            cat_name = poi["category"].lower()
            if cat_name in category_map:
                cat_id = category_map[cat_name]
                supabase.table("place_categories").insert({
                    "place_id": place_id,
                    "category_id": cat_id
                }).execute()
                
            # Map Vibes Joins
            for vibe_name in poi["mood_tags"]:
                v_name = vibe_name.lower()
                if v_name in vibe_map:
                    v_id = vibe_map[v_name]
                    supabase.table("place_vibes").insert({
                        "place_id": place_id,
                        "vibe_id": v_id,
                        "relevance_score": 0.8
                    }).execute()
                    
            inserted_count += 1
        except Exception as error:
            print(f"Error inserting place {poi['name']}: {error}")
            continue
            
    print(f"Seeding completed successfully! Processed and synchronized {inserted_count} relational place entries.")

if __name__ == "__main__":
    seed()
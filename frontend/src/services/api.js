// API service layer — bridges frontend data model to backend API.
// All data transformations (city→coords, vibes→preferences, duration→minutes) happen here.

import { CITY_COORDS } from '../constants/cityCoords';

// ─── Configuration ──────────────────────────────────────────────────────────
// Change this to your backend URL:
//  - Android emulator: http://10.0.2.2:8000
//  - iOS simulator:    http://localhost:8000
//  - Physical device:  http://192.168.29.54:8000
const API_BASE_URL = 'http://192.168.29.54:8000';

// ─── Vibe ID → preference string mapping ────────────────────────────────────
// Must match the vibes array in PlannerScreen.js
const VIBE_MAP = {
    1: 'nature',
    2: 'food',
    3: 'nature',     // Adventure → maps to nature POIs
    4: 'culture',    // Chill → maps to culture POIs
    5: 'food',       // Shopping → maps to food (closest match in POI categories)
    6: 'culture',
};

// ─── Vibe ID → mood string mapping ──────────────────────────────────────────
const VIBE_TO_MOOD = {
    1: 'relaxed',      // Nature
    2: 'adventurous',  // Food
    3: 'adventurous',  // Adventure
    4: 'relaxed',      // Chill
    5: 'adventurous',  // Shopping
    6: 'relaxed',      // Culture
};

// ─── Duration → minutes mapping ─────────────────────────────────────────────
const DURATION_MAP = {
    'Few Hrs': 120,
    'Half Day': 240,
    'Full Day': 480,
};

// ─── Category → MaterialIcons icon name mapping ─────────────────────────────
export const CATEGORY_ICON_MAP = {
    food: 'restaurant',
    movie: 'movie',
    culture: 'museum',
    nature: 'park',
};

// ─── Category → display label mapping ───────────────────────────────────────
export const CATEGORY_LABEL_MAP = {
    food: 'Food & Dining',
    movie: 'Entertainment',
    culture: 'Culture & Heritage',
    nature: 'Nature & Outdoors',
};

// ─── Category → Unsplash header image mapping ───────────────────────────────
export const CATEGORY_IMAGE_MAP = {
    food: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop',
    movie: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop',
    culture: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop',
    nature: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&auto=format&fit=crop',
};


/**
 * Transform frontend planner data to backend API format and call POST /api/itinerary.
 *
 * @param {object} plannerData - { location, budget, people, selectedVibes, duration }
 * @returns {Promise<object>} - Backend ItineraryResponse
 */
export async function fetchItinerary(plannerData) {
    const { location, budget, people, selectedVibes, duration } = plannerData;

    // 1. Get coordinates from city name
    const coords = CITY_COORDS[location] || { latitude: 22.3072, longitude: 73.1812 }; // default: Vadodara

    // 2. Convert vibes to unique preference strings
    const preferences = [...new Set(
        (selectedVibes || []).map(id => VIBE_MAP[id]).filter(Boolean)
    )];

    // 3. Derive mood from dominant vibe
    const mood = selectedVibes && selectedVibes.length > 0
        ? VIBE_TO_MOOD[selectedVibes[0]] || 'relaxed'
        : 'relaxed';

    // 4. Convert duration to minutes
    const total_time_minutes = DURATION_MAP[duration] || 240;

    // 5. Calculate per-person budget
    const totalBudget = parseFloat(budget) || 2500;

    // Build request body (matches backend ItineraryRequest schema)
    const requestBody = {
        budget: totalBudget,
        total_time_minutes,
        preferences,
        mood,
        latitude: coords.latitude,
        longitude: coords.longitude,
    };

    const response = await fetch(`${API_BASE_URL}/api/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return await response.json();
}


/**
 * Convert backend ItineraryResponse into the plan shape used by ResultScreen.
 *
 * @param {object} apiResponse - { ordered_places, timeline, cost_breakdown, route, total_satisfaction_score }
 * @param {number} people - group size (for per-person cost)
 * @returns {Array<object>} - Array of plan objects matching ResultScreen's format
 */
export function transformToPlan(apiResponse, people = 1) {
    const { ordered_places, timeline, cost_breakdown, total_satisfaction_score } = apiResponse;

    if (!ordered_places || ordered_places.length === 0) {
        return [];
    }

    // Determine dominant category for the plan title & image
    const categoryCounts = {};
    ordered_places.forEach(p => {
        const cat = (p.category || 'culture').toLowerCase();
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const dominantCategory = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])[0][0];

    const totalCost = cost_breakdown?.total || 0;
    const perPerson = people > 0 ? Math.round(totalCost / people) : totalCost;

    // Build stops from timeline + ordered_places
    const poiLookup = {};
    ordered_places.forEach(p => { poiLookup[p.id] = p; });

    const stops = (timeline || []).map(t => {
        const poi = poiLookup[t.poi_id] || {};
        const category = (poi.category || 'culture').toLowerCase();
        const cost = poi.cost_estimate || 0;

        // Format arrival_time from "HH:MM" (24h) to "h:mm AM/PM"
        let timeDisplay = t.arrival_time || '';
        if (timeDisplay) {
            const [h, m] = timeDisplay.split(':').map(Number);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            timeDisplay = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
        }

        return {
            icon: CATEGORY_ICON_MAP[category] || 'place',
            title: t.name || poi.name || 'Unknown',
            type: CATEGORY_LABEL_MAP[category] || category,
            time: timeDisplay,
            price: cost === 0 ? 'Free' : `~₹${cost}`,
            desc: `Visit ${t.name || poi.name} — rated ${poi.rating || '?'}/5`,
        };
    });

    const plan = {
        id: 1,
        title: `Your ${CATEGORY_LABEL_MAP[dominantCategory] || 'Perfect'} Day`,
        totalEst: String(perPerson),
        image: CATEGORY_IMAGE_MAP[dominantCategory] || CATEGORY_IMAGE_MAP.culture,
        stops,
        satisfactionScore: total_satisfaction_score,
    };

    return [plan];
}

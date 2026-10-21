import { API_ENDPOINTS } from '../constants/config';

/**
 * Search active cities from the backend.
 */
export async function searchCities(searchText = '') {
  try {
    const search = searchText.trim();

    const url = search
      ? `${API_ENDPOINTS.CITIES}?search=${encodeURIComponent(search)}`
      : API_ENDPOINTS.CITIES;

    const response = await fetch(url);

    const data = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(
        data.detail || 'Unable to load cities.'
      );
    }

    return Array.isArray(data) ? data : [];

  } catch (error) {
    console.error('City Search API Error:', error);
    throw error;
  }
}

/**
 * 1. User Authentication - Sign Up
 */
export async function signUpUser(userData) {
  try {
    let payload;
    // Support both an object parameter or separate arguments
    if (typeof userData === 'object' && userData !== null && !Array.isArray(userData)) {
      payload = {
        name: userData.name || userData.full_name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
      };
    } else {
      payload = {
        name: arguments[0],
        email: arguments[1],
        password: arguments[2],
        phone: arguments[3],
      };
    }

    const response = await fetch(API_ENDPOINTS.SIGNUP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to sign up');
    }

    return await response.json();
  } catch (error) {
    console.error("Signup API Error:", error);
    throw error;
  }
}

/**
 * 2. User Authentication - Log In
 */
export async function loginUser(credentials) {
  try {
    let payload;
    // Support both an object parameter or separate arguments
    if (typeof credentials === 'object' && credentials !== null && !Array.isArray(credentials)) {
      payload = {
        email: credentials.email,
        password: credentials.password,
      };
    } else {
      payload = {
        email: arguments[0],
        password: arguments[1],
      };
    }

    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed');
    }

    return await response.json();
  } catch (error) {
    console.error("Login API Error:", error);
    throw error;
  }
}

/**
 * 3. User Authentication - OAuth (Google / Apple)
 */
export async function oauthLogin(provider, idToken, accessToken = null, nonce = null, fullName = null) {
  try {
    const response = await fetch(API_ENDPOINTS.OAUTH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        id_token: idToken,
        access_token: accessToken,
        nonce,
        full_name: fullName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `${provider} authorization failed.`);
    }

    return await response.json();
  } catch (error) {
    console.error("OAuth API Error:", error);
    throw error;
  }
}

/**
 * 4. User Authentication - Request Password Reset OTP
 */
export async function requestPasswordReset(email) {
  try {
    const response = await fetch(API_ENDPOINTS.RESET_PASSWORD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to send OTP.');
    }

    return data;
  } catch (error) {
    console.error("Reset Password API Error:", error);
    throw error;
  }
}

/**
 * 5. User Authentication - Verify OTP & Set New Password
 */
export async function verifyOtpAndResetPassword(email, token, newPassword) {
  try {
    const response = await fetch(API_ENDPOINTS.VERIFY_OTP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        token,
        new_password: newPassword,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to verify OTP.');
    }

    return data;
  } catch (error) {
    console.error("Verify OTP API Error:", error);
    throw error;
  }
}

// Alias for backwards compatibility
export const verifyOtp = verifyOtpAndResetPassword;

/**
 * 6. Refresh an access token after the previous access token expires.
 */
export async function refreshAuthSession(refreshToken) {
  const response = await fetch(API_ENDPOINTS.REFRESH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || 'Your session has expired. Please sign in again.');
    error.status = response.status;
    throw error;
  }
  return data;
}

/** Revoke the active Supabase session before removing local credentials. */
export async function revokeAuthSession(accessToken, refreshToken) {
  const response = await fetch(API_ENDPOINTS.LOGOUT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || 'Unable to revoke the server session.');
    error.status = response.status;
    throw error;
  }
  return data;
}

/** Retrieve the signed-in user's verified profile from the backend. */
export async function getMyProfile(accessToken) {
  const response = await fetch(API_ENDPOINTS.ME, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || 'Unable to load your profile.');
    error.status = response.status;
    throw error;
  }
  return data;
}

/** Update only the profile fields accepted by the backend. */
export async function updateMyProfile(accessToken, updates) {
  const response = await fetch(API_ENDPOINTS.ME, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(updates),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || 'Unable to update your profile.');
    error.status = response.status;
    throw error;
  }
  return data;
}

/**
 * 7. Fetch Generated Itinerary from Backend Pipeline
 */
export async function fetchItinerary(userContext, accessToken) {
  if (!accessToken) {
    const error = new Error('You must be signed in to generate an itinerary.');
    error.status = 401;
    throw error;
  }
  try {
    // Nature, Food, Adventure, Shopping and Culture are database categories.
    // Chill is a database vibe, so it is sent separately as the requested mood.
    const categoryMap = {
      1: 'nature',
      2: 'food',
      3: 'adventure',
      5: 'shopping',
      6: 'culture'
    };
    const selectedOptions = userContext.selectedVibes || [];
    const preferences = selectedOptions
      .map(id => categoryMap[id])
      .filter(Boolean);
    const selectedMood = selectedOptions.includes(4)
      ? 'chill'
      : (userContext.mood || null);

    // Map duration strings or numbers to total time in minutes
    let durationMinutes = 240; // Default to 4 hours
    if (typeof userContext.duration === 'number') {
      durationMinutes = Math.round(userContext.duration * 60);
    } else if (typeof userContext.duration === 'string') {
      if (userContext.duration === 'Few Hrs') {
        durationMinutes = 120;
      } else if (userContext.duration === 'Half Day') {
        durationMinutes = 240;
      } else if (userContext.duration === 'Full Day') {
        durationMinutes = 480;
      } else {
        const parsedHours = parseFloat(userContext.duration);
        if (!isNaN(parsedHours) && parsedHours > 0) {
          durationMinutes = Math.round(parsedHours * 60);
        }
      }
    }

    const response = await fetch(API_ENDPOINTS.ITINERARY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        budget: (parseFloat(userContext.budget) || 0) / Math.max(1, userContext.people || 1),
        total_time_minutes: durationMinutes,
        preferences: preferences,
        mood: selectedMood,
        latitude: parseFloat(userContext.latitude) || 22.3072,
        longitude: parseFloat(userContext.longitude) || 73.1812,
        city: userContext.location || '',
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const error = new Error(data.detail || 'Failed to fetch itinerary options from server.');
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch Itinerary API Error:", error);
    throw error;
  }
}

/**
 * 8. Normalizer: Maps raw backend data objects cleanly into frontend layout shapes
 */
export function transformToPlan(apiResponse) {
  if (!apiResponse) return [];

  const itineraries = Array.isArray(apiResponse) ? apiResponse : [apiResponse];

  return itineraries.map((plan, index) => {
    const rawStops = plan.timeline || plan.stops || plan.items || [];
    const rawTotalCost = plan.cost_breakdown?.total ?? plan.totalEst ?? 0;
    const unknownCostCount = Number(plan.cost_breakdown?.unknown_count || 0);
    const totalCostNumber = Number(rawTotalCost) || 0;
    const costDisplay = unknownCostCount > 0
      ? (totalCostNumber > 0 ? `₹${totalCostNumber}+` : "Not listed")
      : `₹${totalCostNumber}`;

    // Older API responses kept coordinates only in ordered_places. Use those
    // as a compatibility fallback while preferring coordinates on each stop.
    const orderedPlaces = plan.ordered_places || [];
    const placeById = new Map(
      orderedPlaces.map(place => [String(place.id), place])
    );

    return {
      id: plan.id || index + 1,
      title: plan.title || `Route Option ${index + 1}`,
      totalEst: String(rawTotalCost),
      unknownCostCount,
      costDisplay,
      image: plan.image || rawStops[0]?.image_url || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop',
      stops: rawStops.map((stop, i) => {
        const place = placeById.get(String(stop.place_id || stop.id)) || {};
        const isFood = stop.category?.toLowerCase().includes('food') || stop.type?.toLowerCase().includes('food');
        const latitude = stop.latitude ?? place.latitude;
        const longitude = stop.longitude ?? place.longitude;

        return {
          id: stop.place_id || stop.id || place.id || `stop-${i + 1}`,
          icon: stop.icon || (isFood ? 'restaurant' : 'park'),
          title: stop.name || stop.title || `Stop ${i + 1}`,
          type: stop.type || stop.category || "Activity",
          time: stop.time || "Flexible",
          price: (() => {
            const rawPrice = stop.price ?? stop.cost ?? null;
            if (rawPrice === null || rawPrice === undefined) return "Cost not listed";
            const amount = Number(rawPrice);
            if (!Number.isFinite(amount)) return "Cost not listed";
            return amount === 0 ? "Free" : `~₹${amount}`;
          })(),
          desc: stop.description || stop.desc || "No description details provided.",
          image: stop.image_url || stop.image || null,
          latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
          longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
          address: stop.address || place.address || null
        };
      })
    };
  }).filter(plan => plan.stops.length > 0);
}

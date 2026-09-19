import { API_ENDPOINTS } from '../constants/config';

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
export async function oauthLogin(provider, idToken, accessToken = null) {
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
 * 6. Fetch Generated Itinerary from Backend Pipeline
 */
export async function fetchItinerary(userContext) {
  try {
    // Map vibe IDs from UI (e.g. 1, 2) to string preferences the backend expects
    const vibeMap = {
      1: 'nature',
      2: 'food',
      3: 'adventure',
      4: 'chill',
      5: 'shopping',
      6: 'culture'
    };
    const preferences = (userContext.selectedVibes || []).map(id => vibeMap[id]).filter(Boolean);

    // Map duration strings to total time in minutes
    let durationMinutes = 240; // Default to 4 hours
    if (userContext.duration === 'Few Hrs') {
      durationMinutes = 120;
    } else if (userContext.duration === 'Half Day') {
      durationMinutes = 240;
    } else if (userContext.duration === 'Full Day') {
      durationMinutes = 480;
    }

    const response = await fetch(API_ENDPOINTS.ITINERARY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        budget: (parseFloat(userContext.budget) || 0) / Math.max(1, userContext.people || 1),
        total_time_minutes: durationMinutes,
        preferences: preferences,
        mood: userContext.mood || 'relaxed',
        latitude: parseFloat(userContext.latitude) || 22.3072,
        longitude: parseFloat(userContext.longitude) || 73.1812,
        city: userContext.location || '',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch itinerary options from server');
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch Itinerary API Error:", error);
    throw error;
  }
}

/**
 * 7. Normalizer: Maps raw backend data objects cleanly into frontend layout shapes
 */
export function transformToPlan(apiResponse) {
  if (!apiResponse) return [];
  
  // Wrap the single itinerary object into an array for the carousel structure
  const itineraries = Array.isArray(apiResponse) ? apiResponse : [apiResponse];

  return itineraries.map((plan, index) => {
    // Gracefully check alternative keys so layout items never drop to undefined
    const rawStops = plan.timeline || plan.stops || plan.ordered_places || [];
    const rawTotalCost = plan.cost_breakdown?.total !== undefined ? plan.cost_breakdown.total : (plan.totalEst || "0");

    return {
      id: plan.id || index + 1,
      title: plan.title || `Route Option ${index + 1}`,
      totalEst: String(rawTotalCost),
      image: plan.image || rawStops[0]?.image_url || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop',
      stops: rawStops.map((stop, i) => {
        const isFood = stop.category?.toLowerCase().includes('food') || stop.type?.toLowerCase().includes('food');
        return {
          icon: stop.icon || (isFood ? 'restaurant' : 'park'),
          title: stop.name || stop.title || `Stop ${i + 1}`,
          type: stop.type || stop.category || "Activity",
          time: stop.time || "Flexible",
          price: stop.price !== undefined ? (typeof stop.price === 'number' ? `~\u20b9${stop.price}` : stop.price) : "Free",
          desc: stop.description || stop.desc || "No description details provided.",
          image: stop.image_url || null
        };
      })
    };
  });
}
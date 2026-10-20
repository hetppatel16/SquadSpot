/**
 * Application Configuration & API Base URL
 * Reads from EXPO_PUBLIC_API_URL in .env
 */

const rawUrl = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Strip trailing slashes so endpoint paths are joined consistently.
// Set EXPO_PUBLIC_API_URL in frontend/.env when using a phone or remote host.
export const API_BASE_URL = rawUrl.replace(/\/+$/, '');

export const API_ENDPOINTS = {
  // Auth
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  OAUTH: `${API_BASE_URL}/api/auth/oauth`,
  RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
  VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
  REFRESH: `${API_BASE_URL}/api/auth/refresh`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  ME: `${API_BASE_URL}/api/auth/me`,

  // Itinerary
  ITINERARY: `${API_BASE_URL}/api/itinerary`,
  POIS: `${API_BASE_URL}/api/pois`,
  CITIES: `${API_BASE_URL}/api/cities`,
  HEALTH: `${API_BASE_URL}/api/health`,
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
};

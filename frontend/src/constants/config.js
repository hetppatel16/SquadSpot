/**
 * Application Configuration & API Base URL
 * Reads from EXPO_PUBLIC_API_URL in .env
 */

const rawUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.54:8000';

// Strip any trailing slashes for consistent endpoint path concatenation
export const API_BASE_URL = rawUrl.replace(/\/+$/, '');

export const API_ENDPOINTS = {
  // Auth
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  OAUTH: `${API_BASE_URL}/api/auth/oauth`,
  RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
  VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
  
  // Itinerary
  ITINERARY: `${API_BASE_URL}/api/itinerary`,
  POIS: `${API_BASE_URL}/api/pois`,
  HEALTH: `${API_BASE_URL}/api/health`,
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
};

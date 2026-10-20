import { Platform } from 'react-native';

/**
 * Keeps the most recently generated trip so the Trip page (/trip) survives a
 * browser refresh.
 *
 * Web: sessionStorage, so the trip lasts for this browser tab only.
 * Mobile: memory only (lasts while the app is open). To keep trips after the
 * app is closed on mobile, save them with AsyncStorage (see utils/storage.js).
 */
const STORAGE_KEY = 'squadspot_last_trip';
let memoryTrip = null;

const webStorage = () => (Platform.OS === 'web' && typeof window !== 'undefined' ? window.sessionStorage : null);

export function saveTrip(trip) {
  memoryTrip = trip;
  try {
    webStorage()?.setItem(STORAGE_KEY, JSON.stringify(trip));
  } catch (error) {
    // Storage can be full or blocked (private mode); the in-memory copy still works.
  }
}

export function loadTrip() {
  if (memoryTrip) return memoryTrip;
  try {
    const raw = webStorage()?.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

export function clearTrip() {
  memoryTrip = null;
  try {
    webStorage()?.removeItem(STORAGE_KEY);
  } catch (error) {
    // Nothing to clear.
  }
}

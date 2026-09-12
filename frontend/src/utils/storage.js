import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  USER_PROFILE: '@squadspot_user_profile',
  AUTH_TOKEN: 'squadspot_auth_token',
  SAVED_PREFERENCES: '@squadspot_user_preferences',
};

/**
 * Checks if SecureStore is available on current platform
 */
const isSecureStoreAvailable = () => {
  return Platform.OS !== 'web';
};

/**
 * Securely save sensitive values (like auth tokens)
 */
export async function setSecureItem(key, value) {
  try {
    if (value === null || value === undefined) {
      await removeSecureItem(key);
      return;
    }
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(key, stringValue);
    } else {
      await AsyncStorage.setItem(key, stringValue);
    }
  } catch (error) {
    console.warn(`Error setting secure item [${key}]:`, error);
  }
}

/**
 * Securely retrieve sensitive values
 */
export async function getSecureItem(key) {
  try {
    if (isSecureStoreAvailable()) {
      return await SecureStore.getItemAsync(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  } catch (error) {
    console.warn(`Error getting secure item [${key}]:`, error);
    return null;
  }
}

/**
 * Remove secure item
 */
export async function removeSecureItem(key) {
  try {
    if (isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.warn(`Error removing secure item [${key}]:`, error);
  }
}

/**
 * Save non-sensitive JSON objects (like user metadata)
 */
export async function setJsonItem(key, value) {
  try {
    if (value === null || value === undefined) {
      await AsyncStorage.removeItem(key);
      return;
    }
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error saving JSON item [${key}]:`, error);
  }
}

/**
 * Retrieve non-sensitive JSON objects
 */
export async function getJsonItem(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn(`Error reading JSON item [${key}]:`, error);
    return null;
  }
}

/**
 * Remove non-sensitive item
 */
export async function removeJsonItem(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`Error removing item [${key}]:`, error);
  }
}

/**
 * Save full session (User profile to AsyncStorage + Auth token to SecureStore)
 */
export async function saveSession(user, token = null) {
  try {
    if (user) {
      await setJsonItem(STORAGE_KEYS.USER_PROFILE, user);
    }
    if (token) {
      await setSecureItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

/**
 * Load full session on app startup
 */
export async function loadSession() {
  try {
    const user = await getJsonItem(STORAGE_KEYS.USER_PROFILE);
    const token = await getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
    return { user, token };
  } catch (error) {
    console.error('Error loading session:', error);
    return { user: null, token: null };
  }
}

/**
 * Clear all session data on logout
 */
export async function clearSession() {
  try {
    await removeJsonItem(STORAGE_KEYS.USER_PROFILE);
    await removeSecureItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

export { STORAGE_KEYS };

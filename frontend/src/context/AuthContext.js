import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  loadSession,
  saveSession,
  clearSession,
  setJsonItem,
  STORAGE_KEYS,
} from '../utils/storage';
import { getMyProfile, refreshAuthSession, revokeAuthSession, updateMyProfile } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refs keep token access and refresh callbacks stable across React renders.
  // This prevents screens with effects depending on getAccessToken from
  // accidentally repeating an API request every time a token is refreshed.
  const tokenRef = useRef(null);
  const refreshTokenRef = useRef(null);
  const expiresAtRef = useRef(null);
  const refreshPromiseRef = useRef(null);

  const applySession = useCallback(async (sessionData, profileOverride = null) => {
    const nextUser = profileOverride || sessionData.user;
    const nextToken = sessionData.token;
    const nextRefreshToken = sessionData.refresh_token || sessionData.refreshToken || null;
    const nextExpiresAt = sessionData.expires_at || sessionData.expiresAt || null;

    if (!nextUser || !nextToken || !nextRefreshToken) {
      throw new Error('The authentication server did not return a complete session. Please sign in again.');
    }

    await saveSession(nextUser, nextToken, nextRefreshToken, nextExpiresAt);
    tokenRef.current = nextToken;
    refreshTokenRef.current = nextRefreshToken;
    expiresAtRef.current = nextExpiresAt ? Number(nextExpiresAt) : null;
    setUser(nextUser);
    setToken(nextToken);
  }, []);

  const logout = useCallback(async () => {
    // Capture credentials, then clear the device immediately so the user is
    // signed out locally even if the network is unavailable.
    const activeToken = tokenRef.current;
    const activeRefreshToken = refreshTokenRef.current;
    tokenRef.current = null;
    refreshTokenRef.current = null;
    expiresAtRef.current = null;
    setUser(null);
    setToken(null);
    await clearSession();

    if (activeToken && activeRefreshToken) {
      try {
        await revokeAuthSession(activeToken, activeRefreshToken);
      } catch (error) {
        console.warn('Server sign-out could not be completed; local session was cleared.', error.message);
      }
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (!refreshTokenRef.current) {
      await logout();
      throw new Error('Your session has expired. Please sign in again.');
    }

    // Supabase rotates refresh tokens. Share one in-flight refresh between
    // simultaneous API calls so the same refresh token is not reused twice.
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = (async () => {
        try {
          const refreshed = await refreshAuthSession(refreshTokenRef.current);
          await applySession(refreshed);
          return refreshed.token;
        } catch (error) {
          await logout();
          throw error;
        } finally {
          refreshPromiseRef.current = null;
        }
      })();
    }
    return await refreshPromiseRef.current;
  }, [applySession, logout]);

  const getAccessToken = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) {
      throw new Error('Please sign in to continue.');
    }

    // Refresh shortly before expiry so protected API requests use a valid JWT.
    const currentExpiry = expiresAtRef.current;
    if (!currentExpiry || currentExpiry * 1000 <= Date.now() + 60000) {
      return await refreshSession();
    }
    return currentToken;
  }, [refreshSession]);

  const login = useCallback(async (userData, authToken, nextRefreshToken, nextExpiresAt) => {
    await applySession({
      user: userData,
      token: authToken,
      refresh_token: nextRefreshToken,
      expires_at: nextExpiresAt,
    });
  }, [applySession]);

  const updateUser = useCallback(async (updatedData) => {
    const accessToken = await getAccessToken();
    const updatedProfile = await updateMyProfile(accessToken, updatedData);
    setUser(updatedProfile);
    await setJsonItem(STORAGE_KEYS.USER_PROFILE, updatedProfile);
    return updatedProfile;
  }, [getAccessToken]);

  // Restore, validate and (when needed) refresh a saved session when the app opens.
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const saved = await loadSession();
        if (!saved.user || !saved.token || !saved.refreshToken) {
          await clearSession();
          return;
        }

        let active = {
          user: saved.user,
          token: saved.token,
          refresh_token: saved.refreshToken,
          expires_at: saved.expiresAt,
        };

        if (saved.expiresAt && saved.expiresAt * 1000 <= Date.now() + 60000) {
          active = await refreshAuthSession(saved.refreshToken);
        }

        try {
          const verifiedProfile = await getMyProfile(active.token);
          active = { ...active, user: verifiedProfile };
        } catch (error) {
          if (error.status === 401 && active.refresh_token) {
            active = await refreshAuthSession(active.refresh_token);
            const verifiedProfile = await getMyProfile(active.token);
            active = { ...active, user: verifiedProfile };
          } else if (error.status === 401) {
            throw error;
          }
          // For temporary network/server failures, retain the locally saved session.
        }

        if (isMounted) {
          await applySession(active);
        }
      } catch (error) {
        console.warn('Saved authentication session could not be restored.');
        await clearSession();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    restoreSession();
    return () => { isMounted = false; };
  }, [applySession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        updateUser,
        getAccessToken,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

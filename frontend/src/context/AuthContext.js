import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadSession, saveSession, clearSession, setJsonItem, STORAGE_KEYS } from '../utils/storage';

const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  updateUser: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore saved session on app launch
  useEffect(() => {
    async function restoreSession() {
      try {
        const session = await loadSession();
        if (session && session.user) {
          setUser(session.user);
          setToken(session.token);
        }
      } catch (error) {
        console.error('Failed to restore auth session:', error);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (userData, authToken = null) => {
    setUser(userData);
    setToken(authToken);
    await saveSession(userData, authToken);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await clearSession();
  };

  const updateUser = async (updatedData) => {
    const mergedUser = { ...user, ...updatedData };
    setUser(mergedUser);
    await setJsonItem(STORAGE_KEYS.USER_PROFILE, mergedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

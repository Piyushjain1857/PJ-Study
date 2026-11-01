import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService.js';
import { setAccessToken } from '../services/api.js';

const AuthContext = createContext(null);
const SESSION_HINT_KEY = 'pj_study_active_session';

/**
 * Authentication Context Provider managing global user session state.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronize token state with API service
  const updateAccessToken = useCallback((token) => {
    setTokenState(token);
    setAccessToken(token);
  }, []);

  // Check active session on initial load via silent refresh only if a session hint exists
  useEffect(() => {
    let isMounted = true;

    async function checkCurrentSession() {
      // Avoid firing unneeded network requests for guest visitors without active sessions
      const hasSessionHint =
        typeof window !== 'undefined' && window.localStorage?.getItem(SESSION_HINT_KEY) === 'true';
      if (!hasSessionHint) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const { user: currentUser, accessToken: newAccessToken } = await authService.refresh();
        if (isMounted) {
          setUser(currentUser);
          updateAccessToken(newAccessToken);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          updateAccessToken(null);
          if (typeof window !== 'undefined') {
            window.localStorage?.removeItem(SESSION_HINT_KEY);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkCurrentSession();

    return () => {
      isMounted = false;
    };
  }, [updateAccessToken]);

  /**
   * Logs in user and establishes session.
   */
  const login = useCallback(
    async ({ email, password }) => {
      setError(null);
      try {
        const result = await authService.login({ email, password });
        setUser(result.user);
        updateAccessToken(result.accessToken);
        if (typeof window !== 'undefined') {
          window.localStorage?.setItem(SESSION_HINT_KEY, 'true');
        }
        return result;
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [updateAccessToken]
  );

  /**
   * Registers a new account.
   */
  const register = useCallback(async ({ name, email, password }) => {
    setError(null);
    try {
      const result = await authService.register({ name, email, password });
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  /**
   * Terminates active session.
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      updateAccessToken(null);
      if (typeof window !== 'undefined') {
        window.localStorage?.removeItem(SESSION_HINT_KEY);
      }
    }
  }, [updateAccessToken]);

  /**
   * Refreshes user profile from backend.
   */
  const refreshUser = useCallback(async () => {
    try {
      const updatedUser = await authService.getMe();
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      if (err.statusCode === 401) {
        setUser(null);
        updateAccessToken(null);
        if (typeof window !== 'undefined') {
          window.localStorage?.removeItem(SESSION_HINT_KEY);
        }
      }
      throw err;
    }
  }, [updateAccessToken]);

  /**
   * Updates local user state.
   */
  const updateUser = useCallback((userData) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : userData));
  }, []);

  const value = {
    user,
    accessToken,
    isAuthenticated: Boolean(user),
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook providing access to AuthContext.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

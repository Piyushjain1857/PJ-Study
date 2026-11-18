import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/authService.js';
import { setAccessToken } from '../services/api.js';
import {
  hasPermission as checkPermission,
  getPermissionsForRole,
  ROLES
} from '../utils/permissions.js';

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
  const checkCurrentSession = useCallback(async () => {
    // Avoid firing unneeded network requests for guest visitors without active sessions
    const hasSessionHint =
      typeof window !== 'undefined' && window.localStorage?.getItem(SESSION_HINT_KEY) === 'true';
    if (!hasSessionHint) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { user: currentUser, accessToken: newAccessToken } = await authService.refresh();
      setUser(currentUser);
      updateAccessToken(newAccessToken);
      setError(null);
    } catch (err) {
      const statusCode = err?.statusCode || err?.response?.status;
      // Only clear credentials if backend explicitly invalidates/rejects the session
      if (statusCode === 401 || statusCode === 403) {
        setUser(null);
        updateAccessToken(null);
        if (typeof window !== 'undefined') {
          window.localStorage?.removeItem(SESSION_HINT_KEY);
        }
        setError(null);
      } else {
        // Network timeout, offline, or backend cold-start: preserve session hint so user isn't logged out
        console.warn('Session restoration encountered a transient network or server delay:', err?.message);
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [updateAccessToken]);

  useEffect(() => {
    checkCurrentSession();
  }, [checkCurrentSession]);

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
   * Updates local user state with shallow diffing to prevent no-op state updates.
   */
  const updateUser = useCallback((userData) => {
    if (!userData) return;
    setUser((prev) => {
      if (!prev) return userData;
      let hasChanged = false;
      for (const [key, val] of Object.entries(userData)) {
        if (prev[key] !== val) {
          hasChanged = true;
          break;
        }
      }
      return hasChanged ? { ...prev, ...userData } : prev;
    });
  }, []);

  // Centralized RBAC capabilities for active user
  const permissions = useMemo(() => {
    return user ? getPermissionsForRole(user.role) : [];
  }, [user]);

  const hasPermission = useCallback(
    (permission) => {
      return Boolean(user && checkPermission(user.role, permission));
    },
    [user]
  );

  const hasRole = useCallback(
    (...allowedRoles) => {
      return Boolean(user && allowedRoles.includes(user.role));
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user),
      isLoading,
      error,
      role: user?.role || null,
      permissions,
      isSuperAdmin: user?.role === ROLES.SUPER_ADMIN,
      isAdmin: user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN,
      isModerator:
        user?.role === ROLES.MODERATOR ||
        user?.role === ROLES.ADMIN ||
        user?.role === ROLES.SUPER_ADMIN,
      hasPermission,
      hasRole,
      login,
      register,
      logout,
      refreshUser,
      updateUser,
      retrySession: checkCurrentSession
    }),
    [
      user,
      accessToken,
      isLoading,
      error,
      permissions,
      hasPermission,
      hasRole,
      login,
      register,
      logout,
      refreshUser,
      updateUser,
      checkCurrentSession
    ]
  );

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

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import notificationService from '../services/notificationService.js';
import { isCancellation } from '../services/api.js';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [liveActivities, setLiveActivities] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // References
  const pollTimerRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationService.getUnreadCount();
      if (data && typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // Non-blocking background sync failure
    }
  }, [isAuthenticated]);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (params = {}) => {
      if (!isAuthenticated) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await notificationService.getNotifications(params);
        if (data) {
          setNotifications(data.notifications || []);
          if (data.pagination) setPagination(data.pagination);
          if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        if (!isCancellation(err)) {
          setError(err.message || 'Failed to fetch notifications');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  // Mark single as read
  const markAsRead = useCallback(
    async (id) => {
      if (!id) return;
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await notificationService.markAsRead(id);
      } catch {
        // Re-sync on failure
        fetchUnreadCount();
      }
    },
    [fetchUnreadCount]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch {
      fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  // Dismiss / delete notification
  const dismissNotification = useCallback(
    async (id) => {
      if (!id) return;
      // Optimistic remove
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });

      try {
        await notificationService.dismissNotification(id);
      } catch {
        fetchUnreadCount();
      }
    },
    [fetchUnreadCount]
  );

  // Socket.IO Real-Time Live Connection
  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
    const socketUrl = apiBase.replace(/\/api\/v1\/?$/, '');

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      fetchUnreadCount();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('notification:new', (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    socket.on('unread_count:update', ({ unreadCount: count }) => {
      if (typeof count === 'number') {
        setUnreadCount(count);
      }
    });

    socket.on('activity:live', (activity) => {
      setLiveActivities((prev) => [activity, ...prev.slice(0, 49)]);
    });

    socket.on('announcement:new', () => {
      fetchUnreadCount();
      fetchNotifications({ page: 1, limit: 10 });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.id, fetchUnreadCount, fetchNotifications]);

  // Background polling fallback with Page Visibility API
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchUnreadCount();

    const startPolling = () => {
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchUnreadCount();
        }
      }, 30000); // 30 seconds interval fallback
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
        startPolling();
      } else {
        if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user?.id, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    liveActivities,
    isConnected,
    pagination,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;

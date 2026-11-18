import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import notificationService from '../services/notificationService.js';
import { isCancellation, getRuntimeApiBaseUrl } from '../services/api.js';

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

  // Keep stable callback refs for socket listeners to avoid re-subscription loops
  const fetchUnreadCountRef = useRef(fetchUnreadCount);
  fetchUnreadCountRef.current = fetchUnreadCount;

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (params = {}) => {
      if (!isAuthenticated) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await notificationService.getNotifications(params);
        if (data) {
          // Deduplicate incoming array by ID to guarantee UI idempotency
          const seen = new Set();
          const deduplicated = (data.notifications || []).filter((item) => {
            if (!item || !item.id || seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
          setNotifications(deduplicated);
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

  const fetchNotificationsRef = useRef(fetchNotifications);
  fetchNotificationsRef.current = fetchNotifications;

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

    const apiBase = getRuntimeApiBaseUrl();
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
      if (fetchUnreadCountRef.current) fetchUnreadCountRef.current();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('notification:new', (newNotif) => {
      if (!newNotif || !newNotif.id) return;
      setNotifications((prev) => {
        // Enforce deduplication against existing in-memory notifications
        const isDuplicate = prev.some(
          (n) => n.id === newNotif.id || (newNotif.eventKey && n.eventKey === newNotif.eventKey)
        );
        if (isDuplicate) return prev;
        return [newNotif, ...prev];
      });
      // Synchronize unread count cleanly
      if (fetchUnreadCountRef.current) {
        fetchUnreadCountRef.current();
      }
    });

    socket.on('unread_count:update', ({ unreadCount: count }) => {
      if (typeof count === 'number') {
        setUnreadCount(count);
      }
    });

    socket.on('activity:live', (activity) => {
      if (!activity || !activity.id) return;
      setLiveActivities((prev) => {
        if (prev.some((a) => a.id === activity.id)) return prev;
        return [activity, ...prev.slice(0, 49)];
      });
    });

    socket.on('announcement:new', () => {
      if (fetchUnreadCountRef.current) {
        fetchUnreadCountRef.current();
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.id]);

  // Background polling fallback with Page Visibility API (optimized for Render Free Plan)
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch on mount
    fetchUnreadCount();

    // When WebSocket is healthy, do not poll to save Render Free compute & network bandwidth.
    // Only poll when socket is disconnected AND tab is visible.
    const pollIntervalMs = 60000; // 60s fallback

    const checkAndPoll = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        fetchUnreadCount();
      }
    };

    if (!isConnected) {
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = window.setInterval(checkAndPoll, pollIntervalMs);
    } else {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Re-sync unread count once when returning to visible tab
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, isConnected, fetchUnreadCount]);

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

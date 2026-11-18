import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../../config/env.js';
import prisma from '../../config/database.js';

let ioInstance = null;

/**
 * Initializes and configures the Socket.IO real-time server instance.
 *
 * @param {import('http').Server} httpServer
 * @returns {SocketIOServer}
 */
export function initializeSocketServer(httpServer) {
  const configuredOrigins = (env.frontendUrl || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const allowedOrigins = [
    ...configuredOrigins,
    'http://localhost:5173',
    'http://localhost:5001'
  ];

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || !env.isProduction) return callback(null, true);
        const normalized = origin.replace(/\/+$/, '');
        if (allowedOrigins.includes(normalized)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 20000,
    pingInterval: 25000
  });

  // JWT Authentication middleware for socket connections
  io.use((socket, next) => {
    try {
      const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      let token = null;

      if (authHeader) {
        token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      } else if (socket.handshake.query?.token) {
        token = socket.handshake.query.token;
      }

      if (token && env.jwtAccessSecret) {
        try {
          const decoded = jwt.verify(token, env.jwtAccessSecret);
          socket.user = {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role
          };
        } catch {
          // Token expired or invalid; continue as unauthenticated guest
          socket.user = null;
        }
      } else {
        socket.user = null;
      }

      return next();
    } catch (err) {
      return next(err);
    }
  });

  io.on('connection', (socket) => {
    // Join global broadcast channel
    socket.join('broadcast');

    if (socket.user?.id) {
      // Join personal user room
      const userRoom = `user:${socket.user.id}`;
      socket.join(userRoom);

      // Join role-specific room
      if (socket.user.role) {
        socket.join(`role:${socket.user.role}`);
      }

      // eslint-disable-next-line no-console
      if (!env.isTest) {
        console.log(`[Socket.IO] Authenticated user connected: ${socket.user.email} (${socket.id})`);
      }
    } else {
      socket.join('guests');
    }

    // Client heartbeat
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('disconnect', () => {
      // Cleanup handled automatically by socket.io
    });
  });

  ioInstance = io;
  return io;
}

/**
 * Returns the active Socket.IO server instance.
 *
 * @returns {SocketIOServer|null}
 */
export function getIO() {
  return ioInstance;
}

/**
 * Closes the Socket.IO server and resets the singleton instance.
 */
export async function closeSocketServer() {
  if (ioInstance) {
    await new Promise((resolve) => ioInstance.close(resolve));
    ioInstance = null;
  }
}

/**
 * Emits an event to a specific user by their user ID.
 *
 * @param {string} userId
 * @param {string} event
 * @param {any} data
 */
export function emitToUser(userId, event, data) {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(event, data);
}

/**
 * Emits an event to all users possessing a specific role.
 *
 * @param {string} role - 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN'
 * @param {string} event
 * @param {any} data
 */
export function emitToRole(role, event, data) {
  if (!ioInstance || !role) return;
  ioInstance.to(`role:${role}`).emit(event, data);
}

/**
 * Broadcasts an event globally to all connected clients.
 *
 * @param {string} event
 * @param {any} data
 */
export function broadcastEvent(event, data) {
  if (!ioInstance) return;
  ioInstance.to('broadcast').emit(event, data);
}

/**
 * Records a real-time platform activity to PostgreSQL and broadcasts it live.
 *
 * @param {{
 *   type: string,
 *   action: string,
 *   title: string,
 *   description?: string,
 *   actorId?: string,
 *   actorName?: string,
 *   actorRole?: string,
 *   targetId?: string,
 *   targetType?: string,
 *   metadata?: object,
 *   isPublic?: boolean
 * }} params
 * @returns {Promise<any>}
 */
export async function recordAndBroadcastActivity(params) {
  let activity = null;
  try {
    activity = await prisma.liveActivity.create({
      data: {
        type: params.type,
        action: params.action,
        title: params.title,
        description: params.description || null,
        actorId: params.actorId || null,
        actorName: params.actorName || null,
        actorRole: params.actorRole || null,
        targetId: params.targetId || null,
        targetType: params.targetType || null,
        metadata: params.metadata || undefined,
        isPublic: params.isPublic !== false
      }
    });
  } catch (err) {
    // Non-blocking DB write failure
    // eslint-disable-next-line no-console
    console.warn('[Socket.IO] Failed to record live activity to DB:', err.message);
    activity = {
      id: `act-${Date.now()}`,
      ...params,
      createdAt: new Date().toISOString()
    };
  }

  if (ioInstance) {
    if (params.isPublic !== false) {
      ioInstance.to('broadcast').emit('activity:live', activity);
    } else {
      ioInstance.to('role:ADMIN').to('role:SUPER_ADMIN').emit('activity:live', activity);
    }
  }

  return activity;
}

/**
 * Dispatches a new notification to a user in real-time.
 *
 * @param {string} userId
 * @param {object} notification
 * @param {number} [unreadCount]
 */
export function dispatchRealtimeNotification(userId, notification, unreadCount) {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit('notification:new', notification);
  if (typeof unreadCount === 'number') {
    ioInstance.to(`user:${userId}`).emit('unread_count:update', { unreadCount });
  }
}

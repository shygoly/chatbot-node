import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../lib/logger';
import inboxUsersService from './inbox-users.service';

interface SocketData {
  userId: string;
  userName?: string;
  role: 'admin' | 'customer';
  conversationId?: string;
}

class WebSocketService {
  private io: Server | null = null;
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.cors.origin,
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      await this.authenticateSocket(socket, next);
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('WebSocket server initialized', {
      transports: ['websocket', 'polling'],
      cors: config.cors.origin,
    });
  }

  /**
   * Authenticate socket connection
   */
  private async authenticateSocket(socket: Socket, next: (err?: Error) => void): Promise<void> {
    try {
      const token = socket.handshake.auth.token;
      const sessionId = socket.handshake.auth.sessionId;

      if (token) {
        // Admin authentication (JWT)
        const decoded = jwt.verify(token, config.auth.jwtSecret) as { userId: number; username: string };
        socket.data.userId = decoded.userId.toString();
        socket.data.userName = decoded.username;
        socket.data.role = 'admin';
        logger.info('Admin authenticated via WebSocket', { userId: decoded.userId });
      } else if (sessionId) {
        // Customer authentication (session)
        const user = await inboxUsersService.login(sessionId, 'default');
        socket.data.userId = user.id.toString();
        socket.data.userName = user.userName || 'Guest';
        socket.data.role = 'customer';
        logger.info('Customer authenticated via WebSocket', { userId: user.id });
      } else {
        return next(new Error('Authentication required'));
      }

      next();
    } catch (error: any) {
      logger.error('WebSocket authentication failed', { error: error.message });
      next(new Error('Authentication failed'));
    }
  }

  /**
   * Handle new connection
   */
  private handleConnection(socket: Socket): void {
    const { userId, userName, role } = socket.data as SocketData;

    logger.info('WebSocket client connected', {
      socketId: socket.id,
      userId,
      userName,
      role,
    });

    // Send authentication success
    socket.emit('authenticated', {
      userId,
      userName,
      role,
    });

    // Update presence to online
    this.updatePresence(userId, 'online');
    this.broadcastPresence(userId, 'online');

    // Join conversation room
    socket.on('join_conversation', (conversationId: string) => {
      this.joinConversationRoom(socket, conversationId);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId: string) => {
      this.leaveConversationRoom(socket, conversationId);
    });

    // Handle incoming messages
    socket.on('send_message', async (data: any, callback?: (ack: any) => void) => {
      try {
        await this.handleSendMessage(socket, data);
        if (callback) {
          callback({ success: true });
        }
      } catch (error: any) {
        logger.error('Failed to handle send_message', { error: error.message });
        if (callback) {
          callback({ success: false, error: error.message });
        }
      }
    });

    // Handle typing start
    socket.on('typing_start', (conversationId: string) => {
      this.handleTypingStart(socket, conversationId);
    });

    // Handle typing stop
    socket.on('typing_stop', (conversationId: string) => {
      this.handleTypingStop(socket, conversationId);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('WebSocket error', {
        socketId: socket.id,
        userId,
        error: error.message,
      });
    });
  }

  /**
   * Join conversation room
   */
  private joinConversationRoom(socket: Socket, conversationId: string): void {
    const roomName = `conversation:${conversationId}`;
    socket.join(roomName);
    socket.data.conversationId = conversationId;

    logger.info('Client joined conversation', {
      socketId: socket.id,
      userId: socket.data.userId,
      conversationId,
    });

    socket.emit('joined_conversation', { conversationId });
  }

  /**
   * Leave conversation room
   */
  private leaveConversationRoom(socket: Socket, conversationId: string): void {
    const roomName = `conversation:${conversationId}`;
    socket.leave(roomName);

    logger.info('Client left conversation', {
      socketId: socket.id,
      userId: socket.data.userId,
      conversationId,
    });

    socket.emit('left_conversation', { conversationId });
  }

  /**
   * Handle send message event
   */
  private async handleSendMessage(socket: Socket, data: any): Promise<void> {
    const { conversationId, content } = data;
    const { userId, userName, role } = socket.data as SocketData;

    // Validate message
    if (!conversationId || !content) {
      throw new Error('conversationId and content are required');
    }

    logger.info('Message sent via WebSocket', {
      userId,
      conversationId,
      role,
      contentLength: content.length,
    });

    // Broadcast message to conversation room
    const roomName = `conversation:${conversationId}`;
    this.io?.to(roomName).emit('message_received', {
      conversationId,
      content,
      sender: {
        userId,
        userName,
        role,
      },
      timestamp: new Date().toISOString(),
    });

    // Note: Actual message saving to database is handled by the REST API
    // WebSocket is just for real-time notification
  }

  /**
   * Handle typing start
   */
  private handleTypingStart(socket: Socket, conversationId: string): void {
    const { userId, userName } = socket.data as SocketData;
    const roomName = `conversation:${conversationId}`;

    // Clear existing timeout
    const timeoutKey = `${socket.id}:${conversationId}`;
    if (this.typingTimeouts.has(timeoutKey)) {
      clearTimeout(this.typingTimeouts.get(timeoutKey)!);
    }

    // Broadcast typing to room (except sender)
    socket.to(roomName).emit('typing_indicator', {
      userId,
      userName,
      isTyping: true,
    });

    // Auto-stop after 3 seconds
    const timeout = setTimeout(() => {
      socket.to(roomName).emit('typing_indicator', {
        userId,
        userName,
        isTyping: false,
      });
      this.typingTimeouts.delete(timeoutKey);
    }, 3000);

    this.typingTimeouts.set(timeoutKey, timeout);
  }

  /**
   * Handle typing stop
   */
  private handleTypingStop(socket: Socket, conversationId: string): void {
    const { userId, userName } = socket.data as SocketData;
    const roomName = `conversation:${conversationId}`;
    const timeoutKey = `${socket.id}:${conversationId}`;

    // Clear timeout
    if (this.typingTimeouts.has(timeoutKey)) {
      clearTimeout(this.typingTimeouts.get(timeoutKey)!);
      this.typingTimeouts.delete(timeoutKey);
    }

    // Broadcast typing stop
    socket.to(roomName).emit('typing_indicator', {
      userId,
      userName,
      isTyping: false,
    });
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(socket: Socket, reason: string): void {
    const { userId, userName } = socket.data as SocketData;

    logger.info('WebSocket client disconnected', {
      socketId: socket.id,
      userId,
      userName,
      reason,
    });

    // Clear all typing timeouts for this socket
    for (const [key, timeout] of this.typingTimeouts.entries()) {
      if (key.startsWith(socket.id)) {
        clearTimeout(timeout);
        this.typingTimeouts.delete(key);
      }
    }

    // Update presence to offline
    this.updatePresence(userId, 'offline');
    this.broadcastPresence(userId, 'offline');
  }

  /**
   * Send message to specific conversation room
   */
  sendMessage(conversationId: string, message: any): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized, cannot send message');
      return;
    }

    const roomName = `conversation:${conversationId}`;
    this.io.to(roomName).emit('message_received', {
      ...message,
      timestamp: message.timestamp || new Date().toISOString(),
    });

    logger.debug('Message sent to conversation room', { conversationId });
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: string, event: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized, cannot send to user');
      return;
    }

    const userRoom = `user:${userId}`;
    this.io.to(userRoom).emit(event, data);
  }

  /**
   * Update user presence (placeholder for database update)
   */
  private updatePresence(userId: string, status: 'online' | 'offline'): void {
    // TODO: Update database with user presence
    // For MVP, we'll just log it
    logger.debug('User presence updated', { userId, status });
  }

  /**
   * Broadcast presence update to all connected clients
   */
  private broadcastPresence(userId: string, status: 'online' | 'offline'): void {
    if (!this.io) return;

    this.io.emit('presence_update', {
      userId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get WebSocket server instance
   */
  getIO(): Server | null {
    return this.io;
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    if (!this.io) return 0;
    return this.io.engine.clientsCount;
  }
}

// Export singleton instance
export default new WebSocketService();


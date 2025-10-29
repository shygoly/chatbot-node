import { io, Socket } from 'socket.io-client';

interface MessageData {
  conversationId: string;
  content: string;
  sender: {
    userId: string;
    userName?: string;
    role: 'admin' | 'customer';
  };
  timestamp: string;
}

interface TypingData {
  userId: string;
  userName?: string;
  isTyping: boolean;
}

interface PresenceData {
  userId: string;
  status: 'online' | 'offline';
  timestamp: string;
}

class AdminWebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  /**
   * Connect to WebSocket server
   */
  connect(token: string, apiUrl: string = 'http://localhost:3000'): void {
    if (this.socket?.connected || this.isConnecting) {
      console.log('Already connected or connecting');
      return;
    }

    this.isConnecting = true;

    this.socket = io(apiUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection established
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected', this.socket?.id);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.onConnectionChange('connected');
    });

    // Authentication successful
    this.socket.on('authenticated', (data) => {
      console.log('✅ Authenticated as admin', data);
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      this.isConnecting = false;
      this.reconnectAttempts++;
      this.onConnectionChange('error');
    });

    // Disconnected
    this.socket.on('disconnect', (reason) => {
      console.log('⚠️ Disconnected:', reason);
      this.onConnectionChange('disconnected');

      if (reason === 'io server disconnect') {
        // Server disconnected, attempt manual reconnect
        setTimeout(() => {
          this.socket?.connect();
        }, 1000);
      }
    });

    // Reconnecting
    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnect attempt ${attempt}/${this.maxReconnectAttempts}`);
      this.onConnectionChange('reconnecting');
    });

    // Reconnected
    this.socket.on('reconnect', (attempt) => {
      console.log(`✅ Reconnected after ${attempt} attempts`);
      this.reconnectAttempts = 0;
      this.onConnectionChange('connected');
    });

    // Error
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Join a conversation room
   */
  joinConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot join conversation: not connected');
      return;
    }

    this.socket.emit('join_conversation', conversationId);
    console.log('📥 Joined conversation:', conversationId);
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('leave_conversation', conversationId);
    console.log('📤 Left conversation:', conversationId);
  }

  /**
   * Send a message
   */
  sendMessage(
    conversationId: string,
    content: string,
    callback?: (ack: { success: boolean; error?: string }) => void
  ): void {
    if (!this.socket?.connected) {
      console.warn('Cannot send message: not connected');
      if (callback) {
        callback({ success: false, error: 'Not connected' });
      }
      return;
    }

    this.socket.emit(
      'send_message',
      {
        conversationId,
        content,
      },
      callback
    );
  }

  /**
   * Send typing start event
   */
  sendTypingStart(conversationId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing_start', conversationId);
  }

  /**
   * Send typing stop event
   */
  sendTypingStop(conversationId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing_stop', conversationId);
  }

  /**
   * Listen for incoming messages
   */
  onMessageReceived(callback: (data: MessageData) => void): void {
    if (!this.socket) return;
    this.socket.on('message_received', callback);
  }

  /**
   * Listen for typing indicators
   */
  onTypingIndicator(callback: (data: TypingData) => void): void {
    if (!this.socket) return;
    this.socket.on('typing_indicator', callback);
  }

  /**
   * Listen for presence updates
   */
  onPresenceUpdate(callback: (data: PresenceData) => void): void {
    if (!this.socket) return;
    this.socket.on('presence_update', callback);
  }

  /**
   * Connection state change handler (to be overridden)
   */
  onConnectionChange(state: 'connected' | 'disconnected' | 'reconnecting' | 'error'): void {
    // Override this method to handle connection state changes
    console.log('Connection state:', state);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Export singleton instance
export default new AdminWebSocketClient();


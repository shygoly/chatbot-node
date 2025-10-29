/**
 * Widget WebSocket Handler
 * Handles real-time communication for customer widget
 */

class WidgetWebSocketHandler {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.conversationId = null;
    this.sessionId = null;
    this.apiUrl = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.messageCallbacks = [];
    this.typingCallbacks = [];
    this.connectionCallbacks = [];
  }

  /**
   * Connect to WebSocket server
   */
  connect(sessionId, apiUrl = 'http://localhost:3000') {
    if (this.socket && this.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    this.sessionId = sessionId;
    this.apiUrl = apiUrl;

    // Check if Socket.io client is loaded
    if (typeof io === 'undefined') {
      console.error('[WebSocket] Socket.io client not loaded');
      this.loadSocketIOClient(() => {
        this.initializeSocket();
      });
      return;
    }

    this.initializeSocket();
  }

  /**
   * Load Socket.io client from CDN
   */
  loadSocketIOClient(callback) {
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.6.0/socket.io.min.js';
    script.onload = callback;
    script.onerror = () => {
      console.error('[WebSocket] Failed to load Socket.io client');
    };
    document.head.appendChild(script);
  }

  /**
   * Initialize Socket connection
   */
  initializeSocket() {
    console.log('[WebSocket] Connecting...', this.apiUrl);

    this.socket = io(this.apiUrl, {
      auth: {
        sessionId: this.sessionId
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Connected
    this.socket.on('connect', () => {
      console.log('[WebSocket] ✅ Connected', this.socket.id);
      this.connected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionChange('connected');
    });

    // Authenticated
    this.socket.on('authenticated', (data) => {
      console.log('[WebSocket] ✅ Authenticated', data);
    });

    // Joined conversation
    this.socket.on('joined_conversation', (data) => {
      console.log('[WebSocket] 📥 Joined conversation', data.conversationId);
      this.conversationId = data.conversationId;
    });

    // Message received
    this.socket.on('message_received', (data) => {
      console.log('[WebSocket] 💬 Message received', data);
      this.messageCallbacks.forEach(callback => callback(data));
    });

    // Typing indicator
    this.socket.on('typing_indicator', (data) => {
      console.log('[WebSocket] ⌨️ Typing indicator', data);
      this.typingCallbacks.forEach(callback => callback(data));
    });

    // Connect error
    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] ❌ Connection error:', error.message);
      this.connected = false;
      this.reconnectAttempts++;
      this.notifyConnectionChange('error');
    });

    // Disconnected
    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] ⚠️ Disconnected:', reason);
      this.connected = false;
      this.notifyConnectionChange('disconnected');

      if (reason === 'io server disconnect') {
        // Server disconnected, manual reconnect
        setTimeout(() => {
          if (this.socket) {
            this.socket.connect();
          }
        }, 1000);
      }
    });

    // Reconnecting
    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`[WebSocket] 🔄 Reconnect attempt ${attempt}/${this.maxReconnectAttempts}`);
      this.notifyConnectionChange('reconnecting');
    });

    // Reconnected
    this.socket.on('reconnect', (attempt) => {
      console.log(`[WebSocket] ✅ Reconnected after ${attempt} attempts`);
      this.connected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionChange('connected');
      
      // Rejoin conversation if we were in one
      if (this.conversationId) {
        this.joinConversation(this.conversationId);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Join conversation room
   */
  joinConversation(conversationId) {
    if (!this.socket || !this.connected) {
      console.warn('[WebSocket] Cannot join conversation: not connected');
      return;
    }

    this.conversationId = conversationId;
    this.socket.emit('join_conversation', conversationId);
  }

  /**
   * Send message
   */
  sendMessage(content, callback) {
    if (!this.socket || !this.connected) {
      console.warn('[WebSocket] Cannot send message: not connected');
      if (callback) {
        callback({ success: false, error: 'Not connected' });
      }
      return;
    }

    if (!this.conversationId) {
      console.warn('[WebSocket] No conversation joined');
      if (callback) {
        callback({ success: false, error: 'No conversation' });
      }
      return;
    }

    this.socket.emit('send_message', {
      conversationId: this.conversationId,
      content: content
    }, callback);
  }

  /**
   * Send typing start
   */
  sendTypingStart() {
    if (!this.socket || !this.connected || !this.conversationId) return;
    this.socket.emit('typing_start', this.conversationId);
  }

  /**
   * Send typing stop
   */
  sendTypingStop() {
    if (!this.socket || !this.connected || !this.conversationId) return;
    this.socket.emit('typing_stop', this.conversationId);
  }

  /**
   * Register callback for incoming messages
   */
  onMessageReceived(callback) {
    this.messageCallbacks.push(callback);
  }

  /**
   * Register callback for typing indicators
   */
  onTypingIndicator(callback) {
    this.typingCallbacks.push(callback);
  }

  /**
   * Register callback for connection changes
   */
  onConnectionChange(callback) {
    this.connectionCallbacks.push(callback);
  }

  /**
   * Notify connection change
   */
  notifyConnectionChange(state) {
    this.connectionCallbacks.forEach(callback => callback(state));
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Get conversation ID
   */
  getConversationId() {
    return this.conversationId;
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.WidgetWebSocketHandler = WidgetWebSocketHandler;
}


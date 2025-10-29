# Phase 2.2: WebSocket Real-time Updates Requirements

**Version**: 2.0  
**Date**: October 28, 2025  
**Status**: Planning

---

## Overview

Implement real-time bidirectional communication using WebSocket (Socket.io) to enable instant message delivery, typing indicators, presence tracking, and live updates across the admin dashboard and customer widget.

## Business Goals

1. **Instant Communication**: Enable real-time message delivery with <100ms latency
2. **Enhanced User Experience**: Provide typing indicators and presence information
3. **Operational Efficiency**: Live conversation updates without page refresh
4. **Reliability**: 99.9% message delivery rate with auto-reconnection

## MVP Core Features

### 1. Real-time Message Delivery
- Bidirectional message flow (customer ↔ agent)
- Instant delivery without polling
- Message acknowledgment

### 2. Typing Indicators
- Show "typing..." when customer is typing
- Show agent name + "typing..." to customer
- Auto-hide after 3 seconds of inactivity

### 3. Connection Management
- Auto-connect on page load
- Auto-reconnect on disconnect
- Connection status indicator

### 4. Basic Presence
- Online/offline status
- Last seen timestamp

## Technical Architecture

### Socket.io Server

**Location**: `src/services/websocket.service.ts`

**Key Components**:
```typescript
class WebSocketService {
  io: Server;
  
  initialize(httpServer): void
  authenticateConnection(socket, next): void
  handleConnection(socket): void
  handleDisconnection(socket): void
  
  // Room management
  joinConversationRoom(socket, conversationId): void
  leaveConversationRoom(socket, conversationId): void
  
  // Message handling
  sendMessage(conversationId, message): void
  broadcastTyping(conversationId, userId, isTyping): void
  broadcastPresence(userId, status): void
}
```

**Event Types**:
```typescript
// Client → Server
'authenticate' // JWT or session token
'join_conversation' // Join specific room
'leave_conversation' // Leave room
'send_message' // Send chat message
'typing_start' // User started typing
'typing_stop' // User stopped typing

// Server → Client
'authenticated' // Auth successful
'message_received' // New message
'typing_indicator' // Someone is typing
'presence_update' // User online/offline
'error' // Error occurred
'reconnected' // Reconnection successful
```

### Client Implementation

#### Admin Dashboard Client
**Location**: `public/admin/src/services/websocket-client.ts`

```typescript
class AdminWebSocketClient {
  socket: Socket;
  
  connect(token: string): void
  disconnect(): void
  
  // Message operations
  sendMessage(conversationId, content): void
  onMessageReceived(callback): void
  
  // Typing operations
  sendTypingStart(conversationId): void
  sendTypingStop(conversationId): void
  onTypingIndicator(callback): void
  
  // Presence
  onPresenceUpdate(callback): void
}
```

#### Widget Client
**Location**: `public/widget/websocket-handler.js`

```javascript
class WidgetWebSocketHandler {
  socket: WebSocket;
  
  connect(sessionId) {}
  disconnect() {}
  
  sendMessage(message) {}
  onMessageReceived(callback) {}
  
  sendTyping(isTyping) {}
  onAgentTyping(callback) {}
}
```

## MVP Implementation Details

### Authentication

**Admin (JWT)**:
```typescript
socket.on('authenticate', async (token) => {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    socket.data.userId = decoded.userId;
    socket.data.role = 'admin';
    socket.emit('authenticated', { success: true });
  } catch (error) {
    socket.emit('error', { message: 'Authentication failed' });
    socket.disconnect();
  }
});
```

**Customer (Session)**:
```typescript
socket.on('authenticate', async (sessionId) => {
  const user = await getInboxUserBySession(sessionId);
  if (user) {
    socket.data.userId = user.id;
    socket.data.role = 'customer';
    socket.emit('authenticated', { success: true });
  }
});
```

### Room Structure

**Conversation Rooms**:
- Room name: `conversation:${conversationId}`
- All participants join the same room
- Messages broadcast to room members only

**User Rooms**:
- Room name: `user:${userId}`
- For direct user notifications

### Message Flow

```
Customer Widget                WebSocket Server              Admin Dashboard
      |                              |                              |
      |-- send_message ------------→ |                              |
      |                              |-- validate message           |
      |                              |-- save to database           |
      |                              |-- message_received --------→ |
      |                              |                              |
      |                              |← typing_start --------------- |
      |← typing_indicator ---------- |                              |
      |                              |                              |
```

### Typing Indicator Logic

```typescript
let typingTimeouts = new Map();

socket.on('typing_start', (conversationId) => {
  // Clear existing timeout
  if (typingTimeouts.has(socket.id)) {
    clearTimeout(typingTimeouts.get(socket.id));
  }
  
  // Broadcast typing to room
  socket.to(`conversation:${conversationId}`).emit('typing_indicator', {
    userId: socket.data.userId,
    userName: socket.data.userName,
    isTyping: true
  });
  
  // Auto-stop after 3 seconds
  const timeout = setTimeout(() => {
    socket.to(`conversation:${conversationId}`).emit('typing_indicator', {
      userId: socket.data.userId,
      isTyping: false
    });
  }, 3000);
  
  typingTimeouts.set(socket.id, timeout);
});
```

### Presence Tracking (MVP)

**Simple Status**:
```typescript
// On connect
await updateUserPresence(userId, 'online');
socket.broadcast.emit('presence_update', {
  userId,
  status: 'online',
  timestamp: new Date()
});

// On disconnect
await updateUserPresence(userId, 'offline');
socket.broadcast.emit('presence_update', {
  userId,
  status: 'offline',
  timestamp: new Date()
});
```

## Database Schema (MVP)

### Table: `user_presence`
```sql
CREATE TABLE user_presence (
  user_id INTEGER PRIMARY KEY,
  status VARCHAR(20) NOT NULL, -- online, offline
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Integration

### Modified Chat API
**File**: `src/routes/coze-api.routes.ts`

Add WebSocket notification:
```typescript
router.post('/chat', async (req, res) => {
  // ... existing chat logic ...
  
  // Notify via WebSocket
  websocketService.sendMessage(conversationId, {
    type: 'message',
    content: reply,
    sender: 'bot',
    timestamp: new Date()
  });
  
  res.json({ ... });
});
```

## Client Integration Examples

### Admin Dashboard

```typescript
// Initialize WebSocket
const ws = new AdminWebSocketClient();
ws.connect(authToken);

// Listen for messages
ws.onMessageReceived((message) => {
  addMessageToUI(message);
  playNotificationSound();
});

// Listen for typing
ws.onTypingIndicator((data) => {
  if (data.isTyping) {
    showTypingIndicator(data.userName);
  } else {
    hideTypingIndicator();
  }
});

// Send message
sendButton.onclick = () => {
  ws.sendMessage(conversationId, inputValue);
  ws.sendTypingStop(conversationId);
};

// Handle typing
input.oninput = debounce(() => {
  ws.sendTypingStart(conversationId);
}, 300);
```

### Customer Widget

```javascript
// Initialize WebSocket
const ws = new WidgetWebSocketHandler();
ws.connect(sessionId);

// Listen for messages
ws.onMessageReceived((message) => {
  displayMessage(message);
});

// Listen for agent typing
ws.onAgentTyping((agentName) => {
  showTypingBubble(`${agentName} is typing...`);
});

// Send message
function sendMessage(text) {
  ws.sendMessage(text);
}
```

## Error Handling

### Connection Errors
```typescript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
  showConnectionStatus('Connecting...');
  // Auto-retry with exponential backoff
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  showConnectionStatus('Disconnected');
  
  if (reason === 'io server disconnect') {
    // Server disconnected, manual reconnect
    socket.connect();
  }
  // else: socket will auto-reconnect
});
```

### Message Delivery
```typescript
// Send with acknowledgment
socket.emit('send_message', message, (ack) => {
  if (ack.success) {
    markMessageSent(message.id);
  } else {
    showError('Message failed to send');
    retryMessage(message);
  }
});
```

## Configuration

### Environment Variables
```bash
# WebSocket Configuration
WEBSOCKET_PORT=3001  # Separate port or same as HTTP
WEBSOCKET_CORS_ORIGIN=*  # Or specific domains
WEBSOCKET_PING_TIMEOUT=60000  # 60 seconds
WEBSOCKET_PING_INTERVAL=25000  # 25 seconds
```

### Socket.io Server Options
```typescript
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin,
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'], // Try WebSocket first
  allowEIO3: true // Backward compatibility
});
```

## Testing

### Unit Tests
- Authentication logic
- Room join/leave operations
- Message formatting
- Typing timeout logic

### Integration Tests
- Client connection flow
- Message send/receive
- Room broadcasting
- Disconnection handling

### Load Tests
- 1000 concurrent connections
- 100 messages/second throughput
- Reconnection storm (all clients reconnect at once)

## MVP Scope Limitations

**Not Included in MVP**:
- Read receipts
- Message editing/deletion
- File uploads via WebSocket
- Voice/video calls
- Screen sharing
- Advanced presence (busy, away, custom status)
- Conversation list real-time updates (Phase 2 enhancement)

## Success Metrics (MVP)

- **Latency**: <100ms message delivery
- **Delivery Rate**: >99% messages delivered
- **Reconnection**: <2 seconds average reconnect time
- **Connection Stability**: <1% disconnect rate
- **Concurrent Users**: Support 500+ simultaneous connections

## Future Enhancements

### Phase 2 Features
- Message read receipts
- Advanced presence (busy, away, custom)
- Real-time conversation list updates
- New conversation notifications
- Desktop notifications
- Sound notifications
- Message reactions (emoji)

### Phase 3 Features
- Message search in real-time
- Live agent transfer
- Multi-agent conversation
- Conversation merge
- Video/audio call signaling

## Dependencies

```json
{
  "socket.io": "^4.6.0",
  "socket.io-client": "^4.6.0"
}
```

## Migration Path

1. Deploy WebSocket server alongside existing REST API
2. Clients can use REST API as fallback
3. Gradually enable WebSocket features
4. Monitor performance and stability
5. Full rollout after 2 weeks of testing

---

**Document Owner**: Development Team  
**Last Updated**: October 28, 2025  
**Status**: Ready for MVP Implementation


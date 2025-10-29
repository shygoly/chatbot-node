# Integration Guide

## How to Integrate chatbot-node Proxy into Your Application

This guide shows how to use the chatbot-node proxy in your frontend application.

---

## JavaScript/TypeScript SDK Example

Create a simple SDK client:

```typescript
// chatbot-sdk.ts
interface ChatbotConfig {
  baseUrl: string;
  token: string;
  tenantId?: string;
}

class ChatbotClient {
  private baseUrl: string;
  private token: string;
  private tenantId: string;

  constructor(config: ChatbotConfig) {
    this.baseUrl = config.baseUrl;
    this.token = config.token;
    this.tenantId = config.tenantId || '1';
  }

  private async request<T>(
    method: string,
    path: string,
    data?: any
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'tenant-id': this.tenantId,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Bot Settings
  async getBotSettings(params: { pageNo: number; pageSize: number; shopId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/bot-settings/page?${query}`);
  }

  async getBotSettingByShopName(shopName: string) {
    return this.request('GET', `/api/bot-settings/shop/name/${shopName}`);
  }

  async createBotSetting(data: any) {
    return this.request('POST', '/api/bot-settings', data);
  }

  // Chat
  async chat(message: string, shopId: string, userId: string) {
    return this.request('POST', '/api/coze/chat', {
      shopId,
      userId,
      message,
    });
  }

  // Chat History
  async getChatHistory(params: { pageNo: number; pageSize: number; shopId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/chat-history/page?${query}`);
  }

  async getTodayStatistics() {
    return this.request('GET', '/api/chat-history/statistics/today');
  }

  async getReplyRate() {
    return this.request('GET', '/api/chat-history/statistics/reply-rate');
  }

  // Inquiries
  async createInquiry(email: string, message: string) {
    return this.request('POST', '/api/inquiries', { email, message });
  }

  async getInquiries(params: { pageNo: number; pageSize: number; email?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/inquiries/page?${query}`);
  }

  // Inbox Users
  async getInboxUsers(params: { pageNo: number; pageSize: number; shopId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/inbox-users/page?${query}`);
  }

  async createInboxUser(data: any) {
    return this.request('POST', '/api/inbox-users', data);
  }
}

// Usage
const client = new ChatbotClient({
  baseUrl: 'http://localhost:3000',
  token: 'your-access-token',
  tenantId: '1',
});

// Example usage
const stats = await client.getTodayStatistics();
console.log('Today\'s chat stats:', stats);
```

---

## React Integration Example

```tsx
// hooks/useChatbot.ts
import { useState, useEffect } from 'react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export function useChatbot(shopId: string, userId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (content: string) => {
    setLoading(true);
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('http://localhost:3000/api/coze/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'tenant-id': '1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId,
          userId,
          message: content,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let botResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          botResponse += chunk;
        }
      }

      // Add bot message
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'bot',
        content: botResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading };
}

// Component usage
function ChatWidget({ shopId, userId }: { shopId: string; userId: string }) {
  const { messages, sendMessage, loading } = useChatbot(shopId, userId);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="chat-widget">
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            <div className="content">{msg.content}</div>
            <div className="timestamp">{msg.timestamp.toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
```

---

## Vue.js Integration Example

```vue
<!-- ChatComponent.vue -->
<template>
  <div class="chatbot">
    <div class="messages">
      <div 
        v-for="msg in messages" 
        :key="msg.id"
        :class="['message', msg.sender]"
      >
        <div class="content">{{ msg.content }}</div>
        <div class="time">{{ formatTime(msg.timestamp) }}</div>
      </div>
    </div>
    
    <div class="input-area">
      <input 
        v-model="input" 
        @keyup.enter="sendMessage"
        :disabled="loading"
        placeholder="Type a message..."
      />
      <button @click="sendMessage" :disabled="loading">
        {{ loading ? 'Sending...' : 'Send' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const props = defineProps<{
  shopId: string;
  userId: string;
}>();

const messages = ref<Message[]>([]);
const input = ref('');
const loading = ref(false);

async function sendMessage() {
  if (!input.value.trim()) return;
  
  loading.value = true;
  
  // Add user message
  messages.value.push({
    id: Date.now().toString(),
    sender: 'user',
    content: input.value,
    timestamp: new Date(),
  });
  
  const userInput = input.value;
  input.value = '';
  
  try {
    const response = await fetch('http://localhost:3000/api/coze/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'tenant-id': '1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shopId: props.shopId,
        userId: props.userId,
        message: userInput,
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let botResponse = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        botResponse += decoder.decode(value);
      }
    }

    messages.value.push({
      id: Date.now().toString(),
      sender: 'bot',
      content: botResponse,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Chat error:', error);
  } finally {
    loading.value = false;
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString();
}
</script>

<style scoped>
.chatbot {
  display: flex;
  flex-direction: column;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 70%;
}

.message.user {
  background: #007bff;
  color: white;
  margin-left: auto;
  text-align: right;
}

.message.bot {
  background: #f1f1f1;
  margin-right: auto;
}

.input-area {
  display: flex;
  padding: 16px;
  border-top: 1px solid #ddd;
}

.input-area input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.input-area button {
  margin-left: 8px;
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.input-area button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

---

## Remix Integration Example

```typescript
// app/lib/chatbot.server.ts
import { json } from '@remix-run/node';

const CHATBOT_API = process.env.CHATBOT_PROXY_URL || 'http://localhost:3000';

export async function getChatHistory(
  token: string,
  params: { pageNo: number; pageSize: number; shopId?: string }
) {
  const query = new URLSearchParams(params as any).toString();
  const response = await fetch(`${CHATBOT_API}/api/chat-history/page?${query}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'tenant-id': '1',
    },
  });

  if (!response.ok) {
    throw json({ error: 'Failed to fetch chat history' }, { status: response.status });
  }

  return response.json();
}

export async function getBotSettings(token: string, shopId: string) {
  const response = await fetch(
    `${CHATBOT_API}/api/bot-settings/shop/${shopId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'tenant-id': '1',
      },
    }
  );

  if (!response.ok) {
    throw json({ error: 'Failed to fetch bot settings' }, { status: response.status });
  }

  return response.json();
}

// app/routes/chat.tsx
import { LoaderFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { getChatHistory, getBotSettings } from '~/lib/chatbot.server';

export const loader: LoaderFunction = async ({ request }) => {
  const token = // ... get token from session
  const shopId = // ... get from params
  
  const [history, settings] = await Promise.all([
    getChatHistory(token, { pageNo: 1, pageSize: 20, shopId }),
    getBotSettings(token, shopId),
  ]);

  return { history, settings };
};

export default function ChatPage() {
  const { history, settings } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1>Chat History</h1>
      <pre>{JSON.stringify(history, null, 2)}</pre>
      
      <h2>Bot Settings</h2>
      <pre>{JSON.stringify(settings, null, 2)}</pre>
    </div>
  );
}
```

---

## Next.js Integration Example

```typescript
// lib/chatbot-api.ts
const CHATBOT_API = process.env.NEXT_PUBLIC_CHATBOT_API || 'http://localhost:3000';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${CHATBOT_API}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'tenant-id': '1',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

// app/chat/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/chatbot-api';

export default function ChatPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await apiRequest('/api/chat-history/statistics/today');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Today's Chat Statistics</h1>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}
```

---

## Environment Variables for Frontend

### React/Vue/Next.js

Create `.env.local`:
```bash
# Proxy URL (change in production)
REACT_APP_CHATBOT_API=http://localhost:3000
# or for Next.js
NEXT_PUBLIC_CHATBOT_API=http://localhost:3000
# or for Vue
VITE_CHATBOT_API=http://localhost:3000
```

---

## nginx Reverse Proxy Configuration

For production deployment:

```nginx
# /etc/nginx/sites-available/myapp
upstream chatbot_proxy {
    server localhost:3000;
}

upstream chatbot_backend {
    server localhost:48080;
}

server {
    listen 80;
    server_name myapp.com;

    # Chatbot proxy API
    location /api/ {
        proxy_pass http://chatbot_proxy;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        
        # SSE support
        proxy_buffering off;
        proxy_read_timeout 3600s;
    }

    # Your frontend app
    location / {
        root /var/www/myapp;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Docker Compose Setup

Run both backend and proxy together:

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    image: chatbotadmin:latest
    ports:
      - "48080:48080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: chatbot
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  proxy:
    build: ./chatbot-node
    ports:
      - "3000:3000"
    environment:
      - BACKEND_URL=http://backend:48080
      - NODE_ENV=production
      - LOG_LEVEL=info
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

Start:
```bash
docker-compose up -d
```

---

## Authentication Flow

### 1. User Login

```javascript
// Login to backend to get token
const loginResponse = await fetch('http://localhost:48080/admin-api/system/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'tenant-id': '1',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123',
  }),
});

const { data } = await loginResponse.json();
const token = data.accessToken;

// Store token
localStorage.setItem('auth_token', token);
localStorage.setItem('user_id', data.userId);
```

### 2. Use Token with Proxy

```javascript
// All subsequent requests to proxy use this token
fetch('http://localhost:3000/api/bot-settings/page?pageNo=1&pageSize=10', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    'tenant-id': '1',
  },
});
```

### 3. Token Refresh

```javascript
// When token expires (401 error)
const refreshResponse = await fetch('http://localhost:48080/admin-api/system/auth/refresh-token', {
  method: 'POST',
  params: {
    refreshToken: localStorage.getItem('refresh_token'),
  },
});

const { data } = await refreshResponse.json();
localStorage.setItem('auth_token', data.accessToken);
```

---

## SSE Chat Integration

### JavaScript

```javascript
async function streamChat(message) {
  const response = await fetch('http://localhost:3000/api/coze/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'tenant-id': '1',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shopId: '123',
      userId: 'user-001',
      message,
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    
    // Process each SSE event
    const events = chunk.split('\n\n');
    for (const event of events) {
      if (event.startsWith('data: ')) {
        const data = event.slice(6);
        console.log('Bot response:', data);
        // Update UI with streaming response
      }
    }
  }
}
```

---

## Error Handling Best Practices

```typescript
// centralized error handler
async function handleApiError(error: any) {
  if (error.statusCode === 401) {
    // Token expired - redirect to login
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  } else if (error.statusCode === 403) {
    // Insufficient permissions
    alert('You do not have permission to perform this action');
  } else if (error.statusCode === 503) {
    // Backend down
    alert('Service temporarily unavailable. Please try again later.');
  } else {
    // Generic error
    console.error('API error:', error);
    alert(error.message || 'An error occurred');
  }
}

// Usage
try {
  const data = await apiRequest('/api/bot-settings/page?pageNo=1&pageSize=10');
} catch (error) {
  handleApiError(error);
}
```

---

## CORS Configuration for Production

If your frontend is on a different domain:

### Update Proxy `.env`

```bash
CORS_ORIGIN=https://myapp.com,https://www.myapp.com
```

### Or configure programmatically

Edit `src/app.ts`:
```typescript
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://myapp.com',
        'https://www.myapp.com',
        'http://localhost:3001', // dev
      ];
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
```

---

## Deployment Checklist

- [ ] Build TypeScript: `npm run build`
- [ ] Set `NODE_ENV=production`
- [ ] Configure `BACKEND_URL` to production backend
- [ ] Set `CORS_ORIGIN` to your frontend domain(s)
- [ ] Set `LOG_LEVEL=warn` or `error` for production
- [ ] Copy `config/coze-private-key.pem` to production server
- [ ] Set secrets via environment variables (not in git)
- [ ] Configure HTTPS (via reverse proxy)
- [ ] Set up monitoring/logging (e.g., Datadog, LogDNA)
- [ ] Configure health check endpoint for load balancer
- [ ] Test all endpoints in staging environment


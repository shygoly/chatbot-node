# Chatbot UI Requirements

## Overview
Build a complete chatbot UI system integrated with EverShop e-commerce platform, consisting of a customer-facing chat widget and merchant admin dashboard.

## 1. Customer Chat Widget

### 1.1 Widget Appearance
- **Floating Button**
  - Position: Fixed bottom-right (20px from bottom, 20px from right)
  - Size: 45px circle
  - Color: Red background (#FF0000)
  - Icon: White arrow SVG (rotates 180° when open)
  - Shadow: 0 4px 12px rgba(0, 0, 0, 0.15)
  - Hover: Scale 1.05 + deeper shadow
  - Z-index: 1000001

- **Chat Window**
  - Position: Fixed bottom-right (90px from bottom, 20px from right)
  - Size: 380px × 600px
  - Border-radius: 12px
  - Background: White
  - Shadow: 0 5px 20px rgba(0, 0, 0, 0.2)
  - Z-index: 1000000
  - Initial state: Hidden
  - Transition: 0.3s ease

### 1.2 Mobile Responsiveness
- **Breakpoint**: 480px
  - Width: 90% of viewport
  - Height: 60vh
  - Right: 5% (centered)
  - Same bottom spacing (90px)

### 1.3 Chat Interface
- **Header**
  - Bot name/shop name
  - Status indicator
  - Close button

- **Message Area**
  - Scrollable message list
  - Customer messages: Left-aligned, light blue background
  - Bot messages: Right-aligned, gray background
  - Timestamps for each message
  - Avatar icons

- **Input Area**
  - Text input field
  - Send button
  - File upload button (optional)
  - Emoji picker (optional)

### 1.4 Widget Features
- **Session Management**
  - Anonymous mode: Auto-generate session ID
  - Logged-in mode: Use EverShop customer ID
  - Store session in localStorage
  - Maintain chat history across page visits

- **Real-time Communication**
  - WebSocket or Server-Sent Events (SSE)
  - Typing indicators
  - Message delivery status
  - Auto-reconnect on disconnect

- **Integration Points**
  - Embed script with data attributes:
    - `data-api-url`: Backend API URL
    - `data-bot-id`: Bot identifier
    - `data-customer-id`: (Optional) EverShop customer ID
    - `data-shop-id`: Shop identifier

## 2. Merchant Admin Dashboard

### 2.1 Layout
- **Structure**: Single-page application with sidebar navigation
- **Responsive**: Desktop-first, tablet-compatible
- **Theme**: Clean, modern UI (inspired by Shopify Polaris)

### 2.2 Pages

#### 2.2.1 Inbox Page
- **Left Sidebar (250-300px)**
  - Tab filters: All / Unread (with badge count)
  - Conversation filters: All / Your Inbox / Unassigned / Resolved
  - Search box: Filter by name or email
  - Notification banner: Browser notifications status
  - Conversation list:
    - Customer avatar
    - Customer name/email
    - Last message preview
    - Date/time
    - Unread indicator
    - Active/selected state

- **Center Panel (flex 1)**
  - **Header**:
    - Customer name/email
    - Status badge (Customer/Online/Offline)
    - Customer stats: Since date, Order count, Total spent
    - Action buttons: Resolve, Star
  
  - **Message Area**:
    - Scrollable message feed
    - System messages (conversation assignments, conversions)
    - Customer messages (left-aligned)
    - Merchant messages (right-aligned)
    - Timestamps
  
  - **Input Area**:
    - Tabs: Chat / Note
    - Multiline text input
    - Quick reply selector (/)
    - Emoji/product/settings buttons
    - Send button

- **Right Sidebar (250-300px)**
  - **Conversation Details**:
    - Assigned agent info + reassign button
    - Customer profile + edit button
    - Recent orders section
    - Browsed pages/products
    - Checklist/tasks
    - Block conversation button (destructive)

#### 2.2.2 Settings Page
- **Bot Configuration**:
  - Bot name
  - Bot description
  - Bot status (Active/Inactive)
  - Welcome message
  - Fallback message
  - Working hours
  - Auto-assign rules

- **Widget Customization**:
  - Button color
  - Chat window theme
  - Position (left/right)
  - Custom CSS

- **EverShop Integration**:
  - Shop URL
  - API credentials
  - Auto-sync settings
  - Data sync status

#### 2.2.3 AI Assistant Page
- **Data Sync Management**:
  - **Products Section**:
    - Sync status (last synced time)
    - Product count
    - Sync now button
    - Auto-sync toggle
  
  - **Orders Section**:
    - Sync status
    - Order count
    - Sync now button
  
  - **Customers Section**:
    - Sync status
    - Customer count
    - Sync now button

- **Knowledge Base Status**:
  - Dataset statistics
  - Total documents
  - Last update time
  - Coze bot link

#### 2.2.4 Analytics Page
- **Metrics**:
  - Total conversations
  - Active conversations
  - Resolved conversations
  - Average response time
  - Customer satisfaction
  - Peak hours chart
  - Popular products inquired
  - Conversion rate

## 3. EverShop Integration

### 3.1 API Endpoints (EverShop)
- `POST /api/admin/user/login` - Authenticate
- `GET /api/products` - Fetch products
- `GET /api/orders` - Fetch orders
- `GET /api/customers` - Fetch customers

### 3.2 Data Transformation
- **Products**: Transform to Coze knowledge base format
  - id, title, description, price, inventory, vendor
  - Convert to CSV for knowledge base upload

- **Orders**: Store for customer context
  - Customer association
  - Order status
  - Total amount
  - Items

- **Customers**: Create inbox users
  - Name, email, phone
  - Total orders
  - Total spent
  - Last active

### 3.3 Sync Strategy
- **Manual**: Trigger sync from admin dashboard
- **Scheduled**: Auto-sync every N hours (configurable)
- **Webhook**: Real-time sync on EverShop events (future)

## 4. Authentication & Authorization

### 4.1 Merchant Auth
- **Method**: JWT-based (existing implementation)
- **Flow**:
  1. POST `/api/auth/login` with credentials
  2. Receive JWT token
  3. Store in localStorage
  4. Include in Authorization header
  5. Refresh token before expiry

### 4.2 Customer Auth
- **Anonymous Mode**:
  - Generate UUID on first visit
  - Store in localStorage
  - Create InboxUser record with UUID
  - Associate messages with session ID

- **Logged-in Mode** (Optional):
  - Accept EverShop customer token in widget
  - Validate token with EverShop API
  - Link session to customer ID
  - Pre-fill customer name/email

### 4.3 Session Management
- **Customer Sessions**:
  - Create on first message
  - Update last active timestamp
  - Store conversation ID
  - Maintain across page reloads

## 5. Technical Requirements

### 5.1 Frontend Stack
- **Widget**: Vanilla JavaScript (ES6+)
- **Admin Dashboard**: React 18 + Vite
- **Styling**: CSS3 (no external libraries for widget)
- **Admin UI**: Modern component library or custom components

### 5.2 API Integration
- **Customer Widget**:
  - `POST /api/coze/chat` - Send message
  - `GET /api/chat-history/conversation/:userId` - Load history
  - SSE or WebSocket for real-time updates

- **Admin Dashboard**:
  - `GET /api/inbox-users` - List conversations
  - `GET /api/chat-history/conversation/:id` - Get messages
  - `POST /api/chat-history/message` - Send reply
  - `GET /api/chat-history/statistics` - Dashboard stats
  - `POST /api/evershop/sync/*` - Sync EverShop data

### 5.3 Performance
- **Widget**:
  - Lazy load: Only load when button clicked
  - Bundle size: < 50KB (gzipped)
  - No external dependencies

- **Admin Dashboard**:
  - Code splitting by route
  - Lazy load components
  - Pagination for conversation list
  - Virtual scrolling for message lists

### 5.4 Browser Support
- **Widget**: Modern browsers (ES6+, no IE11)
- **Admin Dashboard**: Chrome, Firefox, Safari, Edge (latest 2 versions)

## 6. Non-Functional Requirements

### 6.1 Accessibility
- Keyboard navigation
- ARIA labels
- Screen reader support
- Focus management

### 6.2 Security
- XSS prevention
- CSRF protection
- Content Security Policy
- Secure token storage

### 6.3 Error Handling
- Network errors: Retry with exponential backoff
- API errors: User-friendly messages
- Session expiry: Auto-redirect to login
- Offline mode: Queue messages

### 6.4 Logging
- Client-side errors to backend
- User actions for analytics
- Performance metrics

## 7. Deployment

### 7.1 Widget Deployment
- **CDN**: Serve from chatbot-node `/public/widget/`
- **Embed Code**: Provide customers with:
```html
<script src="https://your-domain.com/widget/chatbot-widget.js"
        data-api-url="https://your-domain.com"
        data-bot-id="YOUR_BOT_ID"
        data-shop-id="YOUR_SHOP_ID">
</script>
```

### 7.2 Admin Dashboard Deployment
- **Build**: Vite build to `/public/admin/`
- **Serve**: Express static middleware
- **URL**: `https://your-domain.com/admin`

### 7.3 Backend Deployment
- Existing Node.js + Express setup
- Add static file serving
- Configure CORS for widget domains

## 8. Future Enhancements

### 8.1 Phase 2 Features
- Video chat support
- Screen sharing
- Canned responses library
- Multi-language support
- Sentiment analysis
- Customer intent detection

### 8.2 EverShop Advanced Integration
- Real-time webhook events
- Product recommendations in chat
- Order tracking in chat
- Cart abandonment triggers

### 8.3 Analytics & Reporting
- Advanced analytics dashboard
- Export reports (CSV, PDF)
- Custom date ranges
- Agent performance metrics


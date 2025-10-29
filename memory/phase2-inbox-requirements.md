# Phase 2.1: Full Inbox & Conversation Management Requirements

**Version**: 2.0  
**Date**: October 28, 2025  
**Status**: Planning

---

## Overview

Expand the basic inbox page into a comprehensive conversation management system with real-time updates, advanced filtering, agent assignment, customer context, and collaboration features.

## Business Goals

1. **Reduce Response Time**: Enable agents to handle conversations 50% faster
2. **Improve Agent Efficiency**: Support 100+ concurrent conversations per agent
3. **Enhance Customer Experience**: Provide context-aware, personalized support
4. **Enable Team Collaboration**: Support multi-agent workflows with assignments and notes

## User Stories

### Agent User Stories

**As an agent, I want to:**

1. **See all conversations in one place** so I can quickly access customer inquiries
2. **Filter conversations by status** (open/pending/resolved) so I can prioritize my work
3. **Search conversations by customer name or email** so I can find specific customers quickly
4. **Assign conversations to myself or teammates** so work is distributed efficiently
5. **Add tags to conversations** (urgent, billing, technical) so I can categorize issues
6. **Set conversation priority** (high/medium/low) so I can focus on critical issues first
7. **View customer information** (orders, contact details, history) so I can provide personalized support
8. **Add internal notes** to conversations so I can share context with teammates
9. **See customer activity timeline** so I understand their journey
10. **Bulk close conversations** so I can clean up resolved issues efficiently

### Manager User Stories

**As a manager, I want to:**

1. **See which agents are handling which conversations** so I can balance workload
2. **View conversation metrics** (response time, resolution time) so I can track performance
3. **Filter conversations by agent** so I can review specific team members' work
4. **See unassigned conversations** so I can ensure nothing falls through the cracks
5. **Track conversation history** so I can ensure quality standards

## Functional Requirements

### 1. Conversation List

#### 1.1 Display Requirements
- Show list of all conversations with key information:
  - Customer name/email
  - Last message preview (first 50 characters)
  - Timestamp of last message
  - Unread message count badge
  - Conversation status indicator
  - Assigned agent avatar/name
  - Priority indicator (if set)
  - Tags (up to 3 visible)
- Default sort: Most recent first
- Pagination: 25 conversations per page
- Infinite scroll support

#### 1.2 Search & Filter
- **Search by**:
  - Customer name
  - Customer email
  - Message content (full-text search)
  - Conversation ID

- **Filter by**:
  - Status: All | Open | Pending | Resolved | Closed
  - Assignment: All | Assigned to me | Unassigned | Assigned to others
  - Priority: All | High | Medium | Low | None
  - Date range: Today | Last 7 days | Last 30 days | Custom range
  - Tags: Multiple tag selection (OR logic)
  - Agent: Specific team member

- **Sort by**:
  - Last message time (newest/oldest)
  - Creation time (newest/oldest)
  - Priority (high to low)
  - Customer name (A-Z)

#### 1.3 Bulk Operations
- Select multiple conversations (checkbox)
- Bulk actions:
  - Assign to agent
  - Change status
  - Add tag
  - Set priority
  - Archive
- Select all on page
- Clear selection

### 2. Conversation View

#### 2.1 Message Thread
- Display all messages in chronological order
- Distinguish between:
  - Customer messages (left-aligned, light blue)
  - Agent messages (right-aligned, gray)
  - System messages (center-aligned, smaller text)
- Show timestamps (relative: "5 minutes ago" / absolute: "Oct 28, 2:30 PM")
- Show agent avatar and name for agent messages
- Support message formatting (line breaks, links)
- Auto-scroll to latest message on load
- Load more history (scroll up to load older messages)

#### 2.2 Message Input
- Multi-line text input
- Send button (or Cmd/Ctrl + Enter)
- Character counter (optional)
- Support for:
  - Plain text
  - URLs (auto-link)
  - Emoji picker (optional Phase 2.2)
- Draft saving (auto-save every 5 seconds)
- Typing indicator to customer (Phase 2.2)

#### 2.3 Conversation Actions
- Quick actions toolbar:
  - Change status dropdown
  - Assign to dropdown (team members)
  - Add tag button
  - Set priority dropdown
  - Add note button
  - More actions (...)
- Status options: Open | Pending | Resolved | Closed
- Status change updates conversation list in real-time

### 3. Customer Information Panel

#### 3.1 Basic Information
- Customer avatar (initials if no photo)
- Full name
- Email address
- Phone number (if available)
- Customer ID
- Account created date
- Last seen timestamp

#### 3.2 Order History
- List of recent orders (last 10)
- For each order show:
  - Order number
  - Date
  - Total amount
  - Status
  - Items count
- Link to view full order details in EverShop
- Total orders count
- Total spent amount

#### 3.3 Conversation History
- Total conversations count
- Average response time
- Last conversation date
- Previous conversation topics (tags)

#### 3.4 Customer Timeline
- Chronological activity feed:
  - Account created
  - Orders placed
  - Conversations initiated
  - Product views (if available)
  - Cart additions (if available)
- Visual timeline with icons
- Expandable details for each event

#### 3.5 Quick Actions
- Send email to customer
- View customer in EverShop admin
- Create order note
- Block customer (admin only)

### 4. Tags & Labels

#### 4.1 Tag Management
- Predefined tags:
  - `urgent` (red)
  - `billing` (orange)
  - `technical` (blue)
  - `shipping` (green)
  - `return` (purple)
  - `complaint` (red-dark)
  - `feedback` (gray)
- Custom tags (agents can create)
- Color-coded for visual distinction
- Tag autocomplete in input

#### 4.2 Tag Operations
- Add multiple tags per conversation
- Remove tags
- Filter conversations by tag
- Tag statistics (admin view)

### 5. Assignment System

#### 5.1 Agent Assignment
- Assign conversation to:
  - Specific agent (dropdown list)
  - Self (quick action)
  - Unassign (remove assignment)
- Auto-assignment rules (optional):
  - Round-robin
  - Least busy agent
  - Based on expertise/tags
- Assignment notification to agent
- Show assignee in conversation list

#### 5.2 Team View
- List all team members
- Show agent status:
  - Online (green)
  - Busy (orange)
  - Away (gray)
  - Offline (red)
- Show active conversations per agent
- Agent capacity indicator

### 6. Internal Notes

#### 6.1 Note Features
- Add private notes to conversations
- Notes visible only to agents (not customers)
- Rich text support:
  - Bold, italic, underline
  - Bullet points
  - Links
- Note author and timestamp
- Edit/delete own notes
- Pin important notes

#### 6.2 Note Display
- Show notes in conversation timeline
- Visual distinction from messages
- Collapsed by default (expand to read)
- Note count indicator

### 7. Conversation Status Management

#### 7.1 Status Workflow
```
New → Open → Pending → Resolved → Closed
     ↓         ↓          ↓
   Closed    Resolved   Closed
```

**Status Definitions:**
- **Open**: Active conversation, awaiting agent response
- **Pending**: Waiting for customer response or external action
- **Resolved**: Issue solved, awaiting confirmation
- **Closed**: Conversation ended, archived

#### 7.2 Status Change Rules
- Auto-close after 7 days of inactivity (configurable)
- Reopen closed conversation on new customer message
- Status change requires confirmation (if not empty input)
- Status change adds system message to thread

### 8. Priority System

#### 8.1 Priority Levels
- **High**: Red flag, critical issues
- **Medium**: Orange flag, standard issues
- **Low**: Yellow flag, minor questions
- **None**: No priority set (default)

#### 8.2 Priority Rules
- Agents can set priority manually
- Auto-priority based on keywords (optional):
  - "urgent", "emergency" → High
  - "question", "help" → Medium
- High priority conversations appear at top of list
- Priority badge visible in conversation list

## Non-Functional Requirements

### Performance
- Conversation list loads in <1 second
- Search results appear in <500ms
- Message send latency <200ms
- Support 1000+ conversations per shop
- Pagination for scalability

### Usability
- Keyboard shortcuts:
  - `/` to focus search
  - `n` for new conversation
  - `j/k` to navigate list
  - `Enter` to open conversation
  - `Esc` to close conversation
- Responsive design (desktop + tablet)
- Consistent with existing admin UI
- Accessible (WCAG 2.1 AA)

### Reliability
- Auto-save drafts every 5 seconds
- Retry failed message sends
- Offline mode (read-only)
- Error messages for failed operations

### Security
- Agents can only see assigned conversations (configurable)
- Managers can see all conversations
- Customer data access logging
- Internal notes encrypted at rest

## Data Model

### Database Schema

#### Table: `conversation_status`
```sql
CREATE TABLE conversation_status (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL, -- open, pending, resolved, closed
  changed_by INTEGER REFERENCES admin_users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  previous_status VARCHAR(20),
  FOREIGN KEY (conversation_id) REFERENCES coze_conversation(id)
);
```

#### Table: `conversation_tags`
```sql
CREATE TABLE conversation_tags (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  tag_name VARCHAR(50) NOT NULL,
  color VARCHAR(20),
  created_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES coze_conversation(id)
);
```

#### Table: `conversation_assignments`
```sql
CREATE TABLE conversation_assignments (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL REFERENCES admin_users(id),
  assigned_by INTEGER REFERENCES admin_users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unassigned_at TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES coze_conversation(id)
);
```

#### Table: `conversation_notes`
```sql
CREATE TABLE conversation_notes (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL REFERENCES admin_users(id),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES coze_conversation(id)
);
```

#### Table: `conversation_priorities`
```sql
CREATE TABLE conversation_priorities (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER NOT NULL UNIQUE,
  priority VARCHAR(10) NOT NULL, -- high, medium, low
  set_by INTEGER REFERENCES admin_users(id),
  set_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES coze_conversation(id)
);
```

## API Specifications

### GET /api/inbox/conversations

List conversations with filters.

**Query Parameters:**
- `status` (string): Filter by status
- `assignee` (number): Filter by agent ID
- `priority` (string): Filter by priority
- `tags` (string): Comma-separated tag names
- `search` (string): Search query
- `dateFrom` (string): Start date (ISO 8601)
- `dateTo` (string): End date (ISO 8601)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 25)
- `sort` (string): Sort field and direction (e.g., "createdAt:desc")

**Response:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "conversations": [
      {
        "id": 123,
        "customerId": 456,
        "customerName": "John Doe",
        "customerEmail": "john@example.com",
        "lastMessage": "When will my order arrive?",
        "lastMessageAt": "2025-10-28T10:30:00Z",
        "status": "open",
        "assignedTo": {
          "id": 1,
          "name": "Agent Smith",
          "avatar": "https://..."
        },
        "priority": "high",
        "tags": ["shipping", "urgent"],
        "unreadCount": 2,
        "createdAt": "2025-10-27T15:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 150,
      "pages": 6
    }
  }
}
```

### PUT /api/inbox/conversations/:id/assign

Assign conversation to agent.

**Request Body:**
```json
{
  "agentId": 1,
  "note": "Assigning to billing specialist"
}
```

**Response:**
```json
{
  "code": 0,
  "msg": "Conversation assigned successfully",
  "data": {
    "conversationId": 123,
    "assignedTo": {
      "id": 1,
      "name": "Agent Smith"
    },
    "assignedAt": "2025-10-28T10:35:00Z"
  }
}
```

### PUT /api/inbox/conversations/:id/status

Update conversation status.

**Request Body:**
```json
{
  "status": "resolved",
  "reason": "Issue solved, awaiting customer confirmation"
}
```

**Response:**
```json
{
  "code": 0,
  "msg": "Status updated successfully",
  "data": {
    "conversationId": 123,
    "status": "resolved",
    "previousStatus": "open",
    "changedAt": "2025-10-28T10:40:00Z"
  }
}
```

### POST /api/inbox/conversations/:id/tags

Add or remove tags.

**Request Body:**
```json
{
  "action": "add",
  "tags": ["billing", "urgent"]
}
```

**Response:**
```json
{
  "code": 0,
  "msg": "Tags updated successfully",
  "data": {
    "conversationId": 123,
    "tags": ["billing", "urgent", "shipping"]
  }
}
```

### POST /api/inbox/conversations/:id/notes

Add internal note.

**Request Body:**
```json
{
  "content": "Customer mentioned they're a premium member. Offering expedited shipping.",
  "isPinned": false
}
```

**Response:**
```json
{
  "code": 0,
  "msg": "Note added successfully",
  "data": {
    "noteId": 789,
    "conversationId": 123,
    "content": "Customer mentioned...",
    "author": {
      "id": 1,
      "name": "Agent Smith"
    },
    "createdAt": "2025-10-28T10:45:00Z",
    "isPinned": false
  }
}
```

### GET /api/inbox/conversations/:id/timeline

Get customer activity timeline.

**Response:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "timeline": [
      {
        "id": 1,
        "type": "account_created",
        "timestamp": "2025-09-01T00:00:00Z",
        "description": "Account created"
      },
      {
        "id": 2,
        "type": "order_placed",
        "timestamp": "2025-09-15T14:30:00Z",
        "description": "Placed order #12345",
        "metadata": {
          "orderId": 12345,
          "amount": 99.99
        }
      },
      {
        "id": 3,
        "type": "conversation_started",
        "timestamp": "2025-10-27T15:00:00Z",
        "description": "Started conversation #123"
      }
    ]
  }
}
```

## UI/UX Specifications

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header: EverShop Chatbot | Inbox | Settings | Analytics     │
├──────────────┬──────────────────────────┬───────────────────┤
│              │                          │                   │
│ Conversation │   Conversation View      │  Customer Panel   │
│    List      │                          │                   │
│              │  [Customer Name]         │  [Avatar]         │
│ Search: ____ │  Status: [Open ▼]        │  John Doe         │
│              │  Assign: [Agent ▼]       │  john@example.com │
│ Filters:     │  Tags: [+ Add]           │                   │
│ [Open▼]      │  Priority: [High ▼]      │  Customer Since   │
│ [All Agents▼]│                          │  2 months ago     │
│              │  ────────────────────     │                   │
│ John Doe     │  Customer: Hi, when...   │  Orders: 5        │
│ 5 min ago    │  10:30 AM                │  Spent: $499      │
│ unread: 2    │                          │                   │
│              │  Agent: Let me check...  │  ─────────────    │
│ Jane Smith   │  10:32 AM                │  Recent Orders    │
│ 1 hour ago   │                          │  #12345 - $99     │
│              │  Customer: Thank you!    │  #12344 - $149    │
│ ...          │  10:35 AM                │                   │
│              │                          │  ─────────────    │
│              │  ────────────────────     │  Timeline         │
│              │  [Type message...]       │  📦 Order placed  │
│              │  [Send]                  │  💬 Chat started  │
│              │                          │  ...              │
└──────────────┴──────────────────────────┴───────────────────┘
```

### Color Scheme

- **Status Colors**:
  - Open: Blue (#1890ff)
  - Pending: Orange (#fa8c16)
  - Resolved: Green (#52c41a)
  - Closed: Gray (#8c8c8c)

- **Priority Colors**:
  - High: Red (#ff4d4f)
  - Medium: Orange (#fa8c16)
  - Low: Yellow (#fadb14)

- **Tag Colors**: Various pastel colors for visual distinction

## Testing Requirements

### Unit Tests
- Conversation list filtering logic
- Tag management functions
- Status transition validation
- Priority calculation

### Integration Tests
- API endpoint responses
- Database operations (CRUD)
- Bulk operations
- Search functionality

### E2E Tests
- Agent assigns conversation
- Agent changes status
- Agent adds tags
- Agent views customer timeline
- Manager filters by agent
- Bulk close conversations

## Success Metrics

- **Performance**: Conversation list loads in <1s
- **Efficiency**: 50% reduction in agent response time
- **Scale**: Support 100+ concurrent conversations
- **Satisfaction**: 90% agent satisfaction with UI
- **Adoption**: 80% of agents use advanced features daily

## Dependencies

- Phase 1 completion (basic inbox page)
- Admin authentication system
- EverShop API integration
- Database migration system

## Future Enhancements (Phase 3)

- Canned responses library
- Conversation templates
- Auto-assignment based on ML
- Sentiment analysis
- Customer satisfaction surveys (CSAT)
- SLA tracking and alerts
- Advanced reporting dashboard
- Conversation export (CSV, PDF)

---

**Document Owner**: Development Team  
**Last Updated**: October 28, 2025  
**Status**: Ready for Implementation


# Phase 2: MVP Implementation Plan

**Strategy**: MVP-First Approach  
**Goal**: Deliver core functionality for each module quickly, then iterate  
**Timeline**: 4-6 weeks for all MVP features

---

## 📋 Requirements Documents Status

✅ **All Created** (5 comprehensive documents, ~17,000 lines total):

1. ✅ `memory/phase2-inbox-requirements.md` (3,900 lines)
2. ✅ `memory/phase2-websocket-requirements.md` (2,800 lines)
3. ✅ `memory/phase2-analytics-requirements.md` (2,400 lines)
4. ✅ `memory/phase2-webhook-requirements.md` (3,100 lines)
5. ✅ `memory/phase2-i18n-requirements.md` (2,600 lines)

---

## 🎯 MVP Core Features Summary

### Module 1: Full Inbox (Week 1-2)

**MVP Scope:**
- ✅ Conversation list with search
- ✅ Basic filters (status, agent, date)
- ✅ Conversation assignment
- ✅ Status management (open/pending/resolved/closed)
- ✅ Tags (5 predefined tags)
- ✅ Customer info panel (name, email, orders)
- ✅ Internal notes

**Skip for MVP:**
- ❌ Advanced filtering (priority, multiple tags)
- ❌ Bulk operations
- ❌ Customer activity timeline
- ❌ Order history details

**Files to Create:**
- Database: 4 new tables
- Backend: 1 route file, ~6 endpoints
- Frontend: 3 React components (basic HTML version for MVP)

---

### Module 2: WebSocket Real-time (Week 2-3)

**MVP Scope:**
- ✅ Real-time message delivery (bidirectional)
- ✅ Typing indicators (customer & agent)
- ✅ Basic presence (online/offline)
- ✅ Auto-reconnection
- ✅ Connection status indicator

**Skip for MVP:**
- ❌ Read receipts
- ❌ Advanced presence (busy, away)
- ❌ Desktop notifications
- ❌ Real-time conversation list updates

**Files to Create:**
- Backend: 1 WebSocket service file
- Frontend: 2 client files (admin + widget)
- Middleware: 1 auth file

**Dependencies:**
```bash
npm install socket.io socket.io-client
```

---

### Module 3: Advanced Analytics (Week 3-4)

**MVP Scope:**
- ✅ Overview metrics (4 key metrics)
- ✅ Conversation volume chart (daily)
- ✅ Response time metrics (avg, median)
- ✅ Agent performance table
- ✅ Date range selector (30 days)

**Skip for MVP:**
- ❌ Peak hours heatmap
- ❌ Geographic distribution
- ❌ Device/browser analytics
- ❌ Export reports
- ❌ Real-time metrics

**Files to Create:**
- Backend: 1 service file, 1 route file, ~4 endpoints
- Frontend: 1 page, 2 chart components (simple HTML/Canvas for MVP)

**Dependencies:**
```bash
npm install recharts date-fns @tanstack/react-query
# OR use Chart.js for simpler MVP
npm install chart.js
```

---

### Module 4: Webhook Integration (Week 4-5)

**MVP Scope:**
- ✅ Product webhooks (create, update, delete)
- ✅ Order webhooks (create, update)
- ✅ Customer webhooks (create)
- ✅ Signature validation
- ✅ Event queue with retries (Bull + Redis)
- ✅ Auto-sync to knowledge base
- ✅ Order status proactive messages

**Skip for MVP:**
- ❌ Webhook management UI
- ❌ Advanced routing rules
- ❌ Webhook replay
- ❌ Analytics dashboard for webhooks

**Files to Create:**
- Backend: 1 route file (3 endpoints), 2 service files, 1 queue file
- Database: 1 new table

**Dependencies:**
```bash
npm install bull ioredis
```

---

### Module 5: Multi-language (Week 5-6)

**MVP Scope:**
- ✅ 3 languages: English, Chinese, Spanish
- ✅ Admin dashboard full translation
- ✅ Widget full translation
- ✅ Language switcher
- ✅ Auto-detect browser language
- ✅ API error localization

**Skip for MVP:**
- ❌ Additional languages (French, German, Japanese, Korean)
- ❌ RTL support
- ❌ Translation management UI
- ❌ Regional formats (date, currency)

**Files to Create:**
- Frontend: 1 config file, 3 translation files (en, zh-CN, es), 1 switcher component
- Backend: 1 i18n service, 1 translation file
- Widget: 1 i18n handler file

**Dependencies:**
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

---

## 🚀 Implementation Order (MVP-First)

### Week 1: Inbox MVP
```
Day 1-2: Database schema + migrations
Day 3-4: Backend API endpoints
Day 5-7: Basic HTML/JS frontend (or start React components)
```

### Week 2: WebSocket MVP
```
Day 1-2: Socket.io server setup
Day 3-4: Admin client integration
Day 5-6: Widget client integration
Day 7: Testing & debugging
```

### Week 3: Analytics MVP
```
Day 1-2: Analytics service + calculations
Day 3-4: API endpoints
Day 5-7: Simple charts (Canvas or Chart.js)
```

### Week 4: Webhook MVP
```
Day 1-2: Webhook receivers + validation
Day 3-4: Bull queue setup + processors
Day 5-6: Knowledge base sync
Day 7: Proactive messaging
```

### Week 5-6: i18n MVP
```
Day 1-2: i18next setup + config
Day 3-4: Translation files (3 languages)
Day 5-6: Language switcher + integration
Day 7: Testing all languages
```

---

## 📦 Dependencies Installation

```bash
# All Phase 2 dependencies
npm install \
  socket.io socket.io-client \
  bull ioredis \
  recharts date-fns \
  i18next react-i18next i18next-browser-languagedetector \
  @tanstack/react-query
```

---

## 🗄️ Database Migrations

### New Tables Summary
```sql
-- Inbox (Module 1)
CREATE TABLE conversation_status (...);
CREATE TABLE conversation_tags (...);
CREATE TABLE conversation_assignments (...);
CREATE TABLE conversation_notes (...);

-- WebSocket (Module 2)
CREATE TABLE user_presence (...);

-- Webhooks (Module 4)
CREATE TABLE webhook_events (...);
```

---

## 🧪 Testing Strategy (MVP)

### Module 1: Inbox
- ✅ Create conversation
- ✅ Assign to agent
- ✅ Change status
- ✅ Add tag
- ✅ Search conversations

### Module 2: WebSocket
- ✅ Connect/disconnect
- ✅ Send message (both directions)
- ✅ Typing indicator
- ✅ Auto-reconnect

### Module 3: Analytics
- ✅ Load overview metrics
- ✅ Generate volume chart
- ✅ Calculate response times
- ✅ Display agent table

### Module 4: Webhooks
- ✅ Receive webhook
- ✅ Validate signature
- ✅ Queue event
- ✅ Process product sync
- ✅ Send proactive message

### Module 5: i18n
- ✅ Switch language (admin)
- ✅ Auto-detect language
- ✅ All UI translated
- ✅ API errors localized

---

## 📊 Success Criteria (MVP)

| Module | Metric | Target |
|--------|--------|--------|
| **Inbox** | Load time | <1s |
| **Inbox** | Conversation capacity | 100+ |
| **WebSocket** | Message latency | <100ms |
| **WebSocket** | Delivery rate | >99% |
| **Analytics** | Dashboard load | <2s |
| **Analytics** | Date range support | 30 days |
| **Webhook** | Processing time | <5s |
| **Webhook** | Success rate | >99% |
| **i18n** | Language coverage | 3 languages |
| **i18n** | Translation coverage | 100% UI |

---

## 🔄 Iteration Plan (Post-MVP)

### After MVP Delivery

**Iteration 1** (Week 7-8):
- Inbox: Add bulk operations
- WebSocket: Add read receipts
- Analytics: Add more charts
- Webhooks: Add management UI
- i18n: Add 2 more languages

**Iteration 2** (Week 9-10):
- Inbox: Customer timeline
- WebSocket: Desktop notifications
- Analytics: Export reports
- Webhooks: Advanced routing
- i18n: RTL support

---

## 💡 Quick Start Guide

### For Each Module:

1. **Read Requirements**: Review the requirements doc in `memory/`
2. **Check Dependencies**: Install required npm packages
3. **Create Database**: Run migrations for new tables
4. **Build Backend**: Implement service + routes
5. **Build Frontend**: Create basic UI (HTML first, then enhance)
6. **Test**: Run manual tests
7. **Document**: Update API docs

### Example: Starting Inbox MVP

```bash
# 1. Read requirements
cat memory/phase2-inbox-requirements.md

# 2. Create migration
npx prisma migrate dev --name add_conversation_management

# 3. Create backend files
touch src/routes/inbox-management.routes.ts
touch src/services/inbox-management.service.ts

# 4. Start coding (refer to requirements doc for API specs)

# 5. Test
curl http://localhost:3000/api/inbox/conversations
```

---

## 📝 Next Steps

**Ready to implement?** Choose your starting point:

**Option A - Sequential**: Start with Module 1 (Inbox), complete MVP, move to Module 2
**Option B - Parallel**: Split into 2 tracks (Backend dev + Frontend dev)
**Option C - Feature-based**: Pick highest-value features from each module

**Recommended**: Start with **Module 2 (WebSocket)** as it's foundational for real-time features and can be tested immediately with existing chat.

---

## ✅ Implementation Checklist

- [ ] Install all dependencies
- [ ] Create database migrations
- [ ] Implement Module 1: Inbox MVP
- [ ] Implement Module 2: WebSocket MVP
- [ ] Implement Module 3: Analytics MVP
- [ ] Implement Module 4: Webhook MVP
- [ ] Implement Module 5: i18n MVP
- [ ] Integration testing
- [ ] Performance testing
- [ ] Documentation updates
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production

---

**Status**: 📋 **Planning Complete** → Ready for Implementation!  
**Estimated Time**: 4-6 weeks for all MVP features  
**Team Size**: 1-2 developers (full-stack)

🚀 **Let's build this!**


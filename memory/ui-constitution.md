# Chatbot UI Constitution

## Project Identity
**Name**: EverShop Chatbot UI  
**Purpose**: Provide customer service automation for EverShop e-commerce stores through AI-powered chat  
**Architecture**: Customer widget + Merchant admin dashboard + EverShop integration

## Core Principles

### 1. Customer-First Experience
- **Simplicity**: Widget loads instantly, minimal UI clutter
- **Accessibility**: Works on all devices and screen sizes
- **Privacy**: Clear data handling, secure communications
- **Reliability**: Graceful degradation, offline capability

### 2. Merchant Empowerment
- **Clarity**: Easy-to-understand interface, no technical jargon
- **Efficiency**: Quick access to conversations, batch operations
- **Insights**: Actionable analytics, performance metrics
- **Control**: Full customization, data ownership

### 3. Technical Excellence
- **Performance**: Fast load times, smooth interactions
- **Security**: Industry-standard authentication, data encryption
- **Scalability**: Handle growth without degradation
- **Maintainability**: Clean code, comprehensive documentation

## Design Philosophy

### Visual Design
- **Minimalism**: Only essential UI elements
- **Consistency**: Uniform spacing, typography, colors
- **Feedback**: Clear visual states (hover, active, loading, error)
- **Hierarchy**: Important actions stand out

### Interaction Design
- **Predictability**: Standard patterns, no surprises
- **Forgiveness**: Undo/cancel options, confirm destructive actions
- **Efficiency**: Keyboard shortcuts, quick actions
- **Guidance**: Contextual help, tooltips, empty states

### Information Architecture
- **Logical**: Group related features
- **Findable**: Clear navigation, search functionality
- **Scannable**: Headings, whitespace, visual hierarchy
- **Actionable**: CTAs near relevant information

## Component Specifications

### Customer Widget
**Purpose**: Enable customers to get instant AI-powered support

**Core Behaviors**:
- Loads asynchronously without blocking page render
- Maintains state across page navigation
- Respects user's color scheme preference
- Minimizes DOM footprint

**Quality Standards**:
- Bundle size < 50KB gzipped
- First interaction < 100ms
- Works without JavaScript (graceful degradation)
- WCAG 2.1 AA compliant

### Admin Dashboard
**Purpose**: Enable merchants to manage conversations and configure bot

**Core Behaviors**:
- Real-time updates without page refresh
- Optimistic UI updates for instant feedback
- Background sync for data consistency
- Session persistence across browser restarts

**Quality Standards**:
- Initial load < 2s on 3G
- Time to interactive < 3s
- 60fps scrolling and animations
- Works offline (read-only mode)

## Integration Standards

### EverShop API
**Connection**: RESTful HTTP/HTTPS
**Authentication**: JWT or API key
**Data Format**: JSON
**Error Handling**: Graceful fallback, retry logic
**Rate Limiting**: Respect limits, queue requests

### Coze API
**Connection**: HTTPS with JWT OAuth
**Real-time**: Server-Sent Events for chat streaming
**Knowledge Sync**: Batch updates, incremental sync
**Error Handling**: Fallback responses, log failures

## Data Management

### Storage Strategy
- **LocalStorage**: Session IDs, widget preferences
- **SessionStorage**: Temporary chat state
- **IndexedDB**: Offline message queue (future)
- **Backend**: Persistent conversation history

### Privacy & Compliance
- **GDPR**: User consent, data export, right to delete
- **CCPA**: Do not sell, disclosure requirements
- **Data Retention**: Configurable retention periods
- **Encryption**: TLS in transit, optional at-rest

## Development Workflow

### Code Organization
```
chatbot-node/
├── public/
│   ├── widget/           # Customer-facing widget
│   │   ├── chatbot-widget.js
│   │   ├── chatbot-widget.css
│   │   └── chatbot-iframe.html
│   └── admin/            # Merchant dashboard
│       ├── index.html
│       ├── assets/
│       └── src/
│           ├── components/
│           ├── pages/
│           ├── services/
│           └── utils/
├── src/
│   ├── routes/
│   │   └── evershop.routes.ts
│   ├── services/
│   │   └── evershop-api.service.ts
│   └── middleware/
│       └── customer-auth.ts
```

### Build Process
1. **Widget**: Bundle with rollup/esbuild, minify, version hash
2. **Admin**: Vite build, code split, optimize assets
3. **Backend**: TypeScript compile, copy static assets
4. **Deploy**: Docker image, multi-stage build

### Testing Strategy
- **Unit**: Jest for business logic
- **Integration**: API endpoint tests
- **E2E**: Playwright for critical flows
- **Performance**: Lighthouse CI
- **Accessibility**: axe-core automated checks

## API Contracts

### Customer Widget API
```typescript
// Initialize widget
window.ChatbotWidget.init({
  apiUrl: string;
  botId: string;
  shopId: string;
  customerId?: string;
  position?: 'bottom-right' | 'bottom-left';
  theme?: { primaryColor: string; };
});

// Programmatic control
window.ChatbotWidget.open();
window.ChatbotWidget.close();
window.ChatbotWidget.toggle();
window.ChatbotWidget.sendMessage(text: string);

// Events
window.ChatbotWidget.on('open', callback);
window.ChatbotWidget.on('close', callback);
window.ChatbotWidget.on('message', callback);
```

### Admin Dashboard Routes
```
/admin                    → Login page (if not authenticated)
/admin/inbox              → Conversation management
/admin/settings           → Bot configuration
/admin/assistant          → EverShop data sync
/admin/analytics          → Statistics & reports
```

## Success Metrics

### Customer Widget
- **Engagement**: Chat initiation rate > 5%
- **Satisfaction**: CSAT score > 4.0/5.0
- **Performance**: Page speed impact < 100ms
- **Reliability**: Uptime > 99.9%

### Admin Dashboard
- **Efficiency**: Time to first response < 30s
- **Productivity**: Conversations per hour > 10
- **Adoption**: Daily active merchants > 80%
- **Performance**: Load time < 2s

### EverShop Integration
- **Sync Success**: > 99% of syncs complete
- **Data Accuracy**: 100% match with EverShop
- **Sync Speed**: < 5min for 1000 products
- **API Reliability**: Error rate < 0.1%

## Evolution Guidelines

### Adding Features
1. Validate need with user research or data
2. Design with existing patterns first
3. Prototype and test with real users
4. Implement with feature flags
5. Monitor metrics post-launch
6. Iterate based on feedback

### Deprecating Features
1. Announce deprecation 90 days in advance
2. Provide migration guide or alternative
3. Monitor usage to confirm low adoption
4. Remove code, update documentation
5. Communicate completion

### Technical Debt
- **Tracking**: GitHub issues with "tech-debt" label
- **Prioritization**: Impact vs. effort matrix
- **Allocation**: 20% of sprint capacity
- **Review**: Quarterly debt assessment

## Documentation Requirements

### Code Documentation
- **Comments**: Why, not what (code should be self-explanatory)
- **JSDoc**: All public functions and types
- **README**: Each major directory
- **CHANGELOG**: All notable changes

### User Documentation
- **Widget**: Embed guide, customization options
- **Admin**: User manual, video tutorials
- **API**: OpenAPI spec, Postman collection
- **Integration**: EverShop setup guide

## Support & Maintenance

### Error Monitoring
- **Tools**: Sentry or similar for error tracking
- **Alerts**: Slack/email for critical errors
- **Response**: Acknowledge < 1h, fix < 24h (P0)

### Performance Monitoring
- **Tools**: Lighthouse CI, Web Vitals
- **Metrics**: LCP, FID, CLS, TTFB
- **Targets**: All "Good" thresholds

### Security
- **Updates**: Dependencies reviewed monthly
- **Scanning**: Automated vulnerability scanning
- **Audits**: Annual third-party security audit
- **Response**: Patch critical vulnerabilities < 24h

---

**Last Updated**: 2025-10-28  
**Version**: 1.0.0  
**Owner**: Development Team


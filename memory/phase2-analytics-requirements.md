# Phase 2.3: Advanced Analytics Dashboard Requirements

**Version**: 2.0  
**Date**: October 28, 2025  
**Status**: Planning

---

## Overview

Build a comprehensive analytics dashboard to provide insights into chatbot performance, customer satisfaction, agent productivity, and conversation trends.

## Business Goals

1. **Data-Driven Decisions**: Enable managers to optimize support operations
2. **Performance Tracking**: Monitor response times and resolution rates
3. **Customer Insights**: Understand customer behavior and satisfaction
4. **Agent Optimization**: Track and improve agent performance

## MVP Core Metrics

### 1. Overview Dashboard
- Total conversations (today, this week, this month)
- Active conversations count
- Average response time
- Resolution rate
- Customer satisfaction score (CSAT)

### 2. Conversation Volume
- Line chart: Conversations over time (daily)
- Comparison with previous period

### 3. Response Time Analysis
- Average first response time
- Average resolution time
- Distribution chart (histogram)

### 4. Agent Performance
- Table view: Agent name, conversations handled, avg response time
- Sort by different metrics

## Analytics Data Structure

### Core Metrics Calculation

```typescript
interface AnalyticsOverview {
  period: { start: Date; end: Date };
  totalConversations: number;
  activeConversations: number;
  resolvedConversations: number;
  avgResponseTime: number; // seconds
  avgResolutionTime: number; // seconds
  csatScore: number; // 1-5 scale
}

interface ConversationVolume {
  date: string;
  count: number;
  comparison?: {
    previousCount: number;
    percentChange: number;
  };
}

interface ResponseTimeMetrics {
  avg: number;
  median: number;
  p95: number;
  p99: number;
  distribution: Array<{ range: string; count: number }>;
}

interface AgentPerformance {
  agentId: number;
  agentName: string;
  conversationsHandled: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  csatScore: number;
}
```

## MVP Implementation

### Backend Service

**File**: `src/services/analytics.service.ts`

```typescript
class AnalyticsService {
  // Overview metrics
  async getOverview(startDate: Date, endDate: Date): Promise<AnalyticsOverview>
  
  // Conversation volume
  async getConversationVolume(
    startDate: Date, 
    endDate: Date, 
    granularity: 'hour' | 'day' | 'week'
  ): Promise<ConversationVolume[]>
  
  // Response time analysis
  async getResponseTimeMetrics(
    startDate: Date, 
    endDate: Date
  ): Promise<ResponseTimeMetrics>
  
  // Agent performance
  async getAgentPerformance(
    startDate: Date, 
    endDate: Date
  ): Promise<AgentPerformance[]>
  
  // Helper methods
  private calculateResponseTime(conversation): number
  private calculateResolutionTime(conversation): number
  private calculatePercentiles(values: number[]): { p95: number; p99: number }
}
```

### API Endpoints

**File**: `src/routes/analytics.routes.ts`

```typescript
// GET /api/analytics/overview
// Query: startDate, endDate
router.get('/overview', async (req, res) => {
  const { startDate, endDate } = req.query;
  const data = await analyticsService.getOverview(
    new Date(startDate),
    new Date(endDate)
  );
  res.json({ code: 0, data });
});

// GET /api/analytics/conversations/volume
// Query: startDate, endDate, granularity
router.get('/conversations/volume', async (req, res) => {
  const { startDate, endDate, granularity } = req.query;
  const data = await analyticsService.getConversationVolume(
    new Date(startDate),
    new Date(endDate),
    granularity || 'day'
  );
  res.json({ code: 0, data });
});

// GET /api/analytics/conversations/response-time
router.get('/conversations/response-time', async (req, res) => {
  const { startDate, endDate } = req.query;
  const data = await analyticsService.getResponseTimeMetrics(
    new Date(startDate),
    new Date(endDate)
  );
  res.json({ code: 0, data });
});

// GET /api/analytics/agents/performance
router.get('/agents/performance', async (req, res) => {
  const { startDate, endDate } = req.query;
  const data = await analyticsService.getAgentPerformance(
    new Date(startDate),
    new Date(endDate)
  );
  res.json({ code: 0, data });
});
```

### Database Queries (SQL Examples)

**Overview Metrics**:
```sql
-- Total conversations
SELECT COUNT(*) FROM coze_conversation 
WHERE created_at BETWEEN $1 AND $2;

-- Average response time (first agent reply)
SELECT AVG(
  EXTRACT(EPOCH FROM (
    first_reply.created_at - conv.created_at
  ))
) as avg_response_time
FROM coze_conversation conv
JOIN coze_chat_history first_reply 
  ON first_reply.conversation_id = conv.id 
  AND first_reply.role = 'assistant'
WHERE conv.created_at BETWEEN $1 AND $2;

-- Resolution rate
SELECT 
  COUNT(CASE WHEN status = 'resolved' THEN 1 END)::float / 
  COUNT(*)::float * 100 as resolution_rate
FROM conversation_status
WHERE changed_at BETWEEN $1 AND $2;
```

**Conversation Volume**:
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as count
FROM coze_conversation
WHERE created_at BETWEEN $1 AND $2
GROUP BY DATE(created_at)
ORDER BY date;
```

**Agent Performance**:
```sql
SELECT 
  a.id as agent_id,
  a.name as agent_name,
  COUNT(DISTINCT ca.conversation_id) as conversations_handled,
  AVG(response_time) as avg_response_time
FROM admin_users a
JOIN conversation_assignments ca ON ca.agent_id = a.id
LEFT JOIN (
  SELECT conversation_id, 
    AVG(EXTRACT(EPOCH FROM (reply_time - message_time))) as response_time
  FROM message_response_times
  GROUP BY conversation_id
) rt ON rt.conversation_id = ca.conversation_id
WHERE ca.assigned_at BETWEEN $1 AND $2
GROUP BY a.id, a.name
ORDER BY conversations_handled DESC;
```

## Frontend Implementation

### Analytics Page Component

**File**: `public/admin/src/pages/Analytics.tsx`

```typescript
function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: new Date()
  });
  
  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview', dateRange],
    queryFn: () => fetchAnalyticsOverview(dateRange)
  });
  
  const { data: volume } = useQuery({
    queryKey: ['analytics', 'volume', dateRange],
    queryFn: () => fetchConversationVolume(dateRange)
  });
  
  return (
    <div className="analytics-page">
      <DateRangePicker value={dateRange} onChange={setDateRange} />
      
      <MetricsCards overview={overview} />
      
      <ConversationVolumeChart data={volume} />
      
      <ResponseTimeMetrics dateRange={dateRange} />
      
      <AgentPerformanceTable dateRange={dateRange} />
    </div>
  );
}
```

### Metrics Cards Component

```typescript
function MetricsCards({ overview }: { overview: AnalyticsOverview }) {
  const metrics = [
    {
      title: 'Total Conversations',
      value: overview.totalConversations,
      icon: '💬',
      trend: '+12%'
    },
    {
      title: 'Avg Response Time',
      value: formatDuration(overview.avgResponseTime),
      icon: '⚡',
      trend: '-5%'
    },
    {
      title: 'Resolution Rate',
      value: `${overview.resolutionRate}%`,
      icon: '✅',
      trend: '+3%'
    },
    {
      title: 'CSAT Score',
      value: overview.csatScore.toFixed(1),
      icon: '⭐',
      trend: '+0.2'
    }
  ];
  
  return (
    <div className="metrics-grid">
      {metrics.map(metric => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </div>
  );
}
```

### Volume Chart Component (using Recharts)

**File**: `public/admin/src/components/charts/ConversationVolumeChart.tsx`

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function ConversationVolumeChart({ data }: { data: ConversationVolume[] }) {
  return (
    <div className="chart-container">
      <h3>Conversation Volume</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#ff0000" 
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Agent Performance Table

```typescript
function AgentPerformanceTable({ dateRange }: { dateRange: DateRange }) {
  const { data: agents } = useQuery({
    queryKey: ['analytics', 'agents', dateRange],
    queryFn: () => fetchAgentPerformance(dateRange)
  });
  
  return (
    <div className="agent-performance">
      <h3>Agent Performance</h3>
      <table>
        <thead>
          <tr>
            <th>Agent</th>
            <th>Conversations</th>
            <th>Avg Response Time</th>
            <th>Avg Resolution Time</th>
            <th>CSAT</th>
          </tr>
        </thead>
        <tbody>
          {agents?.map(agent => (
            <tr key={agent.agentId}>
              <td>{agent.agentName}</td>
              <td>{agent.conversationsHandled}</td>
              <td>{formatDuration(agent.avgResponseTime)}</td>
              <td>{formatDuration(agent.avgResolutionTime)}</td>
              <td>{agent.csatScore.toFixed(1)} ⭐</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Caching Strategy

### Redis Cache
```typescript
// Cache overview for 5 minutes
const cacheKey = `analytics:overview:${startDate}:${endDate}`;
const cached = await redis.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

const data = await calculateOverview(startDate, endDate);
await redis.setex(cacheKey, 300, JSON.stringify(data));
return data;
```

## MVP Scope

**Included**:
- ✅ Overview metrics (4 key metrics)
- ✅ Conversation volume chart
- ✅ Response time metrics
- ✅ Agent performance table
- ✅ Date range selector
- ✅ Basic caching

**Not Included** (Future):
- ❌ Peak hours heatmap
- ❌ Geographic distribution
- ❌ Device/browser analytics
- ❌ Customer satisfaction surveys
- ❌ Popular topics/keywords
- ❌ Conversion tracking
- ❌ Export to CSV/PDF
- ❌ Custom dashboard widgets
- ❌ Real-time metrics

## Dependencies

```json
{
  "recharts": "^2.10.0",
  "date-fns": "^2.30.0",
  "@tanstack/react-query": "^5.0.0"
}
```

## Success Metrics (MVP)

- Dashboard loads in <2 seconds
- Charts render in <500ms
- Support 90-day date range
- Accurate metrics (verified against source data)
- Responsive on desktop and tablet

---

**Document Owner**: Development Team  
**Last Updated**: October 28, 2025  
**Status**: Ready for MVP Implementation


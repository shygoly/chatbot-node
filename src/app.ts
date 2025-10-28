import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import { requestLogger } from './middleware/request-logger';
import { errorHandler } from './middleware/error-handler';

// Import routes
import authRoutes from './routes/auth.routes';
import cozeApiRoutes from './routes/coze-api.routes';
import cozeOAuthRoutes from './routes/coze-oauth.routes';
import botSettingsRoutes from './routes/bot-settings.routes';
import chatHistoryRoutes from './routes/chat-history.routes';
import cozeInfoRoutes from './routes/coze-info.routes';
import inquiriesRoutes from './routes/inquiries.routes';
import inboxUsersRoutes from './routes/inbox-users.routes';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected',
    mode: 'backend',
  });
});

// API routes
app.use('/api/auth', authRoutes); // Authentication routes (no auth required)
app.use('/api/coze', cozeApiRoutes);
app.use('/api/coze/oauth', cozeOAuthRoutes);
app.use('/api/bot-settings', botSettingsRoutes);
app.use('/api/chat-history', chatHistoryRoutes);
app.use('/api/coze-info', cozeInfoRoutes);
app.use('/api/inquiries', inquiriesRoutes);
app.use('/api/inbox-users', inboxUsersRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    statusCode: 404,
    timestamp: new Date().toISOString(),
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;


import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
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
import evershopRoutes from './routes/evershop.routes';
import webhooksRoutes from './routes/webhooks.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();

// Security middleware - Configure helmet to allow serving embedded content
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.socket.io',
          'https://cdn.jsdelivr.net',
        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          'ws://localhost:3000',
          'wss://localhost:3000',
          'ws://127.0.0.1:3000',
          'wss://127.0.0.1:3000',
        ],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

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

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve widget files with proper MIME types
app.use('/widget', express.static(path.join(__dirname, '../public/widget'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  },
}));

// Serve admin dashboard
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

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
app.use('/api/evershop', evershopRoutes); // EverShop integration routes
app.use('/api/webhooks', webhooksRoutes); // Webhook receivers
app.use('/api/analytics', analyticsRoutes); // Analytics endpoints

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


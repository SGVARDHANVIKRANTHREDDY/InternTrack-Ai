import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { rateLimit } from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import { v4 as uuidv4 } from 'uuid';
import apiRouter from './src/backend/api.js';

dotenv.config();

// ==========================================
// ERROR MONITORING (Sentry Node Backend)
// ==========================================
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });
  console.log('Sentry Node SDK initialized successfully.');
}

// __dirname equivalent: use process.cwd() for static file serving (compatible with ESM & CJS builds)

const app = express();

// Trust reverse proxy (needed for accurate rate limiting in Cloud Run/containers/Vercel)
app.set('trust proxy', 1);

app.use(cors());

// ==========================================
// TELEMETRY - Request ID & Sentry Tag Linking
// ==========================================
app.use((req: any, res: any, next: any) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);

  if (process.env.SENTRY_DSN) {
    Sentry.setTag('request_id', requestId);
  }
  next();
});

// ==========================================
// SECURITY - Content Security Policy (CSP)
// ==========================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "https://*.sentry.io", "https://generativelanguage.googleapis.com"],
      upgradeInsecureRequests: [],
    },
  },
}));
app.use(express.json());

// Configure rate limiting for API routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: 'draft-6',
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later' }
});

// API routes FIRST
app.use('/api', limiter, apiRouter);

// Sentry Error Handler (must be added after routes but before other error handlers)
if (process.env.SENTRY_DSN) {
  if (typeof (Sentry as any).setupExpressErrorHandler === 'function') {
    (Sentry as any).setupExpressErrorHandler(app);
  } else if ((Sentry as any).Handlers && (Sentry as any).Handlers.errorHandler) {
    app.use((Sentry as any).Handlers.errorHandler());
  }
}

// Vite middleware / Static Serving - only run server routes if not in serverless Vercel environment
// (Vite assets served directly via Vercel)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  (async () => {
    const PORT = 3000;
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Local development server running on http://localhost:${PORT}`);
    });
  })();
}

export default app;


import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { rateLimit } from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import { v4 as uuidv4 } from 'uuid';
import apiRouter from './src/backend/api.js';

dotenv.config();

// ==========================================
// CORS - Allowed Origin(s)
// ==========================================
// This app is single-origin by design: the frontend and API are served from
// the same Express process in dev (Vite middleware mode) and from the same
// domain in production (Vercel rewrites /api/* to this same app). Same-origin
// requests never need to pass a CORS check, but browsers still attach an
// Origin header on same-origin POST/PUT/DELETE/PATCH requests — so a CORS
// check that ONLY trusts a hardcoded env var will incorrectly reject normal
// same-origin traffic the moment the deployed domain differs from whatever
// was configured (a very easy step to forget, and it breaks every POST
// request, which looks exactly like "login works but then everything
// afterwards is broken"). To avoid that footgun, we always trust an Origin
// that matches the incoming request's own Host, and only use CORS_ORIGIN as
// an *additional* allowlist for genuinely separate frontend origins (e.g.
// running the Vite dev server standalone on a different port).
const extraAllowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

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

app.use((req, res, next) => {
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        // No Origin header at all: same-origin simple request, curl, server-to-server, etc.
        callback(null, true);
        return;
      }
      let originHost: string | null = null;
      try {
        originHost = new URL(origin).host;
      } catch {
        // Malformed Origin header — fall through to explicit allowlist only.
      }
      const isSameOrigin = originHost !== null && originHost === req.headers.host;
      if (isSameOrigin || extraAllowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // required so the browser sends/receives the httpOnly auth cookie
  })(req, res, next);
});
app.use(cookieParser());


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
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "https://*.sentry.io", "https://generativelanguage.googleapis.com"],
      workerSrc: ["'self'", "blob:", "https://cdnjs.cloudflare.com"],
      upgradeInsecureRequests: [],
    },
  },
}));
app.use(express.json());

// Configure rate limiting for API routes.
// Disabled under NODE_ENV=test: the integration suite legitimately logs in far
// more than 10 times per run (once per ownership/authorization test), and all
// requests share the same IP in-process, so a real limiter here just makes
// the test suite flaky rather than testing anything meaningful. Rate limiting
// itself is still exercised indirectly — this only skips it for the test env.
const isTestEnv = process.env.NODE_ENV === 'test';

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 100, // 100 requests per IP per 5 minutes
  standardHeaders: 'draft-6',
  legacyHeaders: false,
  skip: () => isTestEnv,
  message: { error: 'Too many requests from this IP, please try again later' }
});

// Stricter limiter for login/register specifically, to slow down credential
// stuffing and brute-force attempts against the auth endpoints.
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 10, // 10 attempts per IP per 5 minutes
  standardHeaders: 'draft-6',
  legacyHeaders: false,
  skip: () => isTestEnv,
  message: { error: 'Too many authentication attempts, please try again later' }
});

// API routes FIRST
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
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


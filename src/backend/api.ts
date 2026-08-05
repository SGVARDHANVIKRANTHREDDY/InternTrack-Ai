import { Router } from 'express';
import openApiSpec from '../../openapi.json';

// Import sub-routers
import authRouter from './routes/auth.js';
import companiesRouter from './routes/companies.js';
import applicationsRouter from './routes/applications.js';
import resumesRouter from './routes/resumes.js';
import notificationsRouter from './routes/notifications.js';
import analyticsRouter from './routes/analytics.js';
import activityRouter from './routes/activity.js';

const router = Router();

// ==========================================
// MONITORING & DIAGNOSTICS
// ==========================================

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ==========================================
// SUB-ROUTERS ROUTING
// ==========================================

router.use('/auth', authRouter);
router.use('/companies', companiesRouter);
router.use('/resumes', resumesRouter);
router.use('/notifications', notificationsRouter);
router.use('/activity', activityRouter);

// Root-mounted routers (they define specific subpaths e.g. /applications, /notes, /interview-prep)
router.use('/', applicationsRouter);
router.use('/', analyticsRouter);

// ==========================================
// API DOCUMENTATION (Swagger UI CDN)
// ==========================================

router.get('/docs/spec', (req, res) => {
  res.json(openApiSpec);
});

router.get('/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>API Docs - InternTrack AI</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
      <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" charset="UTF-8"></script>
      <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/api/docs/spec',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "BaseLayout"
          });
        };
      </script>
    </body>
    </html>
  `);
});

export default router;

# InternTrack AI

> A full-stack internship and job application intelligence platform — built for students who take their career seriously.

InternTrack AI is a production-grade web application that replaces scattered spreadsheets with a unified workspace for tracking applications, managing resumes, preparing for interviews, and gaining AI-powered career insights. Every feature is purpose-built for the modern internship hunt.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [AI Integration](#ai-integration)
- [Security](#security)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Known Limitations & Roadmap](#known-limitations--roadmap)

---

## Features

### Application Pipeline Management
Track every job application through its full lifecycle. Each application stores the company, role, application date, deadline, priority, source platform (LinkedIn, Internshala, Wellfound, Referral, etc.), salary range, recruiter contact, and linked resume version. Status transitions are logged automatically in the activity timeline.

### Kanban Board
A drag-and-drop board powered by `@dnd-kit` with eight pipeline stages: Wishlist → Applied → OA Scheduled → OA Completed → Interview Scheduled → Interview Completed → Offer Received → Rejected. Dragging a card to a new column instantly updates its status via an optimistic mutation.

### AI Resume Assistant (Gemini)
Upload PDF, DOCX, or TXT resume files (up to 10MB). The AI analyzes the resume against a target role and returns an ATS compatibility score (0–100), a ranked list of strengths, identified weaknesses, missing keywords, recommended skills, formatting issues, and a two-sentence executive summary. Every analysis is stored in a full audit history so you can track improvement across versions.

### Resume Version Control
Maintain multiple named resume versions, each with its own version number, target role, ATS score, and performance stats (interview rate, offer rate) derived from the applications it was used for. Supports duplicate, rename, archive, and side-by-side comparison of any two versions.

### AI Interview Preparation Hub
For any application, generate a complete interview preparation pack: relevant DSA topic list, role-specific technical Q&A, HR behavioral questions with model answer strategies, resume-specific questions, and a company research brief (overview, key products, recent news, interview culture tips). Preparation packs are saved and editable.

### AI Resume Tailoring
Paste a job description and let the AI produce a tailored match analysis: ATS score for that specific JD, missing keywords, recommended skills to add, concrete bullet-point rewrites for your experience section, and a list of projects to highlight and why.

### AI Career Insights
After logging several applications, the AI analyzes your entire pipeline and surfaces: your most successful industry, your best-performing application source, your most common rejection stage, your highest-converting funnel segment, your weakest funnel stage, and three to five personalized action recommendations.

### Smart Notification Center
Automatic notifications are generated server-side on every fetch: missing resume alerts, deadline warnings at 7 days / 3 days / same day, follow-up due reminders, and interview-tomorrow alerts. Notifications support read/unread state with bulk mark-all-read.

### Analytics Dashboard
Recharts-powered charts for application status breakdown, source performance (count, interview rate, offer rate per source), industry performance, monthly application trend (area chart), resume performance comparison, and recruiter follow-up success rate.

### Activity Timeline
A chronological audit log of every user action — application created, status changed, resume uploaded, follow-up sent, AI analysis run — with full-text search, category filters, date range filtering, and sort controls.

### Follow-Up Tracker
Log when a follow-up was sent, the scheduled next follow-up date, and whether the recruiter replied. The dashboard surfaces follow-ups due today and this week. Status cycles through WAITING → FOLLOWED_UP → REPLIED.

### Companies CRM
Maintain a company directory with logo, website, industry, location, and notes. Each company links to its applications, giving a per-company pipeline view.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + Vite 6 |
| Styling | Tailwind CSS v4 |
| Component Library | shadcn/ui (Base UI primitives) |
| State / Data Fetching | TanStack React Query v5 |
| Routing | React Router v7 |
| Drag and Drop | @dnd-kit/core + @dnd-kit/sortable |
| Charts | Recharts v3 |
| Forms | React Hook Form + Zod v4 |
| Animation | Motion (Framer Motion successor) |
| Backend Runtime | Node.js + Express 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL (Neon / Supabase / Railway / local Docker) |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| AI Provider | Google Gemini (via @google/genai SDK) |
| Security | Helmet (CSP enabled), express-rate-limit, CORS |
| Error Monitoring | Sentry (Node backend + React frontend) |
| Logging | Structured logger with ISO-8601 timestamps + Request ID |
| API Docs | OpenAPI 3.0 + Swagger UI (`/api/docs`) |
| Testing | Vitest + Supertest (integration tests) |
| Build | esbuild (server, ESM) + Vite (client) |
| CI/CD | GitHub Actions |
| Deployment | Vercel Serverless |
| Language | TypeScript (full-stack) |

---

## Architecture

InternTrack AI is deployed as a **Vercel Serverless** application. API traffic is routed to an Express handler compiled as a serverless function (`api/index.ts`). The React SPA is served as static assets from `dist/`. In local development, the full Express server runs with Vite HMR middleware attached.

```
Browser
  │
  ├── /api/*  ──► Vercel Serverless Function (api/index.ts)
  │                   │
  │                   ▼
  │             Express App (server.ts)
  │               ├── Request ID Middleware  (generates UUID, sets X-Request-ID header)
  │               ├── Sentry Tag Middleware  (tags request_id on every Sentry event)
  │               ├── CSP / Helmet
  │               ├── Rate Limiter (100 req / 15 min / IP)
  │               └── API Router (src/backend/api.ts)
  │                     ├── routes/auth.ts
  │                     ├── routes/companies.ts
  │                     ├── routes/applications.ts
  │                     ├── routes/resumes.ts
  │                     ├── routes/notifications.ts
  │                     ├── routes/analytics.ts
  │                     ├── routes/activity.ts
  │                     └── routes/health.ts
  │
  └── /*      ──► Vercel Static CDN (dist/index.html + assets)
```

The frontend uses a single `apiRequest` utility that attaches the Bearer token from localStorage to every request. `AuthContext` holds the authenticated user and exposes `login` / `logout`. All server data is managed through React Query with per-resource query keys, ensuring cache invalidation is scoped and predictable.

Every response carries an `X-Request-ID` header (UUID). This ID is logged by the structured logger and tagged on Sentry events, making it trivial to trace any request across logs and error reports.

---

## Database Schema

The Prisma schema defines 10 models with `@@index([userId])` annotations on all user-scoped models for optimized per-user query performance.

**User** — Core profile including college, graduation year, LinkedIn, GitHub, and resume link.

**Company** — Company directory with industry, location, logo URL, and website. Each company belongs to one user.

**Application** — The central entity. Tracks role, status (8 stages), priority, source platform, deadline, salary, recruiter contact, follow-up state (sent date, next date, reply status), and links to both a Company and a ResumeVersion.

**InterviewNote** — Per-application interview rounds with date, round name, notes, feedback, and outcome.

**ResumeVersion** — A named, versioned resume file (stored as text content or URL) with full AI analysis fields (ATS score, strengths, weaknesses, missing keywords, recommended skills, formatting issues, suggestions, AI summary).

**AiAnalysisHistory** — Immutable audit record of every AI analysis run against a resume version.

**InterviewPreparation** — Persisted AI-generated interview prep pack per application (DSA topics, technical Q&A, HR questions, resume questions, company research).

**ResumeTailoringAnalysis** — Persisted AI tailoring result per application (ATS score, missing keywords, suggested rewrites, projects to highlight).

**ActivityLog** — Append-only event log with entity type, entity ID, and JSON metadata.

**Notification** — User notifications with type (DEADLINE, FOLLOWUP, INTERVIEW, SYSTEM), read state, and deep link.

**AiInsight** — Persisted AI career analysis (top industry, top source, weakest funnel stage, recommendations).

All relationships use `onDelete: Cascade` where appropriate so deleting a user or application cleans up all child records automatically.

---

## API Reference

All routes under `/api` are rate-limited to 100 requests per 15 minutes per IP. All routes except `/auth/register`, `/auth/login`, `/health`, and `/docs` require an `Authorization: Bearer <token>` header.

> **Interactive docs**: Start the dev server and visit `http://localhost:3000/api/docs` for a live Swagger UI where you can try every endpoint directly in the browser.

### System
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Returns `{ status, timestamp, version }` — useful for uptime monitoring |

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create account |
| POST | `/api/auth/login` | None | Sign in, receive JWT |
| GET | `/api/auth/me` | JWT | Get current user profile |
| PUT | `/api/auth/me` | JWT | Update profile fields |

### Companies
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/companies` | JWT | List all companies |
| POST | `/api/companies` | JWT | Create company |
| PUT | `/api/companies/:id` | JWT | Update company |
| DELETE | `/api/companies/:id` | JWT | Delete company |

### Applications
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/applications` | JWT | List all applications (includes company) |
| POST | `/api/applications` | JWT | Create application |
| PUT | `/api/applications/:id` | JWT | Update application (status, follow-up, resume, etc.) |
| DELETE | `/api/applications/:id` | JWT | Delete application |
| GET | `/api/applications/:appId/notes` | JWT | List interview notes |
| POST | `/api/applications/:appId/notes` | JWT | Add interview note |
| DELETE | `/api/notes/:id` | JWT | Delete interview note |

### AI Features
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/applications/:appId/interview-prep` | JWT | Generate interview prep pack |
| GET | `/api/applications/:appId/interview-prep` | JWT | Fetch saved prep packs |
| PUT | `/api/interview-prep/:id` | JWT | Save manual edits to prep pack |
| POST | `/api/applications/:appId/tailor-resume` | JWT | Run resume tailoring analysis |
| GET | `/api/applications/:appId/tailor-resume` | JWT | Fetch latest tailoring result |
| POST | `/api/analytics/ai-insights` | JWT | Generate career pipeline insights |
| GET | `/api/analytics/ai-insights` | JWT | Fetch latest insights |

### Resumes
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/resumes` | JWT | List all resume versions |
| POST | `/api/resumes` | JWT | Upload new resume version |
| DELETE | `/api/resumes/:id` | JWT | Delete resume |
| PATCH | `/api/resumes/:id/rename` | JWT | Rename resume |
| POST | `/api/resumes/:id/duplicate` | JWT | Clone resume version |
| POST | `/api/resumes/:id/analyze` | JWT | Run AI analysis (saves result) |
| GET | `/api/resumes/:id/analyses` | JWT | Fetch analysis history |
| GET | `/api/resumes/stats` | JWT | Aggregate stats across all resumes |
| GET | `/api/resumes/compare?id1=&id2=` | JWT | Side-by-side comparison |
| POST | `/api/resumes/analyze` | JWT | One-off analysis (no persistence) |

### Notifications
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | JWT | List notifications (auto-generates new ones) |
| PUT | `/api/notifications/read-all` | JWT | Mark all as read |
| PUT | `/api/notifications/:id/read` | JWT | Mark single notification as read |

### Analytics & Activity
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics` | JWT | Full analytics payload |
| GET | `/api/activity` | JWT | Activity timeline (last 50 events) |

---

## AI Integration

All AI features use the `callGeminiWithFallback` utility, which:

1. Validates that `GEMINI_API_KEY` is present and non-placeholder.
2. Calls `gemini-3.5-flash` with `responseMimeType: application/json` for structured output.
3. If the API call fails or the key is missing, falls back to a high-quality static response seeded from the application context (company name, role, industry, source data). This means every AI feature works end-to-end without a key configured — useful for demos and local development.

Prompts are role-aware: frontend-focused roles get React/JS-specific DSA topics and technical questions; backend/general roles get system design, databases, and concurrency questions.

---

## Security

**Authentication** — Passwords are hashed with bcrypt (cost factor 10). JWTs are signed with `HS256`, expire after 7 days, and the secret is required in production (the server throws on startup if `JWT_SECRET` is missing).

**Authorization** — Every data-access query includes `userId: req.userId` in the Prisma `where` clause, ensuring users can only read or modify their own data. There is no admin bypass.

**Rate Limiting** — All API routes share a rate limiter: 100 requests per 15-minute window per IP, with `trust proxy` enabled for accurate IP detection behind reverse proxies (Vercel, Nginx, etc.).

**Content Security Policy** — `helmet` is applied globally with a strict CSP. Allowed sources are scoped to:
- Scripts/Styles: `'self'`, `'unsafe-inline'`, `https://unpkg.com` (Swagger UI)
- Fonts: `'self'`, `data:`, `https://fonts.gstatic.com`
- Images: `'self'`, `data:`, `https:`
- Connections: `'self'`, `ws:`, `wss:`, `*.sentry.io`, `generativelanguage.googleapis.com`

**Input Validation** — All request bodies are validated with Zod schemas before any business logic runs. Resume uploads are validated for file extension (pdf, docx, txt) and size (10MB max).

**Request ID Correlation** — Every request receives a UUID (`X-Request-ID` response header). This ID is propagated to Sentry and the structured logger, enabling end-to-end tracing of any request across logs and error dashboards.

**Error Monitoring** — Sentry captures unhandled exceptions on both the Node.js backend (via `@sentry/node`) and the React frontend (via `@sentry/react`), tagged with the request ID for correlation.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- A PostgreSQL database (see [Hosted Database Options](#hosted-database-options-free-tiers-available) below — no local Docker required)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/interntrack-ai.git
cd interntrack-ai

# 2. Install dependencies
npm install

# 3. Copy and fill environment variables
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET (GEMINI_API_KEY is optional)

# 4. Generate the Prisma client and push schema to your database
npm run db:push         # pushes schema to DB (no migration history)
# OR for a tracked migration:
npm run db:migrate      # creates a named migration file and applies it

# 5. Seed the database with demo data
npm run db:seed

# 6. Start the development server
npm run dev
```

Open `http://localhost:3000`. Log in with the demo account:
- **Email:** `demo@interntrack.ai`
- **Password:** `password123`

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string. Format: `postgresql://user:pass@host:5432/db?schema=public` |
| `JWT_SECRET` | Yes (prod) | Secret key for signing JWTs. Generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `GEMINI_API_KEY` | No | Google Gemini API key. AI features fall back gracefully without it. |
| `SENTRY_DSN` | No | Sentry Project DSN for backend Express error tracking. |
| `VITE_SENTRY_DSN` | No | Sentry Project DSN for frontend React error boundary tracking. |

### API Documentation (Interactive Swagger)

InternTrack AI ships with interactive OpenAPI 3.0 documentation. All endpoint parameters, request schemas, response schemas, and security scopes are documented:

1. Start the dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/api/docs`
3. Try requests live from the Swagger UI console — including authenticated endpoints by pasting a JWT into the **Authorize** button.

The raw OpenAPI specification is at [`openapi.json`](./openapi.json).

### Running Tests

```bash
npm run test
```

The integration test suite (Vitest + Supertest) covers:
- `GET /api/health` — confirms 200 + `{ status: "ok" }`
- `POST /api/auth/register` — Zod schema rejects malformed payloads with 400
- `GET /api/companies` without JWT — confirms 401 Unauthorized guard

### Production Build

```bash
npm run build        # Builds client to dist/ and bundles server to dist/server.js (ESM)
NODE_ENV=production node dist/server.js
```

### Local PostgreSQL via Docker

If you don't have a hosted database yet, spin one up locally:

```bash
docker run --name interntrack-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=interntrack \
  -p 5432:5432 \
  -d postgres:16
```

Then set `DATABASE_URL=postgresql://postgres:password@localhost:5432/interntrack?schema=public` in your `.env`.

### Hosted Database Options (Free Tiers Available)

| Provider | Notes |
|---|---|
| **Neon** | Best Vercel integration, serverless PostgreSQL, generous free tier |
| **Supabase** | Full Postgres + Auth + Storage, free tier |
| **Railway** | One-click PostgreSQL add-on, great for Express deployments |
| **Render** | Free PostgreSQL instance (90-day expiry on free plan) |

---

## Vercel Serverless Deployment

InternTrack AI is optimized for zero-config Vercel deployment:

1. Import the repository into your Vercel Dashboard.
2. Vercel automatically detects the Vite config and sets the build command (`npm run build`) and output folder (`dist`).
3. Add the following **Environment Variables** in Vercel → Settings → Environment Variables:
   - `DATABASE_URL` — Hosted PostgreSQL connection string (e.g. from [Neon](https://neon.tech))
   - `JWT_SECRET` — Random secure string for signing tokens
   - `GEMINI_API_KEY` — (Optional) Your Gemini AI key
   - `SENTRY_DSN` / `VITE_SENTRY_DSN` — (Optional) For error tracking
4. Click **Deploy**. Vercel hosts the frontend from the CDN and compiles `api/index.ts` into a serverless function. Routing is handled automatically via [`vercel.json`](./vercel.json).

### CI/CD (GitHub Actions)

Every push to `main` triggers the pipeline in [`.github/workflows/ci-cd.yml`](./.github/workflows/ci-cd.yml):

1. Checkout code on Node 20
2. `npm ci` — clean dependency install
3. `npx prisma generate` — generate Prisma client
4. `npm run lint` — TypeScript type-check (`tsc --noEmit`)
5. `npm run build` — full production build validation

The pipeline catches type errors and build failures before they reach Vercel.

---

## Project Structure

```
.
├── api/
│   └── index.ts                  # Vercel Serverless entrypoint function
├── server.ts                     # Express app factory, CSP, rate limiting, Request ID middleware
├── vercel.json                   # Vercel routing rewrites and SPA fallback
├── openapi.json                  # OpenAPI 3.0 full API specification
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions CI/CD pipeline
├── src/
│   ├── backend/
│   │   ├── api.ts                # Root API router — mounts all route modules
│   │   ├── logger.ts             # Structured logger (INFO/WARN/ERROR + Request ID)
│   │   ├── lib/
│   │   │   └── gemini.ts         # callGeminiWithFallback AI utility
│   │   ├── routes/
│   │   │   ├── auth.ts           # /auth/register, /auth/login, /auth/me
│   │   │   ├── companies.ts      # /companies CRUD
│   │   │   ├── applications.ts   # /applications CRUD + notes
│   │   │   ├── resumes.ts        # /resumes + AI analysis
│   │   │   ├── notifications.ts  # /notifications
│   │   │   ├── analytics.ts      # /analytics/dashboard + AI insights
│   │   │   ├── activity.ts       # /activity timeline
│   │   │   └── health.ts         # /health status endpoint
│   │   └── __tests__/
│   │       └── api.test.ts       # Vitest + Supertest integration tests
│   ├── contexts/
│   │   └── AuthContext.tsx       # JWT auth state, login/logout
│   ├── layouts/
│   │   └── MainLayout.tsx        # Sidebar navigation shell
│   ├── lib/
│   │   └── api.ts                # apiRequest() fetch wrapper with auth headers
│   ├── pages/
│   │   ├── Dashboard.tsx         # Analytics charts, AI insights, deadline tracker
│   │   ├── Applications.tsx      # Full application CRUD with modal detail view
│   │   ├── Kanban.tsx            # Drag-and-drop pipeline board
│   │   ├── Companies.tsx         # Company CRM
│   │   ├── Resumes.tsx           # Resume manager + AI analysis UI
│   │   ├── Timeline.tsx          # Activity log with search and filters
│   │   └── Notifications.tsx     # Notification center
│   ├── App.tsx                   # Router with protected routes
│   └── main.tsx                  # React entry point & Sentry React loader
├── components/
│   └── ui/                       # shadcn/ui component primitives
├── prisma/
│   ├── schema.prisma             # PostgreSQL DB models with userId indexes
│   └── seed.ts                   # Demo data seeder
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Known Limitations & Roadmap

**Current limitations:**

- TypeScript strict mode is disabled. Enabling it and replacing `any` types throughout the API layer would significantly improve type safety.
- The backend uses `any` for Express `req`/`res` parameters. Typed request interfaces (e.g. via `express-serve-static-core`) would make the codebase more maintainable.
- The Vite-built JS bundle (~1 MB) could be reduced using `build.rollupOptions.output.manualChunks` for code splitting (e.g. splitting Recharts and Framer Motion into separate lazy chunks).

**Potential next steps:**

- Add email notifications via Resend or Nodemailer for deadline and follow-up reminders
- Implement resume file storage via Cloudflare R2 or AWS S3 instead of storing content as a database column
- Add OAuth (Google sign-in) as an alternative to email/password registration
- Enable TypeScript strict mode and replace remaining `any` types

---

## License

Apache 2.0 — see `SPDX-License-Identifier: Apache-2.0` in source files.
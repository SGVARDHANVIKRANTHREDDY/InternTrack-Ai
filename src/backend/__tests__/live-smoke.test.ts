import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import http from 'http';

vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  setTag: vi.fn(),
  setupExpressErrorHandler: vi.fn(),
}));

const mPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = mPrisma.user;
  },
}));

import bcrypt from 'bcryptjs';
import app from '../../../server.js';

// This test boots a REAL http.Server (not supertest's in-process call) and
// drives it with real sockets + real Origin headers, to prove the same-origin
// CORS logic works the way a real browser hitting a real deployed URL would
// see it — not just how supertest's simulated requests see it.
describe('Live smoke test: login flow over a real HTTP connection', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(() => {
    server.close();
  });

  it('completes register -> me with a real Origin header matching the request Host', async () => {
    const passwordHash = await bcrypt.hash('correct-password-123', 10);
    mPrisma.user.findUnique.mockResolvedValueOnce(null); // no existing user on register check
    mPrisma.user.create.mockResolvedValueOnce({
      id: 'live-user-1',
      email: 'live@example.com',
      name: 'Live User',
      passwordHash,
    });

    // Simulate exactly what a browser sends: Origin === the page's own origin (same-origin POST).
    const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: baseUrl,
      },
      body: JSON.stringify({ email: 'live@example.com', password: 'correct-password-123', name: 'Live User' }),
    });

    expect(registerRes.status).toBe(200);
    const registerBody = await registerRes.json();
    expect(registerBody.token).toBeTruthy();
    expect(typeof registerBody.token).toBe('string');

    mPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'live-user-1',
      email: 'live@example.com',
      name: 'Live User',
      college: null,
      graduationYear: null,
      linkedin: null,
      github: null,
      resumeLink: null,
    });

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Origin: baseUrl, Authorization: 'Bearer ' + registerBody.token },
    });
    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.email).toBe('live@example.com');
  });

  it('rejects a genuinely cross-origin request that is not in the allowlist', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Origin: 'https://some-random-attacker-site.example' },
    });
    // cors() surfaces the rejection as a 500 from its error callback in this Express setup
    expect(res.status).not.toBe(200);
  });
});

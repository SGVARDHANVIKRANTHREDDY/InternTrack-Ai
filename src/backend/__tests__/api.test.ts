import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../server.js';
import { PrismaClient } from '@prisma/client';

// Mock Sentry to avoid connecting to DSN
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  setTag: vi.fn(),
  setupExpressErrorHandler: vi.fn(),
}));

// ==========================================
// PRISMA MOCK
// ==========================================
// Every model used across the route modules is stubbed here so route logic
// can be exercised without a real database connection.
// `vi.mock` factories are hoisted above regular declarations, so the mock
// object itself must be created via `vi.hoisted` to be visible inside it.
const mPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  company: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findFirst: vi.fn(),
  },
  application: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findFirst: vi.fn(),
  },
  resumeVersion: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  notification: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
  },
  activityLog: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      user = mPrisma.user;
      company = mPrisma.company;
      application = mPrisma.application;
      resumeVersion = mPrisma.resumeVersion;
      notification = mPrisma.notification;
      activityLog = mPrisma.activityLog;
    },
  };
});

// Helper: fabricate a bcrypt hash cheaply for mocked users.
// We don't need a real hash since bcrypt.compare is exercised directly
// against known plaintext/hash pairs generated once via bcryptjs.
import bcrypt from 'bcryptjs';

const TEST_USER_A = {
  id: 'user-a-id',
  email: 'a@example.com',
  name: 'User A',
  college: null,
  graduationYear: null,
  linkedin: null,
  github: null,
  resumeLink: null,
};

const TEST_USER_B = { ...TEST_USER_A, id: 'user-b-id', email: 'b@example.com', name: 'User B' };

const PASSWORD = 'correct-password-123';
let PASSWORD_HASH: string;

describe('InternTrack AI API Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    PASSWORD_HASH = await bcrypt.hash(PASSWORD, 10);
  });

  // ==========================================
  // HEALTH
  // ==========================================
  describe('GET /api/health', () => {
    it('returns 200 with ok status and version', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.version).toBe('1.0.0');
    });
  });

  // ==========================================
  // AUTH: REGISTRATION
  // ==========================================
  describe('POST /api/auth/register', () => {
    it('rejects malformed payloads with 400 and validation details', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(Array.isArray(res.body.details)).toBe(true);
    });

    it('rejects a password under the minimum length', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@example.com', password: '123', name: 'New User' });
      expect(res.status).toBe(400);
    });

    it('rejects registration when the email already exists', async () => {
      mPrisma.user.findUnique.mockResolvedValueOnce(TEST_USER_A);
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: TEST_USER_A.email, password: PASSWORD, name: 'Dup' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('User already exists');
    });

    it('creates a user, sets an httpOnly session cookie, and never returns the token in the body', async () => {
      mPrisma.user.findUnique.mockResolvedValueOnce(null);
      mPrisma.user.create.mockResolvedValueOnce({ ...TEST_USER_A, passwordHash: PASSWORD_HASH });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: TEST_USER_A.email, password: PASSWORD, name: TEST_USER_A.name });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeUndefined(); // token must never be in the JSON body
      expect(res.body.user.email).toBe(TEST_USER_A.email);

      const setCookie = ([] as string[]).concat(res.headers['set-cookie'] || []);
      const sessionCookie = setCookie.find((c: string) => c.startsWith('interntrack_session='));
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie.toLowerCase()).toContain('httponly');
    });

    it('does not leak internal error details when registration throws', async () => {
      mPrisma.user.findUnique.mockResolvedValueOnce(null);
      mPrisma.user.create.mockRejectedValueOnce(
        new Error('connect ECONNREFUSED postgresql://postgres:supersecret@internal-db:5432/interntrack')
      );

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'leak-test@example.com', password: PASSWORD, name: 'Leak Test' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Server error');
      expect(JSON.stringify(res.body)).not.toContain('supersecret');
      expect(JSON.stringify(res.body)).not.toContain('ECONNREFUSED');
    });
  });

  // ==========================================
  // AUTH: LOGIN / LOGOUT
  // ==========================================
  describe('POST /api/auth/login', () => {
    it('rejects an unknown email with a generic "Invalid credentials" message', async () => {
      mPrisma.user.findUnique.mockResolvedValueOnce(null);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: PASSWORD });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('rejects a wrong password with the same generic message (no user-enumeration signal)', async () => {
      mPrisma.user.findUnique.mockResolvedValueOnce({ ...TEST_USER_A, passwordHash: PASSWORD_HASH });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER_A.email, password: 'totally-wrong' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('logs in successfully and sets the session cookie', async () => {
      mPrisma.user.findUnique.mockResolvedValueOnce({ ...TEST_USER_A, passwordHash: PASSWORD_HASH });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER_A.email, password: PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeUndefined();
      const setCookie = ([] as string[]).concat(res.headers['set-cookie'] || []);
      expect(setCookie.some((c: string) => c.startsWith('interntrack_session='))).toBe(true);
    });

    it('does not leak internal error details on a login-time exception', async () => {
      mPrisma.user.findUnique.mockRejectedValueOnce(new Error('P1001: prisma internal detail'));
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER_A.email, password: PASSWORD });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Server error');
      expect(JSON.stringify(res.body)).not.toContain('P1001');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears the session cookie', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      const setCookie = ([] as string[]).concat(res.headers['set-cookie'] || []);
      // clearCookie sends an expired cookie back with the same name
      expect(setCookie.some((c: string) => c.startsWith('interntrack_session='))).toBe(true);
    });
  });

  // ==========================================
  // SESSION-GATED ROUTES: /auth/me
  // ==========================================
  describe('GET /api/auth/me', () => {
    it('returns 401 without a session cookie', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('returns the profile for an authenticated session', async () => {
      const agent = request.agent(app);
      mPrisma.user.findUnique.mockResolvedValueOnce({ ...TEST_USER_A, passwordHash: PASSWORD_HASH });
      await agent.post('/api/auth/login').send({ email: TEST_USER_A.email, password: PASSWORD });

      mPrisma.user.findUnique.mockResolvedValueOnce(TEST_USER_A);
      const res = await agent.get('/api/auth/me');
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(TEST_USER_A.email);
    });
  });

  // ==========================================
  // AUTHORIZATION GUARANTEES ACROSS PROTECTED RESOURCES
  // ==========================================
  describe('Protected routes without a session', () => {
    it.each([
      ['GET', '/api/companies'],
      ['POST', '/api/companies'],
      ['GET', '/api/applications'],
      ['POST', '/api/applications'],
      ['GET', '/api/resumes'],
      ['GET', '/api/notifications'],
      ['GET', '/api/activity'],
      ['GET', '/api/analytics'],
    ])('%s %s returns 401 Unauthorized', async (method, path) => {
      const res = await (request(app) as any)[method.toLowerCase()](path);
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });
  });

  // Helper to obtain an authenticated agent for a given mock user.
  async function loginAs(user: typeof TEST_USER_A) {
    const agent = request.agent(app);
    mPrisma.user.findUnique.mockResolvedValueOnce({ ...user, passwordHash: PASSWORD_HASH });
    await agent.post('/api/auth/login').send({ email: user.email, password: PASSWORD });
    return agent;
  }

  describe('Companies — ownership scoping (IDOR protection)', () => {
    it('lists only companies scoped to the authenticated user', async () => {
      const agent = await loginAs(TEST_USER_A);
      mPrisma.company.findMany.mockResolvedValueOnce([{ id: 'c1', userId: TEST_USER_A.id, companyName: 'Acme' }]);

      const res = await agent.get('/api/companies');
      expect(res.status).toBe(200);
      expect(mPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: TEST_USER_A.id } })
      );
    });

    it('returns 404 when updating a company that does not belong to the user', async () => {
      const agent = await loginAs(TEST_USER_A);
      mPrisma.company.findFirst.mockResolvedValueOnce(null); // not found for this user

      const res = await agent.put('/api/companies/someone-elses-company').send({ companyName: 'Hijack' });
      expect(res.status).toBe(404);
      expect(mPrisma.company.update).not.toHaveBeenCalled();
    });

    it('returns 404 when deleting a company that does not belong to the user', async () => {
      const agent = await loginAs(TEST_USER_B);
      mPrisma.company.findFirst.mockResolvedValueOnce(null);

      const res = await agent.delete('/api/companies/user-a-owned-company');
      expect(res.status).toBe(404);
      expect(mPrisma.company.delete).not.toHaveBeenCalled();
    });

    it('creates a company scoped to the authenticated user', async () => {
      const agent = await loginAs(TEST_USER_A);
      mPrisma.company.create.mockResolvedValueOnce({ id: 'c2', userId: TEST_USER_A.id, companyName: 'Globex' });
      mPrisma.activityLog.create.mockResolvedValueOnce({});

      const res = await agent.post('/api/companies').send({ companyName: 'Globex' });
      expect(res.status).toBe(200);
      expect(mPrisma.company.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: TEST_USER_A.id }) })
      );
    });
  });

  describe('Applications — ownership scoping (IDOR protection)', () => {
    it('returns 404 when updating an application belonging to another user', async () => {
      const agent = await loginAs(TEST_USER_B);
      mPrisma.application.findFirst.mockResolvedValueOnce(null);

      const res = await agent.put('/api/applications/user-a-application').send({ status: 'Applied' });
      expect(res.status).toBe(404);
      expect(mPrisma.application.update).not.toHaveBeenCalled();
    });

    it('returns 404 when deleting an application belonging to another user', async () => {
      const agent = await loginAs(TEST_USER_B);
      mPrisma.application.findFirst.mockResolvedValueOnce(null);

      const res = await agent.delete('/api/applications/user-a-application');
      expect(res.status).toBe(404);
      expect(mPrisma.application.delete).not.toHaveBeenCalled();
    });

    it('rejects an invalid status value with a validation error', async () => {
      const agent = await loginAs(TEST_USER_A);
      const res = await agent
        .post('/api/applications')
        .send({ companyId: 'c1', role: 'SWE Intern', status: 'Not A Real Status' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('Resumes — upload validation', () => {
    it('rejects a disallowed file extension', async () => {
      const agent = await loginAs(TEST_USER_A);
      const res = await agent.post('/api/resumes').send({ resumeName: 'resume.exe' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('PDF, DOCX, and TXT');
    });

    it('lists only resumes scoped to the authenticated user', async () => {
      const agent = await loginAs(TEST_USER_A);
      mPrisma.resumeVersion.findMany.mockResolvedValueOnce([]);
      const res = await agent.get('/api/resumes');
      expect(res.status).toBe(200);
      expect(mPrisma.resumeVersion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: TEST_USER_A.id } })
      );
    });
  });

  describe('Notifications — delete / bulk-delete (soft delete via dismissed flag)', () => {
    it('returns 404 when deleting a notification that does not belong to the user', async () => {
      const agent = await loginAs(TEST_USER_B);
      mPrisma.notification.findFirst.mockResolvedValueOnce(null);

      const res = await agent.delete('/api/notifications/user-a-notification');
      expect(res.status).toBe(404);
      expect(mPrisma.notification.update).not.toHaveBeenCalled();
    });

    it('dismisses (soft-deletes) an owned notification', async () => {
      const agent = await loginAs(TEST_USER_A);
      mPrisma.notification.findFirst.mockResolvedValueOnce({ id: 'n1', userId: TEST_USER_A.id });
      mPrisma.notification.update.mockResolvedValueOnce({ id: 'n1', dismissed: true });

      const res = await agent.delete('/api/notifications/n1');
      expect(res.status).toBe(200);
      expect(mPrisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'n1' }, data: { dismissed: true } })
      );
    });

    it('rejects bulk-delete with a non-array ids payload', async () => {
      const agent = await loginAs(TEST_USER_A);
      const res = await agent.post('/api/notifications/bulk-delete').send({ ids: 'not-an-array' });
      expect(res.status).toBe(400);
    });

    it('scopes bulk-delete to the authenticated user even if other ids are included', async () => {
      const agent = await loginAs(TEST_USER_A);
      mPrisma.notification.updateMany.mockResolvedValueOnce({ count: 2 });

      const res = await agent.post('/api/notifications/bulk-delete').send({ ids: ['n1', 'n2', 'someone-elses-id'] });
      expect(res.status).toBe(200);
      expect(mPrisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: TEST_USER_A.id }),
          data: { dismissed: true },
        })
      );
    });
  });
});

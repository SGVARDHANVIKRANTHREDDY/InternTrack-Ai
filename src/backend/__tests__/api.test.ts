import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../server.js';

// Mock Sentry to avoid connecting to DSN
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  setTag: vi.fn(),
  setupExpressErrorHandler: vi.fn(),
}));

// Mock Prisma Client
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
  resumeVersion: {
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
  activityLog: {
    create: vi.fn(),
  }
}));

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      user = mPrisma.user;
      company = mPrisma.company;
      resumeVersion = mPrisma.resumeVersion;
      application = mPrisma.application;
      activityLog = mPrisma.activityLog;
    }
  };
});

function getTestToken() {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_for_dev_only';
  return jwt.sign({ userId: 'test-user-id' }, secret);
}

describe('InternTrack AI API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return 200 ok and health indicators', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.version).toBe('1.0.0');
    });
  });

  describe('POST /api/auth/register - validation', () => {
    it('should return 400 when missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('Protected Routes', () => {
    it('should return 401 Unauthorized for requests without JWT token', async () => {
      const res = await request(app).get('/api/companies');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });
  });

  describe('Application Ownership (IDOR Prevention)', () => {
    it('POST /api/applications rejects companyId that does not belong to user', async () => {
      mPrisma.company.findFirst.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${getTestToken()}`)
        .send({
          companyId: 'unauthorized-company-id',
          role: 'Software Engineer',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Company not found');
      expect(mPrisma.company.findFirst).toHaveBeenCalledWith({
        where: { id: 'unauthorized-company-id', userId: 'test-user-id' }
      });
      expect(mPrisma.application.create).not.toHaveBeenCalled();
    });

    it('POST /api/applications rejects resumeVersionId that does not belong to user', async () => {
      mPrisma.company.findFirst.mockResolvedValueOnce({ id: 'valid-company', companyName: 'Acme', userId: 'test-user-id' });
      mPrisma.resumeVersion.findFirst.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${getTestToken()}`)
        .send({
          companyId: 'valid-company',
          role: 'Software Engineer',
          resumeVersionId: 'unauthorized-resume-id',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Resume version not found');
      expect(mPrisma.resumeVersion.findFirst).toHaveBeenCalledWith({
        where: { id: 'unauthorized-resume-id', userId: 'test-user-id' }
      });
      expect(mPrisma.application.create).not.toHaveBeenCalled();
    });

    it('PUT /api/applications/:id rejects updating companyId to one not owned by user', async () => {
      mPrisma.application.findFirst.mockResolvedValueOnce({ id: 'app-1', userId: 'test-user-id', role: 'SWE' });
      mPrisma.company.findFirst.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/applications/app-1')
        .set('Authorization', `Bearer ${getTestToken()}`)
        .send({
          companyId: 'other-user-company',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Company not found');
      expect(mPrisma.application.update).not.toHaveBeenCalled();
    });

    it('PUT /api/applications/:id rejects updating resumeVersionId to one not owned by user', async () => {
      mPrisma.application.findFirst.mockResolvedValueOnce({ id: 'app-1', userId: 'test-user-id', role: 'SWE' });
      mPrisma.resumeVersion.findFirst.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/applications/app-1')
        .set('Authorization', `Bearer ${getTestToken()}`)
        .send({
          resumeVersionId: 'other-user-resume',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Resume version not found');
      expect(mPrisma.application.update).not.toHaveBeenCalled();
    });
  });

  describe('Auth Error Masking', () => {
    it('returns generic "Server error" on unexpected login failure without leaking internals', async () => {
      mPrisma.user.findUnique.mockRejectedValueOnce(new Error('Sensitive DB connection details'));

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Server error');
      expect(res.body.error).not.toContain('Sensitive DB connection details');
    });
  });
});

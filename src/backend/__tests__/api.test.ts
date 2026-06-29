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

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  const mPrisma = {
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
    activityLog: {
      create: vi.fn(),
    }
  };
  return {
    PrismaClient: class {
      user = mPrisma.user;
      company = mPrisma.company;
      application = mPrisma.application;
      activityLog = mPrisma.activityLog;
    }
  };
});

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
});

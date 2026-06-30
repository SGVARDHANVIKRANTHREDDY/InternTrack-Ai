import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger.js';
import { authenticate } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    return 'fallback_secret_key_for_dev_only';
  }
  return secret;
})();

// ==========================================
// ZOD SCHEMAS & MIDDLEWARE
// ==========================================

const RegisterSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

const LoginSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  college: z.string().max(200).optional().nullable(),
  graduationYear: z.number().int().min(1900).max(2100).optional().nullable(),
  linkedin: z.string().url('Must be a valid URL').optional().nullable(),
  github: z.string().url('Must be a valid URL').optional().nullable(),
  resumeLink: z.string().url('Must be a valid URL').optional().nullable(),
});

function validate(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      logger.warn('Validation failed', { requestId: req.id, errors });
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }
    req.body = result.data;
    next();
  };
}

// ==========================================
// ROUTES
// ==========================================

router.post('/register', validate(RegisterSchema), async (req: any, res) => {
  try {
    const { email, password, name } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    logger.info(`User registered successfully: ${user.email}`, { requestId: req.id, userId: user.id });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err: any) {
    logger.error('Registration error', { requestId: req.id, error: err });
    res.status(500).json({ error: `Server error: ${err.message || err}` });
  }
});

router.post('/login', validate(LoginSchema), async (req: any, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    logger.info(`User logged in: ${user.email}`, { requestId: req.id, userId: user.id });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err: any) {
    logger.error('Login error', { requestId: req.id, error: err });
    res.status(500).json({ error: `Server error: ${err.message || err}` });
  }
});

router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, college: true, graduationYear: true, linkedin: true, github: true, resumeLink: true }
    });
    res.json(user);
  } catch (err: any) {
    logger.error('Error fetching user profile', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: `Server error: ${err.message || err}` });
  }
});

router.put('/me', authenticate, validate(UpdateProfileSchema), async (req: any, res) => {
  try {
    const { name, college, graduationYear, linkedin, github, resumeLink } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { name, college, graduationYear, linkedin, github, resumeLink },
      select: { id: true, email: true, name: true, college: true, graduationYear: true, linkedin: true, github: true, resumeLink: true }
    });
    logger.info('User profile updated', { requestId: req.id, userId: req.userId });
    res.json(updated);
  } catch (err: any) {
    logger.error('Error updating user profile', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: `Server error: ${err.message || err}` });
  }
});

export default router;

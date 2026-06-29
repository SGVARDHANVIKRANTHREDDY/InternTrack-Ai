import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';
import { logActivity } from '../lib/activity.js';

const prisma = new PrismaClient();
const router = Router();

const CompanySchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  companyLogo: z.string().url().or(z.string().length(0)).optional().nullable(),
  companyWebsite: z.string().url().or(z.string().length(0)).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
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

router.get('/', authenticate, async (req: any, res) => {
  try {
    const companies = await prisma.company.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(companies);
  } catch (err) {
    logger.error('Error fetching companies', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, validate(CompanySchema), async (req: any, res) => {
  try {
    const company = await prisma.company.create({
      data: { ...req.body, userId: req.userId }
    });
    await logActivity(req.userId, 'Company Created', `Created company ${company.companyName}`, 'Company', company.id, null, req.id);
    res.json(company);
  } catch (err) {
    logger.error('Error creating company', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticate, validate(CompanySchema.partial()), async (req: any, res) => {
  try {
    const company = await prisma.company.update({
      where: { id: req.params.id, userId: req.userId },
      data: req.body
    });
    await logActivity(req.userId, 'Company Updated', `Updated company ${company.companyName}`, 'Company', company.id, null, req.id);
    res.json(company);
  } catch (err) {
    logger.error('Error updating company', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const company = await prisma.company.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    await prisma.company.delete({
      where: { id: req.params.id }
    });
    await logActivity(req.userId, 'Company Deleted', `Deleted company ${company.companyName}`, 'Company', req.params.id, null, req.id);
    res.json({ success: true });
  } catch (err) {
    logger.error('Error deleting company', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

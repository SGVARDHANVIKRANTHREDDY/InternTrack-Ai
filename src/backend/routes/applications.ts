import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';
import { logActivity } from '../lib/activity.js';

const prisma = new PrismaClient();
const router = Router();

const ApplicationSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required').max(200),
  applicationDate: z.string().optional().nullable(),
  deadlineDate: z.string().optional().nullable(),
  status: z.enum([
    'Wishlist', 'Applied', 'OA Scheduled', 'OA Completed',
    'Interview Scheduled', 'Interview Completed', 'Offer Received', 'Rejected',
  ]).optional(),
  salaryRange: z.string().max(100).optional().nullable(),
  applicationLink: z.string().url().or(z.string().length(0)).optional().nullable(),
  recruiterName: z.string().max(200).optional().nullable(),
  recruiterEmail: z.string().email().or(z.string().length(0)).optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  notes: z.string().max(10000).optional().nullable(),
  source: z.enum(['LINKEDIN', 'INTERNSHALA', 'WELLFOUND', 'COMPANY_CAREERS', 'REFERRAL', 'OTHER']).optional(),
  resumeVersionId: z.string().optional().nullable(),
  followUpSent: z.boolean().optional(),
  followUpDate: z.string().optional().nullable(),
  recruiterReplied: z.boolean().optional(),
  nextFollowUpDate: z.string().optional().nullable(),
  followUpNotes: z.string().max(5000).optional().nullable(),
  followUpStatus: z.enum(['WAITING', 'FOLLOWED_UP', 'REPLIED']).optional(),
});

const ApplicationUpdateSchema = ApplicationSchema.partial();

const InterviewNoteSchema = z.object({
  title: z.string().max(200).optional(),
  round: z.string().max(100).optional().nullable(),
  date: z.string().optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  feedback: z.string().max(5000).optional().nullable(),
  outcome: z.string().max(200).optional().nullable(),
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

router.get('/applications', authenticate, async (req: any, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.userId },
      include: { company: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(applications);
  } catch (err) {
    logger.error('Error fetching applications', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/applications', authenticate, validate(ApplicationSchema), async (req: any, res) => {
  try {
    const data = { ...req.body };
    if (data.applicationDate) data.applicationDate = new Date(data.applicationDate);
    if (data.deadlineDate) data.deadlineDate = new Date(data.deadlineDate);
    if (data.followUpDate) data.followUpDate = new Date(data.followUpDate);
    if (data.nextFollowUpDate) data.nextFollowUpDate = new Date(data.nextFollowUpDate);

    const application = await prisma.application.create({
      data: { ...data, userId: req.userId },
      include: { company: true }
    });
    
    await logActivity(req.userId, 'Application Created', `Applied for ${req.body.role} at ${application.company.companyName}`, 'Application', application.id, null, req.id);
    res.json(application);
  } catch (err) {
    logger.error('Error creating application', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/applications/:id', authenticate, validate(ApplicationUpdateSchema), async (req: any, res) => {
  try {
    const oldApp = await prisma.application.findFirst({ 
      where: { id: req.params.id, userId: req.userId }
    });
    if (!oldApp) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const data = { ...req.body };
    if (data.applicationDate) data.applicationDate = new Date(data.applicationDate);
    if (data.deadlineDate) data.deadlineDate = new Date(data.deadlineDate);
    if (data.followUpDate) data.followUpDate = new Date(data.followUpDate);
    if (data.nextFollowUpDate) data.nextFollowUpDate = new Date(data.nextFollowUpDate);
    
    const application = await prisma.application.update({
      where: { id: req.params.id },
      data,
      include: { company: true }
    });
    
    if (oldApp.status !== req.body.status && req.body.status) {
      await logActivity(req.userId, 'Status Changed', `Status changed to ${req.body.status} for ${application.role} at ${application.company.companyName}`, 'Application', application.id, null, req.id);
    } else if (oldApp.resumeVersionId !== req.body.resumeVersionId && req.body.resumeVersionId) {
      await logActivity(req.userId, 'Resume Assigned', `Assigned new resume version to ${application.role} application`, 'Application', application.id, null, req.id);
    } else if (!oldApp.followUpSent && req.body.followUpSent) {
      await logActivity(req.userId, 'Follow-Up Sent', `Follow-up sent to recruiter for ${application.role}`, 'Application', application.id, null, req.id);
    } else {
      await logActivity(req.userId, 'Application Updated', `Updated details for ${application.role} at ${application.company.companyName}`, 'Application', application.id, null, req.id);
    }
    
    res.json(application);
  } catch (err) {
    logger.error('Error updating application', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/applications/:id', authenticate, async (req: any, res) => {
  try {
    const app = await prisma.application.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { company: true }
    });
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    await prisma.application.delete({ where: { id: req.params.id } });
    await logActivity(req.userId, 'Application Deleted', `Deleted application for ${app.role} at ${app.company.companyName}`, 'Application', req.params.id, null, req.id);
    res.json({ success: true });
  } catch (err) {
    logger.error('Error deleting application', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// NOTES SUB-ROUTES
// ==========================================

router.get('/applications/:appId/notes', authenticate, async (req: any, res) => {
  try {
    const notes = await prisma.interviewNote.findMany({
      where: { applicationId: req.params.appId, application: { userId: req.userId } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notes);
  } catch (err) {
    logger.error('Error fetching notes', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/applications/:appId/notes', authenticate, validate(InterviewNoteSchema), async (req: any, res) => {
  try {
    const { appId } = req.params;
    const { title, round, date, notes, feedback, outcome } = req.body;

    const app = await prisma.application.findFirst({
      where: { id: appId, userId: req.userId }
    });

    if (!app) {
      res.status(404).json({ error: 'Application not found or unauthorized' });
      return;
    }

    const note = await prisma.interviewNote.create({
      data: {
        applicationId: appId,
        title: title || 'Interview Note',
        round,
        date: date ? new Date(date) : undefined,
        notes,
        feedback,
        outcome
      }
    });
    res.json(note);
  } catch (err) {
    logger.error('Error creating note', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/notes/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const note = await prisma.interviewNote.findFirst({
      where: { id, application: { userId: req.userId } }
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found or unauthorized' });
      return;
    }

    await prisma.interviewNote.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    logger.error('Error deleting note', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

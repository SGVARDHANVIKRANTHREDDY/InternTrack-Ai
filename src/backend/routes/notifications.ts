import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

const prisma = new PrismaClient();
const router = Router();

async function generateAutoNotifications(userId: string, requestId?: string) {
  try {
    const applications = await prisma.application.findMany({
      where: { userId },
      include: { company: true }
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const app of applications) {
      // 1. Check Missing Resume
      if (!app.resumeVersionId) {
        const link = `/applications/${app.id}/resume-missing`;
        const existing = await prisma.notification.findFirst({
          where: { userId, type: 'SYSTEM', link }
        });
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId,
              title: 'Resume Missing',
              message: `Assign a resume version to your ${app.role} application at ${app.company.companyName} to track performance.`,
              type: 'SYSTEM',
              link
            }
          });
        }
      }

      // 2. Check Deadline
      if (app.deadlineDate) {
        const deadline = new Date(app.deadlineDate);
        const diffDays = Math.ceil((deadline.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
        
        let title = '';
        let message = '';
        
        if (diffDays === 0) {
          title = 'Deadline Today';
          message = `Application deadline for ${app.role} at ${app.company.companyName} is today!`;
        } else if (diffDays > 0 && diffDays <= 3) {
          title = 'Deadline Looming';
          message = `Application deadline for ${app.role} at ${app.company.companyName} is in ${diffDays} days.`;
        } else if (diffDays > 0 && diffDays <= 7) {
          title = 'Deadline Upcoming';
          message = `Application deadline for ${app.role} at ${app.company.companyName} is in ${diffDays} days.`;
        }

        if (title) {
          const link = `/applications/${app.id}/deadline-${diffDays}`;
          const existing = await prisma.notification.findFirst({
            where: { userId, type: 'DEADLINE', link }
          });
          if (!existing) {
            await prisma.notification.create({
              data: { userId, title, message, type: 'DEADLINE', link }
            });
          }
        }
      }

      // 3. Check Follow-Up Due
      if (app.nextFollowUpDate && app.followUpStatus !== 'REPLIED') {
        const followUpDate = new Date(app.nextFollowUpDate);
        if (followUpDate <= now) {
          const link = `/applications/${app.id}/followup-due`;
          const existing = await prisma.notification.findFirst({
            where: { userId, type: 'FOLLOWUP', link }
          });
          if (!existing) {
            await prisma.notification.create({
              data: {
                userId,
                title: 'Follow-Up Due',
                message: `You scheduled a recruiter follow-up for ${app.role} at ${app.company.companyName} on ${followUpDate.toLocaleDateString()}.`,
                type: 'FOLLOWUP',
                link
              }
            });
          }
        }
      }
    }

    // 4. Check Interview Tomorrow
    const notes = await prisma.interviewNote.findMany({
      where: { application: { userId } },
      include: { application: { include: { company: true } } }
    });
    for (const note of notes) {
      if (note.date) {
        const noteDate = new Date(note.date);
        const diffDays = Math.ceil((noteDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          const link = `/applications/${note.applicationId}/interview-tomorrow`;
          const existing = await prisma.notification.findFirst({
            where: { userId, type: 'INTERVIEW', link }
          });
          if (!existing) {
            await prisma.notification.create({
              data: {
                userId,
                title: 'Interview Tomorrow!',
                message: `Your ${note.round || 'interview'} round with ${note.application.company.companyName} is tomorrow. Good luck!`,
                type: 'INTERVIEW',
                link
              }
            });
          }
        }
      }
    }
  } catch (err) {
    logger.error('Error auto-generating notifications', { requestId, userId, error: err });
  }
}

// ==========================================
// ROUTES
// ==========================================

router.get('/', authenticate, async (req: any, res) => {
  try {
    await generateAutoNotifications(req.userId, req.id);
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(notifications);
  } catch (err) {
    logger.error('Error fetching notifications', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/read-all', authenticate, async (req: any, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (err) {
    logger.error('Error marking all notifications as read', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/read', authenticate, async (req: any, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id, userId: req.userId },
      data: { read: true }
    });
    res.json(notification);
  } catch (err) {
    logger.error('Error marking notification as read', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

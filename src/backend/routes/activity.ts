import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

const prisma = new PrismaClient();
const router = Router();

// ==========================================
// ROUTES
// ==========================================

router.get('/', authenticate, async (req: any, res) => {
  try {
    const isPaginated = req.query.paginated === 'true';

    // Parse pagination parameters
    const take = Math.min(parseInt(req.query.take as string) || 50, 100);
    const skip = Math.max(parseInt(req.query.skip as string) || 0, 0);

    if (isPaginated) {
      const total = await prisma.activityLog.count({
        where: { userId: req.userId }
      });

      const logs = await prisma.activityLog.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take,
        skip
      });

      res.json({
        logs,
        pagination: {
          total,
          take,
          skip,
          hasMore: skip + take < total
        }
      });
    } else {
      // Default behavior: return flat array of last 50 logs for backward compatibility with frontend
      const logs = await prisma.activityLog.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      res.json(logs);
    }
  } catch (err) {
    logger.error('Error fetching activity logs', { requestId: req.id, userId: req.userId, error: err });
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

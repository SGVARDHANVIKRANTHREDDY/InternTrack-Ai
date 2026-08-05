import { prisma } from './prisma.js';
import { logger } from './logger.js';


export const logActivity = async (
  userId: string,
  action: string,
  details?: string,
  entityType?: string,
  entityId?: string,
  metadata?: any,
  requestId?: string
) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details,
        entityType,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : undefined
      }
    });
    logger.info(`Activity logged: ${action} - ${details || ''}`, { requestId, userId });
  } catch (err) {
    logger.error('Error logging activity', { requestId, userId, error: err });
  }
};

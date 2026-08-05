import jwt from 'jsonwebtoken';
import { logger } from '../lib/logger.js';

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

export const AUTH_COOKIE_NAME = 'interntrack_session';

export const authenticate = (req: any, res: any, next: any) => {
  // Cookie-based session token (httpOnly, set by /auth/login and /auth/register).
  // Falling back to an Authorization header is intentionally NOT supported here —
  // the whole point of the httpOnly cookie is that no client-side JS ever holds the token.
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    logger.warn('Unauthorized request: missing session', { requestId: req.id });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.userId = payload.userId;
    next();
  } catch (err) {
    logger.warn('Unauthorized request: invalid token', { requestId: req.id });
    res.status(401).json({ error: 'Invalid token' });
  }
};

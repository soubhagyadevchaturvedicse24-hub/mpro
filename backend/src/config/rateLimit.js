import rateLimit from 'express-rate-limit';

// General API limiter (for most routes)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000,
  standardHeaders: true,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Stricter limiter for auth endpoints (login, 2FA, etc.)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  message: {
    error: 'TOO_MANY_REQUESTS_AUTH',
    message: 'Too many authentication attempts, please try again later.'
  }
});

// Limiter for admin actions
export const criticalActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  message: {
    error: 'TOO_MANY_REQUESTS_CRITICAL',
    message: 'Too many critical admin requests from this IP, please try again later.'
  }
});

/**
 * Audit-specific limiter — generous limit to support the 2-second live polling
 * from the Blockchain Audit frontend page without hitting rate limits.
 *
 * Math: 2s poll = 30 req/min = 450 req/15min per tab.
 * Set to 600 to safely allow one active tab + some overhead.
 */
export const auditLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600,
  standardHeaders: true,
  message: {
    error: 'TOO_MANY_AUDIT_REQUESTS',
    message: 'Audit API rate limit exceeded. The live feed will resume shortly.'
  }
});

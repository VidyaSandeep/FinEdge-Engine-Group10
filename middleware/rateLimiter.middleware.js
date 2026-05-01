import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

export const apiRateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 min
    limit: env.RATE_LIMIT_MAX_REQUESTS || 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
    },
});

export const authRateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS || 15 * 60 * 1000,
    limit: env.RATE_LIMIT_AUTH_MAX_REQUESTS || 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many attempts, please try again later.',
    },
});
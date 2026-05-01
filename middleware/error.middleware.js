import { ZodError } from 'zod';
import { sendError } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
    logger.error(
        {
            err,
            method: req.method,
            url: req.originalUrl,
        },
        'Unhandled error'
    );

    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof ZodError) {
        return sendError(res, {
            statusCode: 400,
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Validation failed',
            errors: err.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            })),
        });
    }

    if (err instanceof ApiError) {
        return sendError(res, {
            statusCode: err.statusCode,
            code: err.code,
            message: err.message,
            errors: err.errors,
        });
    }

    return sendError(res, {
        statusCode: 500,
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
    });
}
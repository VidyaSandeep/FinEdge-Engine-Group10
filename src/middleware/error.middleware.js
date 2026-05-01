import { ZodError } from 'zod';
import { sendError } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import logger from '../utils/logger.js';

function errorHandler(err, req, res, next) {
    // Use correlated logger if available, otherwise fallback to global logger
    const errorLogger = req.logger || logger;

    errorLogger.error(
        {
            requestId: req.id,
            err: {
                message: err.message,
                stack: err.stack,
                code: err.code,
                ...(err.errors ? { details: err.errors } : {}),
            },
            method: req.method,
            url: req.originalUrl,
        },
        'Request error occurred'
    );

    if (res.headersSent) {
        return next(err);
    }

    // Handle Zod validation errors (mostly from middleware)
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



    // Handle custom API errors
    if (err instanceof ApiError) {
        return sendError(res, {
            statusCode: err.statusCode,
            code: err.code,
            message: err.message,
            errors: err.errors,
        });
    }

    // Handle standard Express errors (e.g., from body-parser)
    if (err.status || err.statusCode) {
        const statusCode = err.status || err.statusCode;
        return sendError(res, {
            statusCode,
            code: statusCode === 400 ? ERROR_CODES.INVALID_INPUT : ERROR_CODES.INTERNAL_SERVER_ERROR,
            message: err.message || 'Request failed',
        });
    }

    // Generic fallback for unexpected errors
    return sendError(res, {
        statusCode: 500,
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
    });
}

export default errorHandler;
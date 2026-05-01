import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export function notFoundHandler(req, res, next) {
    next(
        new ApiError(ERROR_CODES.NOT_FOUND, {
            message: `Route not found: ${req.method} ${req.originalUrl}`,
        })
    );
}
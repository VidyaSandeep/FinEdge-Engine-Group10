import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

function notFoundHandler(req, res, next) {
    next(
        new ApiError(ERROR_CODES.NOT_FOUND, {
            message: `Route not found: ${req.method} ${req.originalUrl}`,
        })
    );
}

export default notFoundHandler;
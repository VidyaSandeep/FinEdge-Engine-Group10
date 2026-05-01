import { ERROR_DEFINITIONS } from '../constants/errorDefinitions.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export class ApiError extends Error {
    constructor(code = ERROR_CODES.INTERNAL_SERVER_ERROR, overrides = {}) {
        const definition = ERROR_DEFINITIONS[code] || ERROR_DEFINITIONS[ERROR_CODES.INTERNAL_SERVER_ERROR];

        super(overrides.message || definition.message);

        this.name = 'ApiError';
        this.code = code;
        this.statusCode = overrides.statusCode || definition.statusCode;
        this.errors = overrides.errors || null;

        Error.captureStackTrace?.(this, this.constructor);
    }
}
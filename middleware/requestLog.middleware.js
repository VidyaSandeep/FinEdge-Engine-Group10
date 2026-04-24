import { logger } from "../utils/logger.js";


export function requestLogHandler(req, res, next) {
    logger.info(
        {
            method: req.method,
            url: req.originalUrl,
        },
        'Incoming request'
    );
    next();
}

/**
 * TODO :
 * - Extract request data into structured log format (e.g., pino request context)
 * - Add request ID correlation
 * - Add request duration
 * - logging configuration using env variables
 * - log redaction for sensitive data
 */
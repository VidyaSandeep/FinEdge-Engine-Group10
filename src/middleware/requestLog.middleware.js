import logger from "../utils/logger.js";

/**
 * Logs the request: entry, duration, and response status.
 * AsyncLocalStorage, the global logger automatically includes
 * the requestId and other context.
 */
function requestLogHandler(req, res, next) {
    const startTime = Date.now();

    logger.info('Incoming request');

    // Listen for the response to finish to log the outcome
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info({
            statusCode: res.statusCode,
            duration: `${duration}ms`
        }, 'Request completed');
    });

    next();
}

export default requestLogHandler;
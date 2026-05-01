import { randomUUID } from 'crypto';

/**
 * Attaches a unique requestId to each request.
 * This ID is used to correlate all logs related to a single request lifecycle.
 */
function requestIdMiddleware(req, res, next) {
    const requestId = req.headers['x-request-id'] || randomUUID();

    // Attach to request and response objects
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);

    next();
}

export default requestIdMiddleware;


import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { updateContext } from '../utils/context.js';

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(
        ERROR_CODES.UNAUTHORIZED,
        { message: 'Authorization token is required' }
      );
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    };

    // Enrich the global context for all subsequent logs
    updateContext({ userId: decoded.id });

    next();
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(
          ERROR_CODES.UNAUTHORIZED,
          { message: 'Invalid or expired token' }
        )
    );
  }
}

export default authMiddleware;

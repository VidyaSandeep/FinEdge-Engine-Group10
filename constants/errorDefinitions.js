import { ERROR_CODES } from './errorCodes.js';

export const ERROR_DEFINITIONS = {
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: {
    statusCode: 500,
    message: 'Internal Server Error',
  },
  [ERROR_CODES.VALIDATION_ERROR]: {
    statusCode: 400,
    message: 'Validation failed',
  },
  [ERROR_CODES.USER_ALREADY_EXISTS]: {
    statusCode: 409,
    message: 'User already exists',
  },
  [ERROR_CODES.USER_NOT_FOUND]: {
    statusCode: 404,
    message: 'User not found',
  },
  [ERROR_CODES.INVALID_CREDENTIALS]: {
    statusCode: 401,
    message: 'Invalid credentials',
  },
  [ERROR_CODES.UNAUTHORIZED]: {
    statusCode: 401,
    message: 'Unauthorized',
  },
  [ERROR_CODES.FORBIDDEN]: {
    statusCode: 403,
    message: 'Forbidden',
  },
  [ERROR_CODES.SERVICE_UNHEALTHY]: {
    statusCode: 503,
    message: 'Service is unhealthy',
  },
  [ERROR_CODES.INVALID_INPUT]: {
    statusCode: 400,
    message: 'Invalid input',
  },
  [ERROR_CODES.DUPLICATE_ENTRY]: {
    statusCode: 409,
    message: 'Duplicate entry',
  }
};
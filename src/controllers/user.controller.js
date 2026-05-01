import * as userService from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';
import logger from '../utils/logger.js';

export async function register(req, res, next) {
  try {
    const result = await userService.createUser(req.body);
    
    logger.info({ userId: result.user.id }, 'New user registered');

    return sendSuccess(res, {
      statusCode: 201,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await userService.loginUser(req.body);
    
    logger.info({ userId: result.user.id }, 'User logged in');

    return sendSuccess(res, {
      statusCode: 200,
      message: 'User logged in successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function profile(req, res, next) {
  try {
    const result = await userService.findUserById(req.user.id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'User profile fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const result = await userService.updateUser(req.user.id, req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'User profile updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPreference(req, res, next) {
  try {
    const result = await userService.getPreference(req.user.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'User preferences fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePreference(req, res, next) {
  try {
    const result = await userService.updatePreference(req.user.id, req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'User preferences updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const result = await userService.updateUser(req.params.id, req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'User updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function permanentDeleteSelf(req, res, next) {
  try {
    await userService.permanentDeleteSelf(req.user.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'User account and all related data deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

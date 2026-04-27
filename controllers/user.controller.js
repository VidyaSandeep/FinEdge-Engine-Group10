import { registerUser, loginUser, userProfile } from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';

export async function register(req, res, next) {
  try {
    const result = await registerUser(req.body);

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
    const result = await loginUser(req.body);

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
    const result = await userProfile(req.user.id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'User profile fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { logger } from '../utils/logger.js';
import { findUserByEmailWithPassword, createUser, findUserById, findUserByEmail } from '../repositories/user.repository.js';
import { env } from '../config/env.js';

export async function loginUser(payload) {
  const { email, password } = payload;
  if (!email || !password) {
    throw new ApiError(ERROR_CODES.INVALID_CREDENTIALS, { message: "Invalid credentials" });
  }
  const user = await findUserByEmailWithPassword(email);
  if (!user) {
    throw new ApiError(ERROR_CODES.INVALID_CREDENTIALS, { message: "Invalid credentials" });
  }
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(ERROR_CODES.INVALID_CREDENTIALS, { message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email },
    env.JWT_SECRET, {
    expiresIn: "1d",
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token,
  };
}

export async function registerUser(payload) {
  try {
    const { name, email, password } = payload;

    if (!name || !email || !password) {
      throw new ApiError(ERROR_CODES.INVALID_INPUT, { message: "All fields are required" });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new ApiError(ERROR_CODES.DUPLICATE_ENTRY, { message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
      name,
      email,
      password: hashedPassword,  // store hashed password
    });

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email },
      env.JWT_SECRET, {
      expiresIn: "1d",  // token valid for 1 day
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    };

  } catch (error) {
    logger.error({ err: error }, "Registration error");
    if (error.name === "ValidationError") {
      throw new ApiError(ERROR_CODES.INVALID_INPUT, { message: "Validation failed" });
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(ERROR_CODES.INTERNAL_SERVER_ERROR, { message: "Internal server error" });
  }
}

export async function userProfile(userId) {
  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new ApiError(ERROR_CODES.USER_NOT_FOUND, { message: "User not found" });
    }
    return user;
  } catch (error) {
    logger.error({ err: error }, "User profile error");
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(ERROR_CODES.INTERNAL_SERVER_ERROR, { message: "Internal server error" });
  }
}
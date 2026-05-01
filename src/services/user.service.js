import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import logger from '../utils/logger.js';
import * as userRepository from '../repositories/user.repository.js';
import * as preferenceRepo from '../repositories/userPreference.repository.js';
import * as budgetRepo from '../repositories/budget.repository.js';
import * as transactionRepo from '../repositories/transaction.repository.js';
import * as transactionManager from '../repositories/transaction.manager.js';
import { env } from '../config/env.js';
import eventBus, { EVENTS } from '../utils/eventBus.js';
import { CURRENCIES } from '../constants/constants.js';

export async function loginUser(payload) {
  const { email, password } = payload;

  const user = await userRepository.findUserByEmailWithPassword(email);
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

  const result = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token,
  };

  // Emit login event
  eventBus.emit(EVENTS.USER.LOGIN, result.user);

  return result;
}

export async function createUser(payload) {
  try {
    const { name, email, password } = payload;

    const existingUser = await userRepository.findUserByEmail(email);
    if (existingUser) {
      throw new ApiError(ERROR_CODES.DUPLICATE_ENTRY, { message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await transactionManager.withTransaction(async (tx) => {
      const user = await userRepository.createUser({
        name,
        email,
        password: hashedPassword,
      }, tx);

      // Create default preferences
      const prefs = await preferenceRepo.upsertByUserId(user.id, { currency: CURRENCIES.USD.code }, tx);

      // Link preferences to user and get populated user
      const updatedUser = await userRepository.updateUser(user.id, { preferences: prefs.id }, tx);

      const token = jwt.sign({ id: user.id, name: user.name, email: user.email },
        env.JWT_SECRET, {
        expiresIn: "1d",
      });

      return {
        user: updatedUser,
        token,
      };
    });

    // Emit registration event
    eventBus.emit(EVENTS.USER.REGISTERED, result.user);

    return result;

  } catch (error) {
    logger.error({ err: error }, "Error creating user");
    if (error.name === "ValidationError") {
      throw new ApiError(ERROR_CODES.INVALID_INPUT, { message: "Validation failed" });
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(ERROR_CODES.INTERNAL_SERVER_ERROR, { message: "Internal server error" });
  }
}

export async function getPreference(userId) {
  const prefs = await preferenceRepo.findByUserId(userId);
  if (!prefs) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, { message: "Preferences not found" });
  }
  return prefs;
}

export async function updatePreference(userId, data) {
  const prefs = await preferenceRepo.upsertByUserId(userId, data);
  return prefs;
}

export async function updateUser(userId, data) {
  const user = await userRepository.updateUser(userId, data);
  if (!user) {
    throw new ApiError(ERROR_CODES.USER_NOT_FOUND, { message: "User not found" });
  }
  return user;
}

export async function permanentDeleteSelf(userId) {
  try {
    await transactionManager.withTransaction(async (tx) => {
      // Order of deletion: Child records first
      await preferenceRepo.deleteByUserId(userId, tx);
      await budgetRepo.deleteBudgetsByUserId(userId, tx);
      await transactionRepo.deleteTransactionsByUserId(userId, tx);
      const user = await userRepository.deleteUserById(userId, tx);

      if (!user) {
        throw new ApiError(ERROR_CODES.USER_NOT_FOUND, { message: "User not found" });
      }
    });

    logger.info({ userId }, "User account fully wiped");
    return true;
  } catch (error) {
    logger.error({ err: error, userId }, "Failed to wipe user account");
    if (error instanceof ApiError) throw error;
    throw new ApiError(ERROR_CODES.INTERNAL_SERVER_ERROR, { message: "Internal server error during deletion" });
  }
}

export async function findUserById(userId) {
  try {
    const user = await userRepository.findUserById(userId);
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
import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/repositories/transaction.manager.js', () => ({
  withTransaction: jest.fn(async (cb) => await cb(undefined))
}));

import { CURRENCIES } from '../../../src/constants/constants.js';

jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn()
  }
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(),
    verify: jest.fn()
  }
}));

jest.unstable_mockModule('../../../src/repositories/user.repository.js', () => ({
  findUserByEmailWithPassword: jest.fn(),
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUserById: jest.fn()
}));

jest.unstable_mockModule('../../../src/repositories/userPreference.repository.js', () => ({
  findByUserId: jest.fn(),
  upsertByUserId: jest.fn()
}));

jest.unstable_mockModule('../../../src/models/user.model.js', () => ({
  default: {
    findByIdAndUpdate: jest.fn()
  }
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

jest.unstable_mockModule('../../../src/utils/eventBus.js', () => ({
  default: {
    emit: jest.fn()
  },
  EVENTS: {
    USER: {
      LOGIN: 'user.login',
      REGISTERED: 'user.registered'
    }
  }
}));

const { loginUser, createUser, findUserById, getPreference, updatePreference } = await import('../../../src/services/user.service.js');
const preferenceRepository = await import('../../../src/repositories/userPreference.repository.js');
const User = (await import('../../../src/models/user.model.js')).default;
const userRepository = await import('../../../src/repositories/user.repository.js');
const transactionManager = await import('../../../src/repositories/transaction.manager.js');
const bcrypt = (await import('bcryptjs')).default;
const jwt = (await import('jsonwebtoken')).default;
const eventBus = (await import('../../../src/utils/eventBus.js')).default;
const { EVENTS } = await import('../../../src/utils/eventBus.js');
const { ApiError } = await import('../../../src/utils/ApiError.js');
const { ERROR_CODES } = await import('../../../src/constants/errorCodes.js');
const { env } = await import('../../../src/config/env.js');

describe('Service - User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore withTransaction mock implementation (clearAllMocks wipes it)
    transactionManager.withTransaction.mockImplementation(async (cb) => await cb(undefined));
  });

  describe('loginUser', () => {
    it('should return user and token when credentials are valid', async () => {
      // Arrange
      const payload = { email: 'test@test.com', password: 'password123' };
      const mockUser = { id: 'user_1', name: 'Test User', email: 'test@test.com', passwordHash: 'hashedpassword' };
      userRepository.findUserByEmailWithPassword.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('fake-token');

      // Act
      const result = await loginUser(payload);

      // Assert
      expect(userRepository.findUserByEmailWithPassword).toHaveBeenCalledWith(payload.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(payload.password, mockUser.passwordHash);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser.id, name: mockUser.name, email: mockUser.email },
        env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.USER.LOGIN, { id: mockUser.id, name: mockUser.name, email: mockUser.email });
      expect(result).toEqual({
        user: { id: mockUser.id, name: mockUser.name, email: mockUser.email },
        token: 'fake-token'
      });
    });

    it('should throw ApiError if user is not found', async () => {
      // Arrange
      const payload = { email: 'nonexistent@test.com', password: 'password123' };
      userRepository.findUserByEmailWithPassword.mockResolvedValue(null);

      // Act & Assert
      await expect(loginUser(payload)).rejects.toThrow(ApiError);
      await expect(loginUser(payload)).rejects.toMatchObject({
        code: ERROR_CODES.INVALID_CREDENTIALS,
      });
    });

    it('should throw ApiError if password is invalid', async () => {
      // Arrange
      const payload = { email: 'test@test.com', password: 'wrongpassword' };
      const mockUser = { id: 'user_1', passwordHash: 'hashedpassword' };
      userRepository.findUserByEmailWithPassword.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(loginUser(payload)).rejects.toThrow(ApiError);
      await expect(loginUser(payload)).rejects.toMatchObject({
        code: ERROR_CODES.INVALID_CREDENTIALS,
      });
    });
  });

  describe('createUser', () => {
    it('should register a user and return token successfully', async () => {
      // Arrange
      const payload = { name: 'Test User', email: 'test@test.com', password: 'password123' };
      const mockCreatedUser = { id: 'user_2', name: 'Test User', email: 'test@test.com' };
      const mockPopulatedUser = { ...mockCreatedUser, preferences: { currency: CURRENCIES.USD.code } };

      userRepository.findUserByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedpassword');
      userRepository.createUser.mockResolvedValue(mockCreatedUser);
      userRepository.updateUser.mockResolvedValue(mockPopulatedUser);
      preferenceRepository.upsertByUserId.mockResolvedValue({ id: 'pref_1', currency: CURRENCIES.USD.code });
      jwt.sign.mockReturnValue('new-fake-token');

      // Act
      const result = await createUser(payload);

      // Assert
      expect(userRepository.findUserByEmail).toHaveBeenCalledWith(payload.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(payload.password, 10);
      expect(userRepository.createUser).toHaveBeenCalledWith({
        name: payload.name,
        email: payload.email,
        password: 'hashedpassword'
      }, undefined);
      expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.USER.REGISTERED, mockPopulatedUser);
      // Preference checks
      expect(preferenceRepository.upsertByUserId).toHaveBeenCalledWith(mockCreatedUser.id, { currency: CURRENCIES.USD.code }, undefined);
      expect(userRepository.updateUser).toHaveBeenCalledWith(mockCreatedUser.id, { preferences: 'pref_1' }, undefined);

      expect(result).toEqual({
        user: mockPopulatedUser,
        token: 'new-fake-token'
      });
    });

    it('should throw ApiError if email is already registered', async () => {
      // Arrange
      const payload = { name: 'Test User', email: 'test@test.com', password: 'password123' };
      userRepository.findUserByEmail.mockResolvedValue({ id: 'existing_user' });

      // Act & Assert
      await expect(createUser(payload)).rejects.toThrow(ApiError);
      await expect(createUser(payload)).rejects.toMatchObject({
        code: ERROR_CODES.DUPLICATE_ENTRY,
      });
    });

    it('should throw ApiError on ValidationError', async () => {
      // Arrange
      const payload = { name: 'Test User', email: 'test@test.com', password: 'password123' };
      userRepository.findUserByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedpassword');
      const validationError = new Error('Validation Error');
      validationError.name = 'ValidationError';
      userRepository.createUser.mockRejectedValue(validationError);

      // Act & Assert
      await expect(createUser(payload)).rejects.toThrow(ApiError);
      await expect(createUser(payload)).rejects.toMatchObject({
        code: ERROR_CODES.INVALID_INPUT,
      });
    });

    it('should bubble up ApiError', async () => {
      // Arrange
      const payload = { name: 'Test User', email: 'test@test.com', password: 'password123' };
      userRepository.findUserByEmail.mockResolvedValue(null);
      const apiError = new ApiError('CUSTOM_ERROR', { message: 'Custom error' });
      bcrypt.hash.mockRejectedValue(apiError);

      // Act & Assert
      await expect(createUser(payload)).rejects.toThrow(ApiError);
    });

    it('should throw general ApiError for unexpected errors', async () => {
      // Arrange
      const payload = { name: 'Test User', email: 'test@test.com', password: 'password123' };
      userRepository.findUserByEmail.mockResolvedValue(null);
      bcrypt.hash.mockRejectedValue(new Error('Unexpected database failure'));

      // Act & Assert
      await expect(createUser(payload)).rejects.toThrow(ApiError);
      await expect(createUser(payload)).rejects.toMatchObject({
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('findUserById', () => {
    it('should return user if found', async () => {
      // Arrange
      const mockUser = { id: 'user_123', name: 'John Doe' };
      userRepository.findUserById.mockResolvedValue(mockUser);

      // Act
      const result = await findUserById('user_123');

      // Assert
      expect(userRepository.findUserById).toHaveBeenCalledWith('user_123');
      expect(result).toEqual(mockUser);
    });

    it('should throw ApiError if user is not found', async () => {
      // Arrange
      userRepository.findUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(findUserById('user_123')).rejects.toThrow(ApiError);
      await expect(findUserById('user_123')).rejects.toMatchObject({
        code: ERROR_CODES.USER_NOT_FOUND,
      });
    });

    it('should bubble up ApiError', async () => {
      // Arrange
      const apiError = new ApiError('CUSTOM_ERROR', { message: 'Custom' });
      userRepository.findUserById.mockRejectedValue(apiError);

      // Act & Assert
      await expect(findUserById('user_123')).rejects.toThrow(ApiError);
    });

    it('should throw general ApiError for unexpected errors', async () => {
      // Arrange
      userRepository.findUserById.mockRejectedValue(new Error('DB connection failed'));

      // Act & Assert
      await expect(findUserById('user_123')).rejects.toThrow(ApiError);
      await expect(findUserById('user_123')).rejects.toMatchObject({
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('Preference Methods', () => {
    it('should get preference successfully', async () => {
      const mockPrefs = { currency: CURRENCIES.USD.code, userId: 'user1' };
      preferenceRepository.findByUserId.mockResolvedValue(mockPrefs);

      const result = await getPreference('user1');

      expect(preferenceRepository.findByUserId).toHaveBeenCalledWith('user1');
      expect(result).toEqual(mockPrefs);
    });

    it('should throw error if preference not found', async () => {
      preferenceRepository.findByUserId.mockResolvedValue(null);
      await expect(getPreference('user1')).rejects.toThrow(ApiError);
    });

    it('should update preference successfully', async () => {
      const mockPrefs = { currency: CURRENCIES.EUR.code, userId: 'user1' };
      preferenceRepository.upsertByUserId.mockResolvedValue(mockPrefs);

      const result = await updatePreference('user1', { currency: CURRENCIES.EUR.code });

      expect(preferenceRepository.upsertByUserId).toHaveBeenCalledWith('user1', { currency: CURRENCIES.EUR.code });
      expect(result).toEqual(mockPrefs);
    });
  });
});

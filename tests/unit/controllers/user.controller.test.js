import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/services/user.service.js', () => ({
  loginUser: jest.fn(),
  createUser: jest.fn(),
  findUserById: jest.fn(),
  updateUser: jest.fn()
}));

jest.unstable_mockModule('../../../src/utils/response.js', () => ({
  sendSuccess: jest.fn()
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

const { register, login, profile, updateProfile } = await import('../../../src/controllers/user.controller.js');
const userService = await import('../../../src/services/user.service.js');
const { sendSuccess } = await import('../../../src/utils/response.js');
const logger = (await import('../../../src/utils/logger.js')).default;

describe('Controller - User Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      user: {}
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      req.body = { name: 'John Doe', email: 'john@example.com', password: 'password123' };
      const mockResult = {
        user: { id: 'user_123', name: 'John Doe', email: 'john@example.com' },
        token: 'fake-jwt-token'
      };
      userService.createUser.mockResolvedValue(mockResult);

      // Act
      await register(req, res, next);

      // Assert
      expect(userService.createUser).toHaveBeenCalledWith(req.body);
      expect(logger.info).toHaveBeenCalledWith({ userId: 'user_123' }, 'New user registered');
      expect(sendSuccess).toHaveBeenCalledWith(res, {
        statusCode: 201,
        message: 'User registered successfully',
        data: mockResult,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if registration fails', async () => {
      // Arrange
      const error = new Error('Registration failed');
      userService.createUser.mockRejectedValue(error);

      // Act
      await register(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(sendSuccess).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should log in user successfully', async () => {
      // Arrange
      req.body = { email: 'john@example.com', password: 'password123' };
      const mockResult = {
        user: { id: 'user_123', name: 'John', email: 'john@example.com' },
        token: 'fake-jwt-token'
      };
      userService.loginUser.mockResolvedValue(mockResult);

      // Act
      await login(req, res, next);

      // Assert
      expect(userService.loginUser).toHaveBeenCalledWith(req.body);
      expect(logger.info).toHaveBeenCalledWith({ userId: 'user_123' }, 'User logged in');
      expect(sendSuccess).toHaveBeenCalledWith(res, {
        statusCode: 200,
        message: 'User logged in successfully',
        data: mockResult,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if login fails', async () => {
      // Arrange
      const error = new Error('Login failed');
      userService.loginUser.mockRejectedValue(error);

      // Act
      await login(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(sendSuccess).not.toHaveBeenCalled();
    });
  });

  describe('profile', () => {
    it('should fetch user profile successfully', async () => {
      // Arrange
      req.user = { id: 'user_123' };
      const mockResult = { id: 'user_123', name: 'John Doe', email: 'john@example.com' };
      userService.findUserById.mockResolvedValue(mockResult);

      // Act
      await profile(req, res, next);

      // Assert
      expect(userService.findUserById).toHaveBeenCalledWith('user_123');
      expect(sendSuccess).toHaveBeenCalledWith(res, {
        statusCode: 200,
        message: 'User profile fetched successfully',
        data: mockResult,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if fetching profile fails', async () => {
      // Arrange
      req.user = { id: 'user_123' };
      const error = new Error('Profile fetch failed');
      userService.findUserById.mockRejectedValue(error);

      // Act
      await profile(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(sendSuccess).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      req.user = { id: 'user_123' };
      req.body = { name: 'New Name' };
      const mockResult = { id: 'user_123', name: 'New Name', email: 'john@example.com' };
      userService.updateUser.mockResolvedValue(mockResult);

      // Act
      await updateProfile(req, res, next);

      // Assert
      expect(userService.updateUser).toHaveBeenCalledWith('user_123', req.body);
      expect(sendSuccess).toHaveBeenCalledWith(res, {
        statusCode: 200,
        message: 'User profile updated successfully',
        data: mockResult,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if update fails', async () => {
      // Arrange
      req.user = { id: 'user_123' };
      const error = new Error('Update failed');
      userService.updateUser.mockRejectedValue(error);

      // Act
      await updateProfile(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(sendSuccess).not.toHaveBeenCalled();
    });
  });
});

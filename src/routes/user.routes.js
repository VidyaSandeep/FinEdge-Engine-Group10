import express from 'express';
import * as userController from '../controllers/user.controller.js';
import validateUser from '../middleware/validateUser.middleware.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Register a new user
 *     description: >
 *       Creates a new user account with the provided credentials.
 *       A default `UserPreference` document (currency: USD) is created automatically.
 *       Returns the created user profile and a JWT token for immediate authentication.
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: "John Doe"
 *                 description: "User's full name (minimum 2 characters)"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *                 description: "Unique email address (case-insensitive)"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "securePass123"
 *                 description: "Account password (minimum 6 characters, stored hashed)"
 *     responses:
 *       201:
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "User registered successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                       description: "JWT token valid for 24 hours"
 *       400:
 *         description: Validation failed — missing or invalid fields.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already registered.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: DUPLICATE_ENTRY
 *               message: "Email already registered"
 */
router.post('/', validateUser.register, userController.register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Authenticate a user
 *     description: >
 *       Validates user credentials and returns a signed JWT token.
 *       The token expires after 24 hours and must be included in the
 *       `Authorization: Bearer <token>` header for protected endpoints.
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *                 description: "Registered email address"
 *               password:
 *                 type: string
 *                 minLength: 1
 *                 example: "securePass123"
 *                 description: "Account password"
 *     responses:
 *       200:
 *         description: Login successful — returns user profile and JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "User logged in successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string, example: "665a1b2c3d4e5f6a7b8c9d0e" }
 *                         name: { type: string, example: "John Doe" }
 *                         email: { type: string, example: "john@example.com" }
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                       description: "JWT token valid for 24 hours"
 *       400:
 *         description: Validation failed — missing or invalid fields.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid email or password.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: INVALID_CREDENTIALS
 *               message: "Invalid credentials"
 */
router.post('/login', validateUser.login, userController.login);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     description: >
 *       Returns the authenticated user's full profile including linked preferences.
 *       Requires a valid JWT token in the Authorization header.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "User profile fetched successfully" }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Missing or invalid JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found (account may have been deleted).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/profile', authMiddleware, userController.profile);

/**
 * @swagger
 * /api/users/profile:
 *   patch:
 *     summary: Update current user profile
 *     description: >
 *       Updates the authenticated user's profile information.
 *       Only the fields provided in the request body will be updated.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: "Jane Doe"
 *                 description: "Updated display name"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jane@example.com"
 *                 description: "Updated email address"
 *     responses:
 *       200:
 *         description: User profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "User profile updated successfully" }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation failed.
 *       401:
 *         description: Missing or invalid JWT token.
 */
router.patch('/profile', authMiddleware, validateUser.update, userController.updateProfile);

/**
 * @swagger
 * /api/users/profile:
 *   delete:
 *     summary: Permanently delete current user account
 *     description: >
 *       **Irreversible operation.** Permanently deletes the authenticated user's account
 *       and all associated data including transactions, budgets, and preferences.
 *       This operation runs inside a database transaction to ensure atomicity.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account and all related data deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "User account and all related data deleted successfully" }
 *                 data: { type: object, nullable: true, example: null }
 *       401:
 *         description: Missing or invalid JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/profile', authMiddleware, userController.permanentDeleteSelf);

/**
 * @swagger
 * /api/users/preference:
 *   get:
 *     summary: Get user preferences
 *     description: >
 *       Returns the authenticated user's application preferences
 *       (e.g., preferred currency for display).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "User preferences fetched successfully" }
 *                 data:
 *                   $ref: '#/components/schemas/UserPreference'
 *       401:
 *         description: Missing or invalid JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Preferences not found for this user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/preference', authMiddleware, userController.getPreference);

/**
 * @swagger
 * /api/users/preference:
 *   patch:
 *     summary: Update user preferences
 *     description: >
 *       Updates the authenticated user's application preferences.
 *       If no preference record exists, one is created automatically (upsert).
 *       Supported currencies: USD, GBP, EUR.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currency:
 *                 type: string
 *                 enum: [USD, GBP, EUR]
 *                 example: "GBP"
 *                 description: "Preferred currency code"
 *     responses:
 *       200:
 *         description: Preferences updated (or created) successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "User preferences updated successfully" }
 *                 data:
 *                   $ref: '#/components/schemas/UserPreference'
 *       401:
 *         description: Missing or invalid JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/preference', authMiddleware, userController.updatePreference);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update a specific user (Admin/Management)
 *     description: >
 *       Allows an authenticated user (typically admin) to update another user's profile fields.
 *       Only the fields provided in the request body will be updated.
 *       Unrecognized fields will cause a validation error (strict schema).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the user to update
 *         example: "665a1b2c3d4e5f6a7b8c9d0e"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: "Jane Doe"
 *                 description: "Updated display name"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jane@example.com"
 *                 description: "Updated email address"
 *               isActive:
 *                 type: boolean
 *                 example: false
 *                 description: "Set to false to deactivate the user"
 *     responses:
 *       200:
 *         description: User updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "User updated successfully" }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation failed — invalid or unrecognized fields.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Target user not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:id', authMiddleware, validateUser.update, userController.updateUser);

export default router;
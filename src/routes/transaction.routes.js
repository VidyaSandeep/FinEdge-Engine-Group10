import express from 'express';
import * as transactionController from '../controllers/transaction.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import validateTransaction from '../middleware/validateTransaction.middleware.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     description: >
 *       Records a new income or expense transaction for the authenticated user.
 *       If no `date` is provided, the current timestamp is used.
 *       If no `category` is provided, one may be auto-assigned by the categorizer service.
 *       Creating an expense transaction may trigger budget breach notifications.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: "expense"
 *                 description: "Transaction type"
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 45.99
 *                 description: "Transaction amount (must be positive)"
 *               category:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Food"
 *                 description: "Spending category (e.g., Food, Transportation, Entertainment)"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Lunch at downtown cafe"
 *                 description: "Optional note about the transaction"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-01T12:00:00Z"
 *                 description: "Transaction date (defaults to current time if omitted)"
 *     responses:
 *       201:
 *         description: Transaction recorded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Transaction recorded successfully" }
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation failed — invalid type, missing amount, etc.
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
 *   get:
 *     summary: Get all user transactions
 *     description: >
 *       Retrieves all transactions belonging to the authenticated user.
 *       Supports optional filtering by type, category, and date range.
 *       Results are sorted by date in descending order (newest first).
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: "Filter by transaction type"
 *         example: "expense"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: "Filter by category name (exact match)"
 *         example: "Food"
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: "Start of date range (inclusive, ISO 8601)"
 *         example: "2026-01-01"
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: "End of date range (inclusive, ISO 8601)"
 *         example: "2026-05-01"
 *     responses:
 *       200:
 *         description: List of matching transactions.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Transactions retrieved successfully" }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Missing or invalid JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', validateTransaction.create, transactionController.create);
router.get('/', transactionController.getAll);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     description: >
 *       Retrieves a single transaction by its ID.
 *       Only returns the transaction if it belongs to the authenticated user.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the transaction
 *         example: "665a1b2c3d4e5f6a7b8c9d0e"
 *     responses:
 *       200:
 *         description: Transaction details returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Transaction details fetched" }
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Missing or invalid JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Transaction not found or does not belong to this user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     summary: Update a transaction
 *     description: >
 *       Partially updates a transaction's fields.
 *       Only the fields included in the request body will be modified.
 *       The transaction must belong to the authenticated user.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the transaction to update
 *         example: "665a1b2c3d4e5f6a7b8c9d0e"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: "income"
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 100.00
 *               category:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Freelance"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Freelance project payment"
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Transaction updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Transaction updated successfully" }
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation failed on the update payload.
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
 *         description: Transaction not found or does not belong to this user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete a transaction
 *     description: >
 *       Permanently removes a transaction from the user's history.
 *       The transaction must belong to the authenticated user.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the transaction to delete
 *         example: "665a1b2c3d4e5f6a7b8c9d0e"
 *     responses:
 *       200:
 *         description: Transaction deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Transaction deleted successfully" }
 *                 data: { type: object, nullable: true, example: null }
 *       401:
 *         description: Missing or invalid JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Transaction not found or does not belong to this user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', transactionController.getById);
router.patch('/:id', validateTransaction.update, transactionController.update);
router.delete('/:id', transactionController.remove);

export default router;

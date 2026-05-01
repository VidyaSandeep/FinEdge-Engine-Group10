import express from 'express';
import { setBudget, list, remove } from '../controllers/budget.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/budgets:
 *   post:
 *     summary: Set a monthly budget goal
 *     description: >
 *       Creates or updates a budget goal for a specific month, year, and category.
 *       Uses upsert logic — if a budget already exists for the same user/month/year/category
 *       combination, it will be updated instead of duplicated.
 *       Set `category` to "All" for an overall monthly spending limit.
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [monthlyGoal]
 *             properties:
 *               monthlyGoal:
 *                 type: number
 *                 minimum: 0
 *                 example: 3000
 *                 description: "Target spending limit for the month"
 *               category:
 *                 type: string
 *                 example: "Food"
 *                 description: 'Budget category (defaults to "All" for overall budget)'
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 5
 *                 description: "Target month (1–12, defaults to current month)"
 *               year:
 *                 type: integer
 *                 minimum: 2000
 *                 example: 2026
 *                 description: "Target year (defaults to current year)"
 *               savingsTarget:
 *                 type: number
 *                 minimum: 0
 *                 example: 500
 *                 description: "Optional monthly savings goal (defaults to 0)"
 *     responses:
 *       201:
 *         description: Budget goal created or updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Budget goal updated" }
 *                 data:
 *                   $ref: '#/components/schemas/Budget'
 *       400:
 *         description: Validation failed — invalid monthlyGoal, month, or year.
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
 *     summary: Get user budgets
 *     description: >
 *       Retrieves all budget goals for the authenticated user.
 *       Optionally filter by month and year to retrieve budgets for a specific period.
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: "Filter by month (1–12)"
 *         example: 5
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2000
 *         description: "Filter by year"
 *         example: 2026
 *     responses:
 *       200:
 *         description: List of budget goals matching the filters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Budgets retrieved successfully" }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Budget'
 *       401:
 *         description: Missing or invalid JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * /api/budgets/{id}:
 *   delete:
 *     summary: Delete a budget goal
 *     description: >
 *       Permanently removes a budget goal by its ID.
 *       The budget must belong to the authenticated user.
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the budget to delete
 *         example: "665a1b2c3d4e5f6a7b8c9d0e"
 *     responses:
 *       200:
 *         description: Budget goal deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Budget goal deleted" }
 *                 data: { type: object, nullable: true, example: null }
 *       401:
 *         description: Missing or invalid JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Budget not found or does not belong to this user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', setBudget);
router.get('/', list);
router.delete('/:id', remove);

export default router;

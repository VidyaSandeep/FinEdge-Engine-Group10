import express from 'express';
import * as summaryController from '../controllers/summary.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/summary:
 *   get:
 *     summary: Get financial summary (snapshot)
 *     description: >
 *       Generates a comprehensive financial snapshot for the authenticated user.
 *       Includes total income, total expenses, net balance, per-category spending breakdown,
 *       active budget goals, and AI-generated saving tips based on spending vs. budget.
 *
 *
 *       If no `month`/`year` is specified, defaults to the current month.
 *       Alternatively, use `fromDate`/`toDate` for custom date-range filtering.
 *       Results are cached for 2 minutes per unique filter combination.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: "Filter by month (1–12, defaults to current month)"
 *         example: 5
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2000
 *         description: "Filter by year (defaults to current year)"
 *         example: 2026
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: "Filter transactions by spending category"
 *         example: "Food"
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: "Custom range start date (ISO 8601, overrides month/year)"
 *         example: "2026-01-01"
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: "Custom range end date (ISO 8601, overrides month/year)"
 *         example: "2026-05-31"
 *     responses:
 *       200:
 *         description: Financial summary generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Financial summary generated successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         year: { type: integer, example: 2026 }
 *                         month: { type: integer, example: 5 }
 *                     totals:
 *                       type: object
 *                       properties:
 *                         income: { type: number, example: 5000.00, description: "Total income for the period" }
 *                         expenses: { type: number, example: 3200.50, description: "Total expenses for the period" }
 *                         balance: { type: number, example: 1799.50, description: "Net balance (income − expenses)" }
 *                     categorySpending:
 *                       type: array
 *                       description: "Expense breakdown by category"
 *                       items:
 *                         type: object
 *                         properties:
 *                           category: { type: string, example: "Food" }
 *                           amount: { type: number, example: 850.00 }
 *                     budgets:
 *                       type: array
 *                       description: "Active budget goals for the period"
 *                       items:
 *                         $ref: '#/components/schemas/Budget'
 *                     savingTips:
 *                       type: array
 *                       description: "Context-aware saving recommendations based on spending patterns"
 *                       items:
 *                         type: string
 *                       example:
 *                         - "Great job! You are well within your budget this month."
 *                         - "Tip: Food expenses are high. Meal prepping could save you significantly."
 *       401:
 *         description: Missing or invalid JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', summaryController.getSummary);

/**
 * @swagger
 * /api/summary/trends:
 *   get:
 *     summary: Get historical monthly trends
 *     description: >
 *       Returns monthly income, expense, and savings data for the last N months.
 *       Useful for charting spending patterns over time.
 *       Results are ordered from oldest to newest and cached for 5 minutes.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *           minimum: 1
 *           maximum: 24
 *         description: "Number of months to return (defaults to 6)"
 *         example: 6
 *     responses:
 *       200:
 *         description: Historical trend data returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Financial trends retrieved successfully" }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                         example: "2026-01"
 *                         description: "Year-month identifier (YYYY-MM)"
 *                       income:
 *                         type: number
 *                         example: 5000.00
 *                         description: "Total income for that month"
 *                       expenses:
 *                         type: number
 *                         example: 3200.50
 *                         description: "Total expenses for that month"
 *                       savings:
 *                         type: number
 *                         example: 1799.50
 *                         description: "Net savings (income − expenses)"
 *       401:
 *         description: Missing or invalid JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/trends', summaryController.getTrends);

export default router;

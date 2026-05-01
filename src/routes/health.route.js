import express from 'express';
import * as healthController from '../controllers/health.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: System health check
 *     description: >
 *       Returns the current health status of the FinEdge API service
 *       including application uptime and database connectivity.
 *       This endpoint does **not** require authentication.
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy and all dependencies are reachable.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Service is healthy" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     healthy: { type: boolean, example: true }
 *                     app: { type: string, example: "up" }
 *                     db: { type: string, example: "connected", description: "MongoDB connection state" }
 *                     timestamp: { type: string, format: date-time }
 *       503:
 *         description: Service is unhealthy — database or a critical dependency is unreachable.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: SERVICE_UNHEALTHY
 *               message: "Service is unhealthy"
 */
router.get('/', healthController.getHealth);

export default router;
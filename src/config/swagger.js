import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'FinEdge API',
            version: '1.0.0',
            description:
                'Professional Personal Finance & Expense Tracker API.\n\n' +
                'FinEdge helps users track income and expenses, set budget goals, ' +
                'receive AI-powered saving tips, and visualize spending trends over time.\n\n' +
                '## Authentication\n' +
                'Most endpoints require a JWT Bearer token obtained via `POST /api/users/login`.\n' +
                'Include the token in the `Authorization` header as `Bearer <token>`.',
            contact: {
                name: 'Group 10',
            },
            license: {
                name: 'ISC',
            },
        },
        servers: [
            {
                url: `http://localhost:${env.PORT}`,
                description: 'Development server',
            },
        ],
        tags: [
            { name: 'System', description: 'Health checks and service status' },
            { name: 'Users', description: 'User registration, authentication, and profile management' },
            { name: 'Transactions', description: 'Income and expense tracking' },
            { name: 'Budgets', description: 'Monthly budget goal management' },
            { name: 'Analytics', description: 'Financial summaries, trends, and saving tips' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token obtained from the login endpoint',
                },
            },
            schemas: {
                // ── Standard Response Envelopes ──
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Operation completed successfully' },
                        data: { type: 'object', nullable: true, description: 'Response payload' },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        code: { type: 'string', example: 'VALIDATION_ERROR', description: 'Machine-readable error code' },
                        message: { type: 'string', example: 'Validation failed' },
                        errors: {
                            type: 'array',
                            nullable: true,
                            description: 'Field-level validation errors (present only for validation failures)',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string', example: 'email' },
                                    message: { type: 'string', example: 'Invalid email format' },
                                },
                            },
                        },
                    },
                },

                // ── Domain Models ──
                User: {
                    type: 'object',
                    description: 'User profile as returned by the repository domain mapper',
                    properties: {
                        id: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', format: 'email', example: 'john@example.com' },
                        isActive: { type: 'boolean', example: true },
                        preferences: {
                            type: 'object',
                            nullable: true,
                            description: 'Populated user preferences (null if not yet created)',
                            properties: {
                                id: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
                                currency: { type: 'string', example: 'USD' },
                            },
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Transaction: {
                    type: 'object',
                    description: 'Transaction record as returned by the repository domain mapper',
                    properties: {
                        id: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
                        userId: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
                        type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
                        category: { type: 'string', example: 'Food', maxLength: 100 },
                        amount: { type: 'number', minimum: 0, example: 45.99 },
                        date: { type: 'string', format: 'date-time' },
                        description: { type: 'string', example: 'Lunch at cafe', maxLength: 500 },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Budget: {
                    type: 'object',
                    description: 'Budget goal as returned by the repository domain mapper',
                    properties: {
                        id: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
                        userId: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
                        category: { type: 'string', example: 'All', description: 'Budget category (\"All\" for overall budget)' },
                        month: { type: 'integer', minimum: 1, maximum: 12, example: 5 },
                        year: { type: 'integer', minimum: 2000, example: 2026 },
                        monthlyGoal: { type: 'number', minimum: 0, example: 3000 },
                        savingsTarget: { type: 'number', minimum: 0, example: 500 },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                UserPreference: {
                    type: 'object',
                    description: 'User preference document (returned as raw Mongoose lean object from standalone preference endpoints)',
                    properties: {
                        id: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e', description: 'MongoDB ObjectId (note: standalone preference endpoints return _id, not id)' },
                        userId: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
                        currency: { type: 'string', example: 'USD', description: 'Preferred currency code (USD, GBP, EUR)' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let mongoServer;
let app;
let token;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-budgets';
    process.env.JWT_SECRET = 'supersecret_for_tests';
    process.env.PORT = '3000';
    process.env.LOG_LEVEL = 'fatal';

    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    const appModule = await import('../../../src/app.js');
    app = appModule.default;

    // Seed user and get token
    const userPayload = {
        name: 'Budget User',
        email: 'budget@example.com',
        password: 'password123'
    };
    await request(app).post('/api/users').send(userPayload);
    const loginRes = await request(app).post('/api/users/login').send({
        email: userPayload.email,
        password: userPayload.password
    });
    token = loginRes.body.data.token;
});

afterAll(async () => {
    if (mongoose.connection.readyState) {
        await mongoose.connection.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
    // Give a small grace period for any background event listeners to finish
    await new Promise(resolve => setTimeout(resolve, 300));
});

afterEach(async () => {
    if (mongoose.connection.readyState && mongoose.connection.collections['budgets']) {
        await mongoose.connection.collections['budgets'].deleteMany({});
    }
});

describe('Integration - Budget Routes', () => {
    const validBudget = {
        monthlyGoal: 5000,
        month: 5,
        year: 2026,
        category: 'All'
    };

    describe('POST /api/budgets', () => {
        it('should create a budget successfully', async () => {
            const response = await request(app)
                .post('/api/budgets')
                .set('Authorization', `Bearer ${token}`)
                .send(validBudget);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.monthlyGoal).toBe(5000);
            expect(response.body.data.month).toBe(5);
            expect(response.body.data.year).toBe(2026);
        });

        it('should upsert (update existing) budget for same period', async () => {
            // First create
            await request(app).post('/api/budgets')
                .set('Authorization', `Bearer ${token}`)
                .send(validBudget);

            // Upsert same period with new goal
            const response = await request(app)
                .post('/api/budgets')
                .set('Authorization', `Bearer ${token}`)
                .send({ ...validBudget, monthlyGoal: 8000 });

            expect(response.status).toBe(201);
            expect(response.body.data.monthlyGoal).toBe(8000);
        });

        it('should fail if unauthenticated', async () => {
            const response = await request(app)
                .post('/api/budgets')
                .send(validBudget);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/budgets', () => {
        beforeEach(async () => {
            await request(app).post('/api/budgets')
                .set('Authorization', `Bearer ${token}`)
                .send({ monthlyGoal: 5000, month: 5, year: 2026, category: 'All' });
            await request(app).post('/api/budgets')
                .set('Authorization', `Bearer ${token}`)
                .send({ monthlyGoal: 2000, month: 4, year: 2026, category: 'Food' });
        });

        it('should fetch all user budgets', async () => {
            const response = await request(app)
                .get('/api/budgets')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });
    });

    describe('DELETE /api/budgets/:id', () => {
        let budgetId;

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/budgets')
                .set('Authorization', `Bearer ${token}`)
                .send(validBudget);
            budgetId = res.body.data.id;
        });

        it('should delete a budget successfully', async () => {
            const response = await request(app)
                .delete(`/api/budgets/${budgetId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Budget goal deleted');

            // Verify it's gone
            const listRes = await request(app)
                .get('/api/budgets')
                .set('Authorization', `Bearer ${token}`);
            expect(listRes.body.data).toHaveLength(0);
        });
    });
});

import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let mongoServer;
let app;
let token;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-summary';
    process.env.JWT_SECRET = 'supersecret_for_tests';
    process.env.PORT = '3000';
    process.env.LOG_LEVEL = 'fatal';

    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    const appModule = await import('../../../src/app.js');
    app = appModule.default;

    // Seed user and get token
    await request(app).post('/api/users').send({
        name: 'Summary User',
        email: 'summary@example.com',
        password: 'password123'
    });
    const loginRes = await request(app).post('/api/users/login').send({
        email: 'summary@example.com',
        password: 'password123'
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

describe('Integration - Summary Routes', () => {
    beforeEach(async () => {
        // Seed some transactions for summary data
        await request(app).post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 5000, type: 'income', category: 'Salary', description: 'Monthly salary' });
        await request(app).post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 1500, type: 'expense', category: 'Food', description: 'Groceries' });
    });

    describe('GET /api/summary', () => {
        it('should return financial summary', async () => {
            const response = await request(app)
                .get('/api/summary')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.totals).toBeDefined();
            expect(response.body.data.totals.income).toBeGreaterThanOrEqual(5000);
            expect(response.body.data.categorySpending).toBeDefined();
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/summary');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/summary/trends', () => {
        it('should return monthly trends', async () => {
            const response = await request(app)
                .get('/api/summary/trends')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0]).toHaveProperty('month');
            expect(response.body.data[0]).toHaveProperty('income');
            expect(response.body.data[0]).toHaveProperty('expenses');
            expect(response.body.data[0]).toHaveProperty('savings');
        });

        it('should accept custom limit parameter', async () => {
            const response = await request(app)
                .get('/api/summary/trends?limit=3')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(3);
        });
    });
});

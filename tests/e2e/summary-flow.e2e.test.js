import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
let app;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/e2e-test-summary';
    process.env.JWT_SECRET = 'e2e_super_secret_jwt';
    process.env.PORT = '3000';
    process.env.LOG_LEVEL = 'fatal';

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    const appModule = await import('../../src/app.js');
    app = appModule.default;
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

describe('E2E - Summary Flow', () => {
    it('should complete full analytics journey: register -> add transactions -> set budget -> get summary with tips -> get trends', async () => {
        // 1. Register and Login
        const testUser = {
            name: 'Analytics E2E User',
            email: 'analytics.e2e@example.com',
            password: 'password123'
        };

        await request(app).post('/api/users').send(testUser);
        const loginRes = await request(app).post('/api/users/login').send({
            email: testUser.email,
            password: testUser.password
        });
        const token = loginRes.body.data.token;

        // 2. Create transactions
        await request(app).post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 8000, type: 'income', category: 'Salary', description: 'Monthly salary' });

        await request(app).post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 2500, type: 'expense', category: 'Food', description: 'Groceries for the month' });

        await request(app).post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 1000, type: 'expense', category: 'Utilities', description: 'Electric bill' });

        // 3. Set a budget goal
        const now = new Date();
        await request(app).post('/api/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send({
                monthlyGoal: 4000,
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                category: 'All'
            });

        // 4. Get financial summary — should include saving tips
        const summaryRes = await request(app)
            .get('/api/summary')
            .set('Authorization', `Bearer ${token}`);

        expect(summaryRes.status).toBe(200);
        expect(summaryRes.body.data.totals.income).toBe(8000);
        expect(summaryRes.body.data.totals.expenses).toBe(3500);
        expect(summaryRes.body.data.totals.balance).toBe(4500);
        expect(summaryRes.body.data.savingTips.length).toBeGreaterThan(0);

        // 5. Get trends
        const trendsRes = await request(app)
            .get('/api/summary/trends?limit=1')
            .set('Authorization', `Bearer ${token}`);

        expect(trendsRes.status).toBe(200);
        expect(trendsRes.body.data).toHaveLength(1);
        expect(trendsRes.body.data[0].income).toBe(8000);
        expect(trendsRes.body.data[0].expenses).toBe(3500);
        expect(trendsRes.body.data[0].savings).toBe(4500);
    });
});

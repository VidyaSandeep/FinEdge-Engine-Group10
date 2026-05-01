import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
let app;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/e2e-test-budgets';
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

describe('E2E - Budget Flow', () => {
    it('should complete full budget journey: register -> login -> set budget -> list budgets', async () => {
        // 1. Register and Login
        const testUser = {
            name: 'Budget E2E User',
            email: 'budget.e2e@example.com',
            password: 'password123'
        };

        await request(app).post('/api/users').send(testUser);
        const loginRes = await request(app).post('/api/users/login').send({
            email: testUser.email,
            password: testUser.password
        });

        const token = loginRes.body.data.token;
        expect(token).toBeDefined();

        // 2. Set a Budget Goal
        const budgetPayload = {
            monthlyGoal: 5000,
            month: 5,
            year: 2026,
            category: 'All'
        };

        const createRes = await request(app)
            .post('/api/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send(budgetPayload);

        expect(createRes.status).toBe(201);
        expect(createRes.body.data.monthlyGoal).toBe(5000);

        // 3. Set a Category-specific Budget
        const categoryBudget = {
            monthlyGoal: 1500,
            month: 5,
            year: 2026,
            category: 'Food'
        };

        const catRes = await request(app)
            .post('/api/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send(categoryBudget);

        expect(catRes.status).toBe(201);
        expect(catRes.body.data.category).toBe('Food');

        // 4. List All Budgets
        const listRes = await request(app)
            .get('/api/budgets')
            .set('Authorization', `Bearer ${token}`);

        expect(listRes.status).toBe(200);
        expect(listRes.body.data).toHaveLength(2);

        // 5. Update an existing budget (upsert)
        const updateRes = await request(app)
            .post('/api/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...budgetPayload, monthlyGoal: 7000 });

        expect(updateRes.status).toBe(201);
        expect(updateRes.body.data.monthlyGoal).toBe(7000);

        // 6. Verify the count didn't change (upsert, not new insert)
        const finalListRes = await request(app)
            .get('/api/budgets')
            .set('Authorization', `Bearer ${token}`);

        expect(finalListRes.body.data).toHaveLength(2);

        // 7. Delete a budget
        const budgetToDeleteId = finalListRes.body.data[0].id;
        const deleteRes = await request(app)
            .delete(`/api/budgets/${budgetToDeleteId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.message).toBe('Budget goal deleted');

        // 8. Verify deletion
        const afterDeleteRes = await request(app)
            .get('/api/budgets')
            .set('Authorization', `Bearer ${token}`);
        expect(afterDeleteRes.body.data).toHaveLength(1);
    });
});

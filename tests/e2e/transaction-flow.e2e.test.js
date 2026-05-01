import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let mongoServer;
let app;

beforeAll(async () => {
    // Setup environment
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/e2e-test-transactions';
    process.env.JWT_SECRET = 'e2e_super_secret_jwt';
    process.env.PORT = '3000';
    process.env.LOG_LEVEL = 'fatal';

    // Start in-memory DB (ReplicaSet for transaction support)
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Load Express app dynamically
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

describe('E2E - Transaction Flow', () => {
    it('should complete full transaction journey', async () => {
        // 1. Register and Login to get Token
        const testUser = {
            name: 'Transaction E2E User',
            email: 'tx.e2e@example.com',
            password: 'password123'
        };

        await request(app).post('/api/users').send(testUser);
        const loginRes = await request(app).post('/api/users/login').send({
            email: testUser.email,
            password: testUser.password
        });

        const token = loginRes.body.data.token;
        expect(token).toBeDefined();

        // 2. Create an Income Transaction
        const incomeTx = {
            amount: 5000,
            type: 'income',
            category: 'Salary',
            description: 'Monthly Salary'
        };

        const createIncomeRes = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send(incomeTx);

        expect(createIncomeRes.status).toBe(201);
        expect(createIncomeRes.body.data.category).toBe('Salary');

        // 3. Create an Expense Transaction
        const expenseTx = {
            amount: 250,
            type: 'expense',
            description: 'Bought groceries from Walmart' // Should be auto-categorized if we rely on descriptions
        };

        const createExpenseRes = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send(expenseTx);

        expect(createExpenseRes.status).toBe(201);
        const expenseId = createExpenseRes.body.data.id;
        expect(expenseId).toBeDefined();

        // 4. Fetch All Transactions
        const fetchAllRes = await request(app)
            .get('/api/transactions')
            .set('Authorization', `Bearer ${token}`);

        expect(fetchAllRes.status).toBe(200);
        expect(fetchAllRes.body.data).toHaveLength(2);

        // 5. Update the Expense Transaction
        const updateRes = await request(app)
            .patch(`/api/transactions/${expenseId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 300, type: 'expense' });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.data.amount).toBe(300);

        // 6. Delete the Expense Transaction
        const deleteRes = await request(app)
            .delete(`/api/transactions/${expenseId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.success).toBe(true);

        // 7. Verify Deletion
        const finalFetchRes = await request(app)
            .get('/api/transactions')
            .set('Authorization', `Bearer ${token}`);

        expect(finalFetchRes.status).toBe(200);
        expect(finalFetchRes.body.data).toHaveLength(1); // Only the income tx remains

        // 8. Test Filtering
        // Add another transaction first
        await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 100, type: 'expense', category: 'Food', description: 'Lunch' });

        const filterRes = await request(app)
            .get('/api/transactions?type=income')
            .set('Authorization', `Bearer ${token}`);

        expect(filterRes.body.data).toHaveLength(1);
        expect(filterRes.body.data[0].type).toBe('income');

        const filterRes2 = await request(app)
            .get('/api/transactions?category=Food')
            .set('Authorization', `Bearer ${token}`);
        expect(filterRes2.body.data).toHaveLength(1);
        expect(filterRes2.body.data[0].category).toBe('Food');
    });
});

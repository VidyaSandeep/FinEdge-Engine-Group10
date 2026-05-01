import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let mongoServer;
let app;
let token;
let userId;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-transactions';
    process.env.JWT_SECRET = 'supersecret_for_tests';
    process.env.PORT = '3000';
    process.env.LOG_LEVEL = 'fatal';

    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    const appModule = await import('../../../src/app.js');
    app = appModule.default;

    // Seed a user and get token for transaction auth
    const userPayload = {
        name: 'Transaction User',
        email: 'transaction@example.com',
        password: 'password123'
    };
    await request(app).post('/api/users').send(userPayload);
    const loginRes = await request(app).post('/api/users/login').send({
        email: userPayload.email,
        password: userPayload.password
    });
    token = loginRes.body.data.token;
    userId = loginRes.body.data.user.id;
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
    if (mongoose.connection.readyState) {
        // Clear transactions collection only
        await mongoose.connection.collections['transactions'].deleteMany({});
    }
});

describe('Integration - Transaction Routes', () => {
    const validTransaction = {
        amount: 150.5,
        type: 'expense',
        category: 'Utilities',
        description: 'Electric Bill',
        date: new Date().toISOString()
    };

    describe('POST /api/transactions', () => {
        it('should create a transaction successfully', async () => {
            const response = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(validTransaction);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.amount).toBe(150.5);
            expect(response.body.data.category).toBe('Utilities');
        });

        it('should create a transaction successfully with YYYY-MM-DD date', async () => {
            const payload = {
                ...validTransaction,
                date: '2026-05-01'
            };

            const response = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(new Date(response.body.data.date).toISOString().split('T')[0]).toBe('2026-05-01');
        });

        it('should fail if unauthenticated', async () => {
            const response = await request(app)
                .post('/api/transactions')
                .send(validTransaction);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should fail validation if missing amount', async () => {
            const invalidPayload = { ...validTransaction };
            delete invalidPayload.amount;

            const response = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(invalidPayload);

            expect(response.status).toBe(400); // Validation error
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/transactions', () => {
        beforeEach(async () => {
            // Seed multiple transactions
            await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
                .send({ amount: 100, type: 'income', category: 'Salary' });
            await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
                .send({ amount: 50, type: 'expense', category: 'Food' });
        });

        it('should fetch all user transactions', async () => {
            const response = await request(app)
                .get('/api/transactions')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });
    });

    describe('GET /api/transactions/:id', () => {
        let transactionId;

        beforeEach(async () => {
            const res = await request(app).post('/api/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(validTransaction);
            transactionId = res.body.data.id;
        });

        it('should fetch a specific transaction by id', async () => {
            const response = await request(app)
                .get(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(transactionId);
        });

        it('should fail if transaction does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const response = await request(app)
                .get(`/api/transactions/${fakeId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('PATCH /api/transactions/:id', () => {
        let transactionId;

        beforeEach(async () => {
            const res = await request(app).post('/api/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(validTransaction);
            transactionId = res.body.data.id;
        });

        it('should update a transaction successfully', async () => {
            const response = await request(app)
                .patch(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 200, type: 'expense', category: 'Updated Category' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.amount).toBe(200);
            expect(response.body.data.category).toBe('Updated Category');
        });

        it('should partially update a transaction successfully', async () => {
            const response = await request(app)
                .patch(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 50, description: 'Updated lunch amount' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.amount).toBe(50);
            expect(response.body.data.description).toBe('Updated lunch amount');
            // type should remain unchanged
            expect(response.body.data.type).toBe(validTransaction.type);
        });
    });

    describe('DELETE /api/transactions/:id', () => {
        let transactionId;

        beforeEach(async () => {
            const res = await request(app).post('/api/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(validTransaction);
            transactionId = res.body.data.id;
        });

        it('should delete a transaction successfully', async () => {
            const response = await request(app)
                .delete(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify it's gone
            const fetchRes = await request(app)
                .get(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${token}`);
            expect(fetchRes.status).toBe(404);
        });
    });
});

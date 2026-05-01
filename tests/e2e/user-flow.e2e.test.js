import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { CURRENCIES } from '../../src/constants/constants.js';

let mongoServer;
let app;

beforeAll(async () => {
    // Setup environment
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/e2e-test';
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

describe('E2E - User Flow', () => {
    it('should complete full user journey: register -> login -> profile', async () => {
        const testUser = {
            name: 'Jane Doe',
            email: 'jane.doe.e2e@example.com',
            password: 'securepassword123'
        };

        // Step 1: Register User
        const registerResponse = await request(app)
            .post('/api/users')
            .send(testUser);

        expect(registerResponse.status).toBe(201);
        expect(registerResponse.body.success).toBe(true);
        expect(registerResponse.body.data.user.email).toBe(testUser.email);

        // Wait, the API might auto-login and return a token on register
        const registerToken = registerResponse.body.data.token;
        expect(registerToken).toBeDefined();

        // Step 2: Login User
        const loginResponse = await request(app)
            .post('/api/users/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.success).toBe(true);
        expect(loginResponse.body.data.user.email).toBe(testUser.email);

        const loginToken = loginResponse.body.data.token;
        expect(loginToken).toBeDefined();

        // Step 3: Fetch Profile
        const profileResponse = await request(app)
            .get('/api/users/profile')
            .set('Authorization', `Bearer ${loginToken}`);

        expect(profileResponse.status).toBe(200);
        expect(profileResponse.body.success).toBe(true);
        expect(profileResponse.body.data.email).toBe(testUser.email);
        expect(profileResponse.body.data.name).toBe(testUser.name);
        expect(profileResponse.body.data.isActive).toBe(true);

        // Ensure sensitive fields are not exposed
        expect(profileResponse.body.data.password).toBeUndefined();
        expect(profileResponse.body.data.passwordHash).toBeUndefined();

        // Step 4: Check Preferences (auto-created)
        const prefResponse = await request(app)
            .get('/api/users/preference')
            .set('Authorization', `Bearer ${loginToken}`);
        expect(prefResponse.status).toBe(200);
        expect(prefResponse.body.data.currency).toBe(CURRENCIES.USD.code);

        // Step 5: Update Preferences
        const updatePrefRes = await request(app)
            .patch('/api/users/preference')
            .set('Authorization', `Bearer ${loginToken}`)
            .send({ currency: CURRENCIES.GBP.code });
        expect(updatePrefRes.status).toBe(200);
        expect(updatePrefRes.body.data.currency).toBe(CURRENCIES.GBP.code);
    });
});

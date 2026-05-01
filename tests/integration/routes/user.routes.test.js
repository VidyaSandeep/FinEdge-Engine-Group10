import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { CURRENCIES } from '../../../src/constants/constants.js';

let mongoServer;
let app;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.JWT_SECRET = 'supersecret_for_tests';
    process.env.PORT = '3000';
    process.env.LOG_LEVEL = 'fatal';

    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    const appModule = await import('../../../src/app.js');
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

afterEach(async () => {
    if (mongoose.connection.readyState) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    }
});

describe('Integration - User Routes', () => {
    describe('POST /api/users', () => {
        it('should register a new user successfully', async () => {
            const payload = {
                name: 'Integration User',
                email: 'integration@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/users')
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('integration@example.com');
            expect(response.body.data.user.name).toBe('Integration User');
            // Check preferences initialization
            expect(response.body.data.user.preferences).toBeDefined();
            expect(response.body.data.user.preferences.currency).toBe(CURRENCIES.USD.code);
            expect(response.body.data.token).toBeDefined();
        });

        it('should fail if email is already registered', async () => {
            const payload = {
                name: 'Duplicate User',
                email: 'duplicate@example.com',
                password: 'password123'
            };

            // First registration
            await request(app).post('/api/users').send(payload);

            // Second registration
            const response = await request(app)
                .post('/api/users')
                .send(payload);

            expect(response.status).toBe(409); // Assuming DUPLICATE_ENTRY maps to 409
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('DUPLICATE_ENTRY');
        });

        it('should fail validation if password is missing', async () => {
            const payload = {
                name: 'No Password User',
                email: 'nopassword@example.com'
                // password omitted
            };

            const response = await request(app)
                .post('/api/users')
                .send(payload);

            if (response.status !== 400) console.log(response.body);
            expect(response.status).toBe(400); // Validation error
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/users/login', () => {
        beforeEach(async () => {
            // Seed a user for login tests
            await request(app)
                .post('/api/users')
                .send({
                    name: 'Login Test User',
                    email: 'login@example.com',
                    password: 'password123'
                });
        });

        it('should login user successfully with valid credentials', async () => {
            const payload = {
                email: 'login@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/users/login')
                .send(payload);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('login@example.com');
            expect(response.body.data.token).toBeDefined();
        });

        it('should fail login with incorrect password', async () => {
            const payload = {
                email: 'login@example.com',
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/api/users/login')
                .send(payload);

            expect(response.status).toBe(401); // Assuming INVALID_CREDENTIALS maps to 401
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('INVALID_CREDENTIALS');
        });

        it('should fail login with non-existent email', async () => {
            const payload = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/users/login')
                .send(payload);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('INVALID_CREDENTIALS');
        });
    });

    describe('GET /api/users/profile', () => {
        let token;

        beforeEach(async () => {
            // Register and login to get a valid token
            const payload = {
                name: 'Profile Test User',
                email: 'profile@example.com',
                password: 'password123'
            };

            await request(app).post('/api/users').send(payload);
            const loginRes = await request(app).post('/api/users/login').send({
                email: 'profile@example.com',
                password: 'password123'
            });
            token = loginRes.body.data.token;
        });

        it('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe('profile@example.com');
            expect(response.body.data.name).toBe('Profile Test User');
            expect(response.body.data.preferences).toBeDefined();
            expect(response.body.data.preferences.currency).toBe(CURRENCIES.USD.code);
            expect(response.body.data.password).toBeUndefined(); // Ensure password is not exposed
        });

        it('should fail to get profile without token', async () => {
            const response = await request(app)
                .get('/api/users/profile');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('UNAUTHORIZED');
        });

        it('should fail to get profile with invalid token', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', 'Bearer invalidtoken');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('UNAUTHORIZED');
        });
    });

    describe('PATCH /api/users/profile', () => {
        let token;

        beforeEach(async () => {
            const payload = {
                name: 'Update Test User',
                email: 'update@example.com',
                password: 'password123'
            };

            await request(app).post('/api/users').send(payload);
            const loginRes = await request(app).post('/api/users/login').send({
                email: 'update@example.com',
                password: 'password123'
            });
            token = loginRes.body.data.token;
        });

        it('should update user profile successfully', async () => {
            const response = await request(app)
                .patch('/api/users/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Updated Name' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User profile updated successfully');
            expect(response.body.data.name).toBe('Updated Name');
        });

        it('should fail validation if name is too short', async () => {
            const response = await request(app)
                .patch('/api/users/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'a' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('INVALID_INPUT');
        });

        it('should fail if unauthorized', async () => {
            const response = await request(app)
                .patch('/api/users/profile')
                .send({ name: 'New Name' });

            expect(response.status).toBe(401);
        });
    });

    describe('User Preferences /api/users/preference', () => {
        let token;

        beforeEach(async () => {
            const payload = {
                name: 'Pref Test User',
                email: 'pref@example.com',
                password: 'password123'
            };
            await request(app).post('/api/users').send(payload);
            const loginRes = await request(app).post('/api/users/login').send({
                email: 'pref@example.com',
                password: 'password123'
            });
            token = loginRes.body.data.token;
        });

        it('should get user preference', async () => {
            const response = await request(app)
                .get('/api/users/preference')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.currency).toBe(CURRENCIES.USD.code);
        });

        it('should update user preference', async () => {
            const response = await request(app)
                .patch('/api/users/preference')
                .set('Authorization', `Bearer ${token}`)
                .send({ currency: CURRENCIES.EUR.code });

            expect(response.status).toBe(200);
            expect(response.body.data.currency).toBe(CURRENCIES.EUR.code);

            // Verify via profile too
            const profileRes = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${token}`);
            expect(profileRes.body.data.preferences.currency).toBe(CURRENCIES.EUR.code);
        });
    });
});

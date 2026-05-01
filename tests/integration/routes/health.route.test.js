import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
let app;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-health';
    process.env.JWT_SECRET = 'supersecret_for_tests';
    process.env.PORT = '3000';
    process.env.LOG_LEVEL = 'fatal';

    mongoServer = await MongoMemoryServer.create();
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

describe('Integration - Health Route', () => {
    describe('GET /api/health', () => {
        it('should return 200 with health data when DB is connected', async () => {
            const response = await request(app)
                .get('/api/health');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.healthy).toBe(true);
            expect(response.body.data.app).toBe('up');
            expect(response.body.data.timestamp).toBeDefined();
        });

        it('should return a valid ISO timestamp', async () => {
            const response = await request(app)
                .get('/api/health');

            const timestamp = new Date(response.body.data.timestamp);
            expect(timestamp.toISOString()).toBe(response.body.data.timestamp);
        });
    });
});

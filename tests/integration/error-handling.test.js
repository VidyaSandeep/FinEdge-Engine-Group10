import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
let app;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-errors';
    process.env.JWT_SECRET = 'supersecret_for_tests';
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

describe('Integration - Global Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
        const response = await request(app).get('/api/this-route-does-not-exist');
        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('not found');
    });

    it('should return 400 for malformed JSON in requests', async () => {
        const response = await request(app)
            .post('/api/users')
            .set('Content-Type', 'application/json')
            .send('{"name": "invalid json"'); // Missing closing brace

        // Express body-parser usually returns 400 for invalid JSON
        expect(response.status).toBe(400);
    });
});

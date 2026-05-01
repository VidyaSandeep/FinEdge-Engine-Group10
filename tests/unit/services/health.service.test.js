import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/datasource/mongo.datasource.js', () => ({
  pingDb: jest.fn(),
  connectDb: jest.fn(),
  getDbReadyState: jest.fn()
}));

const { pingDb } = await import('../../../src/datasource/mongo.datasource.js');
const { healthService } = await import('../../../src/services/health.service.js');
const { ERROR_CODES } = await import('../../../src/constants/errorCodes.js');

describe('Service - Health Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('check', () => {
        it('should return healthy status when DB is up', async () => {
            pingDb.mockResolvedValue(true);

            const result = await healthService.check();

            expect(pingDb).toHaveBeenCalled();
            expect(result.healthy).toBe(true);
            expect(result.app).toBe('up');
            expect(result.timestamp).toBeDefined();
        });

        it('should throw SERVICE_UNHEALTHY when pingDb returns false', async () => {
            pingDb.mockResolvedValue(false);

            try {
                await healthService.check();
                fail('Expected an error to be thrown');
            } catch (error) {
                expect(error.code).toBe(ERROR_CODES.SERVICE_UNHEALTHY);
            }
        });

        it('should throw SERVICE_UNHEALTHY when pingDb throws', async () => {
            pingDb.mockRejectedValue(new Error('Connection refused'));

            try {
                await healthService.check();
                fail('Expected an error to be thrown');
            } catch (error) {
                expect(error.code).toBe(ERROR_CODES.SERVICE_UNHEALTHY);
            }
        });
    });
});

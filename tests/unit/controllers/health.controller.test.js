import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/services/health.service.js', () => ({
  healthService: {
    check: jest.fn()
  }
}));

const { healthService } = await import('../../../src/services/health.service.js');
const healthController = await import('../../../src/controllers/health.controller.js');

describe('Controller - Health Controller', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {};

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        mockNext = jest.fn();
    });

    describe('getHealth', () => {
        it('should return 200 with health data when service is healthy', async () => {
            const healthData = {
                healthy: true,
                app: 'up',
                db: 'up',
                timestamp: '2026-05-01T00:00:00.000Z'
            };
            healthService.check.mockResolvedValue(healthData);

            await healthController.getHealth(mockReq, mockRes, mockNext);

            expect(healthService.check).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: healthData
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should pass error to next() when service throws', async () => {
            const error = new Error('Service unhealthy');
            healthService.check.mockRejectedValue(error);

            await healthController.getHealth(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});

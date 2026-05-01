import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/services/summary.service.js', () => ({
  getFinancialSummary: jest.fn(),
  getMonthlyTrends: jest.fn()
}));

const summaryService = await import('../../../src/services/summary.service.js');
const summaryController = await import('../../../src/controllers/summary.controller.js');

describe('Controller - Summary Controller', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {
            user: { id: 'user123' },
            query: {}
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        mockNext = jest.fn();
    });

    describe('getSummary', () => {
        it('should return financial summary with 200', async () => {
            const mockSummary = {
                period: { year: 2026, month: 5 },
                totals: { income: 5000, expenses: 2000, balance: 3000 }
            };
            summaryService.getFinancialSummary.mockResolvedValue(mockSummary);
            mockReq.query = { month: '5', year: '2026' };

            await summaryController.getSummary(mockReq, mockRes, mockNext);

            expect(summaryService.getFinancialSummary).toHaveBeenCalledWith('user123', expect.objectContaining({
                month: 5,
                year: 2026
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockSummary
            }));
        });

        it('should parse category and date filters', async () => {
            summaryService.getFinancialSummary.mockResolvedValue({});
            mockReq.query = { category: 'Food', fromDate: '2026-01-01', toDate: '2026-01-31' };

            await summaryController.getSummary(mockReq, mockRes, mockNext);

            expect(summaryService.getFinancialSummary).toHaveBeenCalledWith('user123', expect.objectContaining({
                category: 'Food',
                fromDate: '2026-01-01',
                toDate: '2026-01-31'
            }));
        });

        it('should pass error to next()', async () => {
            const error = new Error('Failed');
            summaryService.getFinancialSummary.mockRejectedValue(error);

            await summaryController.getSummary(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('getTrends', () => {
        it('should return trends with default limit', async () => {
            const mockTrends = [{ month: '2026-05', income: 5000, expenses: 2000, savings: 3000 }];
            summaryService.getMonthlyTrends.mockResolvedValue(mockTrends);

            await summaryController.getTrends(mockReq, mockRes, mockNext);

            expect(summaryService.getMonthlyTrends).toHaveBeenCalledWith('user123', 6);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockTrends
            }));
        });

        it('should use custom limit from query', async () => {
            summaryService.getMonthlyTrends.mockResolvedValue([]);
            mockReq.query = { limit: '3' };

            await summaryController.getTrends(mockReq, mockRes, mockNext);

            expect(summaryService.getMonthlyTrends).toHaveBeenCalledWith('user123', 3);
        });

        it('should pass error to next()', async () => {
            const error = new Error('Failed');
            summaryService.getMonthlyTrends.mockRejectedValue(error);

            await summaryController.getTrends(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});

import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/services/budget.service.js', () => ({
  setBudget: jest.fn(),
  getUserBudgets: jest.fn(),
  removeBudget: jest.fn()
}));

const budgetService = await import('../../../src/services/budget.service.js');
const budgetController = await import('../../../src/controllers/budget.controller.js');

describe('Controller - Budget Controller', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {
            user: { id: 'user123' },
            body: {},
            params: {},
            query: {}
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        mockNext = jest.fn();
    });

    const mockBudget = {
        id: 'budget123',
        monthlyGoal: 3000,
        category: 'All',
        month: 5,
        year: 2026
    };

    describe('setBudget', () => {
        it('should set budget and send 201 response', async () => {
            budgetService.setBudget.mockResolvedValue(mockBudget);
            mockReq.body = { monthlyGoal: 3000, month: 5, year: 2026 };

            await budgetController.setBudget(mockReq, mockRes, mockNext);

            expect(budgetService.setBudget).toHaveBeenCalledWith('user123', mockReq.body);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockBudget
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should pass error to next()', async () => {
            const error = new Error('DB error');
            budgetService.setBudget.mockRejectedValue(error);

            await budgetController.setBudget(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('list', () => {
        it('should list budgets and send 200 response', async () => {
            budgetService.getUserBudgets.mockResolvedValue([mockBudget]);
            mockReq.query = { year: 2026 };

            await budgetController.list(mockReq, mockRes, mockNext);

            expect(budgetService.getUserBudgets).toHaveBeenCalledWith('user123', mockReq.query);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: [mockBudget]
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should pass error to next()', async () => {
            const error = new Error('DB error');
            budgetService.getUserBudgets.mockRejectedValue(error);

            await budgetController.list(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('remove', () => {
        it('should remove budget and send 200 response', async () => {
            budgetService.removeBudget.mockResolvedValue(mockBudget);
            mockReq.params = { id: 'budget123' };

            await budgetController.remove(mockReq, mockRes, mockNext);

            expect(budgetService.removeBudget).toHaveBeenCalledWith('budget123', 'user123');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should pass error to next()', async () => {
            const error = new Error('Not found');
            budgetService.removeBudget.mockRejectedValue(error);

            await budgetController.remove(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});

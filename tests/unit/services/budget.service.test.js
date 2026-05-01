import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/repositories/budget.repository.js', () => ({
  upsertBudget: jest.fn(),
  findBudgetsByUserId: jest.fn(),
  findBudget: jest.fn(),
  deleteBudget: jest.fn()
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn()
  }
}));

const budgetRepo = await import('../../../src/repositories/budget.repository.js');
const logger = (await import('../../../src/utils/logger.js')).default;
const budgetService = await import('../../../src/services/budget.service.js');

describe('Service - Budget Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockBudget = {
        id: 'budget123',
        userId: 'user123',
        category: 'All',
        month: 5,
        year: 2026,
        monthlyGoal: 3000,
        savingsTarget: 500
    };

    describe('setBudget', () => {
        it('should upsert budget and log', async () => {
            budgetRepo.upsertBudget.mockResolvedValue(mockBudget);

            const data = { monthlyGoal: 3000, month: 5, year: 2026 };
            const result = await budgetService.setBudget('user123', data);

            expect(budgetRepo.upsertBudget).toHaveBeenCalledWith('user123', data);
            expect(logger.info).toHaveBeenCalledWith(
                { userId: 'user123', budgetId: 'budget123' },
                'Budget goal set'
            );
            expect(result).toEqual(mockBudget);
        });
    });

    describe('getUserBudgets', () => {
        it('should return budgets from repository', async () => {
            budgetRepo.findBudgetsByUserId.mockResolvedValue([mockBudget]);

            const result = await budgetService.getUserBudgets('user123', { year: 2026 });

            expect(budgetRepo.findBudgetsByUserId).toHaveBeenCalledWith('user123', { year: 2026 });
            expect(result).toEqual([mockBudget]);
        });
    });

    describe('getBudgetForPeriod', () => {
        it('should return budget for a specific period', async () => {
            budgetRepo.findBudget.mockResolvedValue(mockBudget);

            const result = await budgetService.getBudgetForPeriod('user123', 2026, 5, 'All');

            expect(budgetRepo.findBudget).toHaveBeenCalledWith('user123', 2026, 5, 'All');
            expect(result).toEqual(mockBudget);
        });
    });

    describe('removeBudget', () => {
        it('should delete budget and log when found', async () => {
            budgetRepo.deleteBudget.mockResolvedValue(mockBudget);

            const result = await budgetService.removeBudget('budget123', 'user123');

            expect(budgetRepo.deleteBudget).toHaveBeenCalledWith('budget123', 'user123');
            expect(logger.info).toHaveBeenCalledWith(
                { userId: 'user123', budgetId: 'budget123' },
                'Budget deleted'
            );
            expect(result).toEqual(mockBudget);
        });

        it('should not log when budget not found', async () => {
            budgetRepo.deleteBudget.mockResolvedValue(null);

            const result = await budgetService.removeBudget('nonexistent', 'user123');

            expect(logger.info).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });
});

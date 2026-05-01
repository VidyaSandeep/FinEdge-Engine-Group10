import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/repositories/transaction.repository.js', () => ({
  findTransactionsByUserId: jest.fn()
}));

jest.unstable_mockModule('../../../src/repositories/budget.repository.js', () => ({
  findBudgetsByUserId: jest.fn()
}));

jest.unstable_mockModule('../../../src/services/cache.service.js', () => ({
  default: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn()
  }
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    fatal: jest.fn()
  }
}));

const transactionRepo = await import('../../../src/repositories/transaction.repository.js');
const budgetRepo = await import('../../../src/repositories/budget.repository.js');
const cacheService = (await import('../../../src/services/cache.service.js')).default;
const summaryService = await import('../../../src/services/summary.service.js');

describe('Service - Summary Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateSavingTips', () => {
        it('should return OVERALL_EXCEEDED when expenses exceed goal', () => {
            const tips = summaryService.generateSavingTips(5000, 4000);

            expect(tips).toContain('Warning: You have exceeded your total monthly budget goal.');
        });

        it('should return OVERALL_CAUTION when expenses exceed 80% of goal', () => {
            const tips = summaryService.generateSavingTips(3500, 4000);

            expect(tips.some(t => t.includes('Caution'))).toBe(true);
        });

        it('should return OVERALL_GOOD when expenses are within budget', () => {
            const tips = summaryService.generateSavingTips(1000, 4000);

            expect(tips).toContain('Great job! You are well within your budget this month.');
        });

        it('should add category-specific tips for high spending', () => {
            const categorySpending = [
                { category: 'Food', amount: 2000 }
            ];
            const categoryBudgets = { 'Food': 1000 };

            const tips = summaryService.generateSavingTips(2000, 4000, categorySpending, categoryBudgets);

            expect(tips.some(t => t.includes('Meal prepping'))).toBe(true);
        });

        it('should use absolute threshold when no category budget exists', () => {
            const categorySpending = [
                { category: 'Shopping', amount: 1500 }
            ];

            const tips = summaryService.generateSavingTips(1500, 4000, categorySpending, {});

            expect(tips.some(t => t.includes('48-hour rule'))).toBe(true);
        });
    });

    describe('getFinancialSummary', () => {
        it('should return cached data if available', async () => {
            const cached = { totals: { income: 5000 } };
            cacheService.get.mockReturnValue(cached);

            const result = await summaryService.getFinancialSummary('user123', {});

            expect(cacheService.get).toHaveBeenCalled();
            expect(result).toEqual(cached);
            expect(transactionRepo.findTransactionsByUserId).not.toHaveBeenCalled();
        });

        it('should compute summary when cache misses', async () => {
            cacheService.get.mockReturnValue(null);
            transactionRepo.findTransactionsByUserId.mockResolvedValue([
                { type: 'income', amount: 5000, category: 'Salary' },
                { type: 'expense', amount: 1500, category: 'Food' },
                { type: 'expense', amount: 500, category: 'Utilities' }
            ]);
            budgetRepo.findBudgetsByUserId.mockResolvedValue([
                { category: 'All', monthlyGoal: 4000 }
            ]);

            const result = await summaryService.getFinancialSummary('user123', { year: 2026, month: 5 });

            expect(result.totals.income).toBe(5000);
            expect(result.totals.expenses).toBe(2000);
            expect(result.totals.balance).toBe(3000);
            expect(result.categorySpending).toEqual(expect.arrayContaining([
                expect.objectContaining({ category: 'Food', amount: 1500 }),
                expect.objectContaining({ category: 'Utilities', amount: 500 })
            ]));
            expect(result.savingTips.length).toBeGreaterThan(0);
            expect(cacheService.set).toHaveBeenCalled();
        });

        it('should return empty savingTips when no budget is set', async () => {
            cacheService.get.mockReturnValue(null);
            transactionRepo.findTransactionsByUserId.mockResolvedValue([]);
            budgetRepo.findBudgetsByUserId.mockResolvedValue([]);

            const result = await summaryService.getFinancialSummary('user123', {});

            expect(result.savingTips).toEqual([]);
        });
    });

    describe('getMonthlyTrends', () => {
        it('should return cached trends if available', async () => {
            const cached = [{ month: '2026-05', income: 5000 }];
            cacheService.get.mockReturnValue(cached);

            const result = await summaryService.getMonthlyTrends('user123', 6);

            expect(result).toEqual(cached);
            expect(transactionRepo.findTransactionsByUserId).not.toHaveBeenCalled();
        });

        it('should compute monthly trends when cache misses', async () => {
            cacheService.get.mockReturnValue(null);
            transactionRepo.findTransactionsByUserId.mockResolvedValue([
                { type: 'income', amount: 3000 },
                { type: 'expense', amount: 1000 }
            ]);

            const result = await summaryService.getMonthlyTrends('user123', 2);

            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('month');
            expect(result[0]).toHaveProperty('income');
            expect(result[0]).toHaveProperty('expenses');
            expect(result[0]).toHaveProperty('savings');
            expect(cacheService.set).toHaveBeenCalled();
        });
    });
});

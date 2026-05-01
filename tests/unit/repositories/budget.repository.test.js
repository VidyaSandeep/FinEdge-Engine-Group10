import { jest } from '@jest/globals';

// Budget repo uses doc.toObject() instead of .lean(), so we mock differently
const mockToObject = jest.fn();
const mockSort = jest.fn();

jest.unstable_mockModule('../../../src/models/budget.model.js', () => ({
  default: {
    findOneAndUpdate: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn().mockReturnValue({ sort: mockSort }),
    findOneAndDelete: jest.fn()
  }
}));

const BudgetModel = (await import('../../../src/models/budget.model.js')).default;
const budgetRepository = await import('../../../src/repositories/budget.repository.js');

describe('Repository - Budget Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSort.mockReset();
        BudgetModel.find.mockReturnValue({ sort: mockSort });
    });

    const mockDate = new Date();
    const mockRawDoc = {
        _id: 'budget123',
        userId: 'user123',
        category: 'All',
        month: 5,
        year: 2026,
        monthlyGoal: 3000,
        savingsTarget: 500,
        createdAt: mockDate,
        updatedAt: mockDate,
        toObject() {
            return { ...this };
        }
    };
    // Remove the toObject from the expected domain since toDomain strips it
    const expectedDomain = {
        id: 'budget123',
        userId: 'user123',
        category: 'All',
        month: 5,
        year: 2026,
        monthlyGoal: 3000,
        savingsTarget: 500,
        createdAt: mockDate,
        updatedAt: mockDate
    };

    describe('upsertBudget', () => {
        it('should upsert and return mapped budget', async () => {
            BudgetModel.findOneAndUpdate.mockResolvedValue(mockRawDoc);

            const data = { year: 2026, month: 5, category: 'All', monthlyGoal: 3000 };
            const result = await budgetRepository.upsertBudget('user123', data);

            expect(BudgetModel.findOneAndUpdate).toHaveBeenCalledWith(
                { userId: 'user123', year: 2026, month: 5, category: 'All' },
                { ...data, userId: 'user123' },
                { returnDocument: 'after', upsert: true, runValidators: true, session: undefined }
            );
            expect(result).toEqual(expectedDomain);
        });

        it('should default category to "All" when not provided', async () => {
            BudgetModel.findOneAndUpdate.mockResolvedValue(mockRawDoc);

            const data = { year: 2026, month: 5, monthlyGoal: 3000 };
            await budgetRepository.upsertBudget('user123', data);

            expect(BudgetModel.findOneAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ category: 'All' }),
                expect.any(Object),
                expect.any(Object)
            );
        });
    });

    describe('findBudget', () => {
        it('should find budget by userId, year, month, category', async () => {
            BudgetModel.findOne.mockResolvedValue(mockRawDoc);

            const result = await budgetRepository.findBudget('user123', 2026, 5, 'All');

            expect(BudgetModel.findOne).toHaveBeenCalledWith({ userId: 'user123', year: 2026, month: 5, category: 'All' });
            expect(result).toEqual(expectedDomain);
        });

        it('should default category to "All"', async () => {
            BudgetModel.findOne.mockResolvedValue(mockRawDoc);

            await budgetRepository.findBudget('user123', 2026, 5);

            expect(BudgetModel.findOne).toHaveBeenCalledWith({ userId: 'user123', year: 2026, month: 5, category: 'All' });
        });

        it('should return null if not found', async () => {
            BudgetModel.findOne.mockResolvedValue(null);

            const result = await budgetRepository.findBudget('user123', 2026, 5);

            expect(result).toBeNull();
        });
    });

    describe('findBudgetsByUserId', () => {
        it('should find all budgets for user with filters', async () => {
            mockSort.mockResolvedValue([mockRawDoc]);

            const result = await budgetRepository.findBudgetsByUserId('user123', { year: 2026 });

            expect(BudgetModel.find).toHaveBeenCalledWith({ userId: 'user123', year: 2026 });
            expect(mockSort).toHaveBeenCalledWith({ year: -1, month: -1 });
            expect(result).toEqual([expectedDomain]);
        });
    });

    describe('deleteBudget', () => {
        it('should delete budget by id and userId', async () => {
            BudgetModel.findOneAndDelete.mockResolvedValue(mockRawDoc);

            const result = await budgetRepository.deleteBudget('budget123', 'user123');

            expect(BudgetModel.findOneAndDelete).toHaveBeenCalledWith(
                { _id: 'budget123', userId: 'user123' },
                { session: undefined }
            );
            expect(result).toEqual(mockRawDoc);
        });
    });
});

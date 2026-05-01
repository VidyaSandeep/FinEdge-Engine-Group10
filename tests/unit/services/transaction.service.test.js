import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/repositories/transaction.repository.js', () => ({
  createTransaction: jest.fn(),
  findTransactionsByUserId: jest.fn(),
  findTransactionById: jest.fn(),
  updateTransaction: jest.fn(),
  deleteTransaction: jest.fn()
}));

jest.unstable_mockModule('../../../src/utils/categorizer.js', () => ({
  autoCategorize: jest.fn()
}));

jest.unstable_mockModule('../../../src/utils/eventBus.js', () => ({
  default: {
    emit: jest.fn()
  },
  EVENTS: {
    TRANSACTION: {
      CREATED: 'transaction.created',
      UPDATED: 'transaction.updated',
      DELETED: 'transaction.deleted'
    }
  }
}));

const transactionRepo = await import('../../../src/repositories/transaction.repository.js');
const { autoCategorize } = await import('../../../src/utils/categorizer.js');
const eventBusModule = await import('../../../src/utils/eventBus.js');
const eventBus = eventBusModule.default;
const EVENTS = eventBusModule.EVENTS;
const transactionService = await import('../../../src/services/transaction.service.js');
const { ERROR_CODES } = await import('../../../src/constants/errorCodes.js');

describe('Service - Transaction Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockDate = new Date();
    const mockTransaction = {
        id: 'trans123',
        userId: 'user123',
        amount: 50,
        type: 'expense',
        category: 'Food',
        description: 'Lunch',
        date: mockDate
    };

    describe('createTransaction', () => {
        it('should create transaction and emit event', async () => {
            transactionRepo.createTransaction.mockResolvedValue(mockTransaction);

            const payload = { amount: 50, type: 'expense', category: 'Food', description: 'Lunch' };
            const result = await transactionService.createTransaction('user123', payload);

            expect(transactionRepo.createTransaction).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'user123',
                amount: 50,
                type: 'expense',
                category: 'Food',
                description: 'Lunch'
            }));
            expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.TRANSACTION.CREATED, { userId: 'user123', transaction: mockTransaction });
            expect(result).toEqual(mockTransaction);
        });

        it('should auto-categorize if category is missing', async () => {
            transactionRepo.createTransaction.mockResolvedValue(mockTransaction);
            autoCategorize.mockReturnValue('Food');

            const payload = { amount: 50, type: 'expense', description: 'McDonalds' };
            await transactionService.createTransaction('user123', payload);

            expect(autoCategorize).toHaveBeenCalledWith('McDonalds');
            expect(transactionRepo.createTransaction).toHaveBeenCalledWith(expect.objectContaining({
                category: 'Food'
            }));
        });
        
        it('should auto-categorize if category is "Other"', async () => {
            transactionRepo.createTransaction.mockResolvedValue(mockTransaction);
            autoCategorize.mockReturnValue('Food');

            const payload = { amount: 50, type: 'expense', category: 'Other', description: 'McDonalds' };
            await transactionService.createTransaction('user123', payload);

            expect(autoCategorize).toHaveBeenCalledWith('McDonalds');
            expect(transactionRepo.createTransaction).toHaveBeenCalledWith(expect.objectContaining({
                category: 'Food'
            }));
        });
    });

    describe('getTransactions', () => {
        it('should return transactions from repository', async () => {
            transactionRepo.findTransactionsByUserId.mockResolvedValue([mockTransaction]);

            const result = await transactionService.getTransactions('user123', { type: 'expense' });

            expect(transactionRepo.findTransactionsByUserId).toHaveBeenCalledWith('user123', { type: 'expense' });
            expect(result).toEqual([mockTransaction]);
        });
    });

    describe('getTransactionById', () => {
        it('should return transaction if found', async () => {
            transactionRepo.findTransactionById.mockResolvedValue(mockTransaction);

            const result = await transactionService.getTransactionById('trans123', 'user123');

            expect(transactionRepo.findTransactionById).toHaveBeenCalledWith('trans123', 'user123');
            expect(result).toEqual(mockTransaction);
        });

        it('should throw ApiError if transaction not found', async () => {
            transactionRepo.findTransactionById.mockResolvedValue(null);

            try {
                await transactionService.getTransactionById('trans123', 'user123');
                fail('Expected an error to be thrown');
            } catch (error) {
                expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
            }
        });
    });

    describe('updateTransaction', () => {
        it('should update transaction and emit event', async () => {
            transactionRepo.findTransactionById.mockResolvedValue(mockTransaction);
            transactionRepo.updateTransaction.mockResolvedValue({ ...mockTransaction, amount: 100 });

            const payload = { amount: 100 };
            const result = await transactionService.updateTransaction('trans123', 'user123', payload);

            expect(transactionRepo.updateTransaction).toHaveBeenCalledWith('trans123', 'user123', payload);
            expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.TRANSACTION.UPDATED, { userId: 'user123', transaction: result });
            expect(result.amount).toBe(100);
        });

        it('should auto-categorize if description changes and category is Other', async () => {
            transactionRepo.findTransactionById.mockResolvedValue(mockTransaction);
            transactionRepo.updateTransaction.mockResolvedValue(mockTransaction);
            autoCategorize.mockReturnValue('AutoCat');

            const payload = { description: 'New desc', category: 'Other' };
            await transactionService.updateTransaction('trans123', 'user123', payload);

            expect(autoCategorize).toHaveBeenCalledWith('New desc');
            expect(transactionRepo.updateTransaction).toHaveBeenCalledWith('trans123', 'user123', expect.objectContaining({ category: 'AutoCat' }));
        });

        it('should throw ApiError if transaction not found during update', async () => {
            transactionRepo.findTransactionById.mockResolvedValue(null);

            try {
                await transactionService.updateTransaction('trans123', 'user123', { amount: 100 });
                fail('Expected an error to be thrown');
            } catch (error) {
                expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
            }
        });
    });

    describe('deleteTransaction', () => {
        it('should delete transaction and emit event', async () => {
            transactionRepo.deleteTransaction.mockResolvedValue(mockTransaction);

            const result = await transactionService.deleteTransaction('trans123', 'user123');

            expect(transactionRepo.deleteTransaction).toHaveBeenCalledWith('trans123', 'user123');
            expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.TRANSACTION.DELETED, { userId: 'user123', transaction: mockTransaction });
            expect(result).toEqual(mockTransaction);
        });

        it('should throw ApiError if transaction not found during delete', async () => {
            transactionRepo.deleteTransaction.mockResolvedValue(null);

            try {
                await transactionService.deleteTransaction('trans123', 'user123');
                fail('Expected an error to be thrown');
            } catch (error) {
                expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
            }
        });
    });
});

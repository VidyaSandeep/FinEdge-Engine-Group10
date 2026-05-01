import { jest } from '@jest/globals';

const mockLean = jest.fn();
const mockSort = jest.fn().mockReturnValue({ lean: mockLean });

jest.unstable_mockModule('../../../src/models/transaction.model.js', () => ({
  default: {
    create: jest.fn(),
    find: jest.fn().mockReturnValue({ sort: mockSort }),
    findOne: jest.fn().mockReturnValue({ lean: mockLean }),
    findOneAndUpdate: jest.fn().mockReturnValue({ lean: mockLean }),
    findOneAndDelete: jest.fn().mockReturnValue({ lean: mockLean })
  }
}));

const TransactionModel = (await import('../../../src/models/transaction.model.js')).default;
const transactionRepository = await import('../../../src/repositories/transaction.repository.js');

describe('Repository - Transaction Repository', () => {
    beforeEach(() => {
        mockLean.mockReset();
        mockSort.mockReset();
        
        mockSort.mockReturnValue({ lean: mockLean });
        TransactionModel.create.mockReset();
        TransactionModel.find.mockReturnValue({ sort: mockSort });
        TransactionModel.findOne.mockReturnValue({ lean: mockLean });
        TransactionModel.findOneAndUpdate.mockReturnValue({ lean: mockLean });
        TransactionModel.findOneAndDelete.mockReturnValue({ lean: mockLean });
    });

    const mockDate = new Date('2024-01-01T00:00:00Z');
    
    const mockDoc = {
        _id: 'trans123',
        userId: 'user123',
        type: 'expense',
        category: 'Food',
        amount: 50,
        date: mockDate,
        description: 'Lunch',
        createdAt: mockDate,
        updatedAt: mockDate
    };

    const expectedDomain = {
        id: 'trans123',
        userId: 'user123',
        type: 'expense',
        category: 'Food',
        amount: 50,
        date: mockDate,
        description: 'Lunch',
        createdAt: mockDate,
        updatedAt: mockDate
    };

    describe('createTransaction', () => {
        it('should create and return mapped transaction', async () => {
            TransactionModel.create.mockResolvedValue([mockDoc]);
            
            const payload = { userId: 'user123', type: 'expense', amount: 50, category: 'Food' };
            const result = await transactionRepository.createTransaction(payload);

            expect(TransactionModel.create).toHaveBeenCalledWith([payload], { session: undefined });
            expect(result).toEqual(expectedDomain);
        });
    });

    describe('findTransactionsByUserId', () => {
        it('should find transactions with no filters', async () => {
            mockLean.mockResolvedValueOnce([mockDoc]);

            const result = await transactionRepository.findTransactionsByUserId('user123');

            expect(TransactionModel.find).toHaveBeenCalledWith({ userId: 'user123' });
            expect(mockSort).toHaveBeenCalledWith({ date: -1 });
            expect(result).toEqual([expectedDomain]);
        });

        it('should apply filters (category, type, fromDate, toDate)', async () => {
            mockLean.mockResolvedValueOnce([mockDoc]);

            const filters = {
                category: 'Food',
                type: 'expense',
                fromDate: '2024-01-01',
                toDate: '2024-01-31'
            };

            await transactionRepository.findTransactionsByUserId('user123', filters);

            expect(TransactionModel.find).toHaveBeenCalledWith({
                userId: 'user123',
                category: 'Food',
                type: 'expense',
                date: {
                    $gte: new Date('2024-01-01'),
                    $lte: new Date('2024-01-31')
                }
            });
        });
    });

    describe('findTransactionById', () => {
        it('should find transaction by id and user id', async () => {
            mockLean.mockResolvedValueOnce(mockDoc);

            const result = await transactionRepository.findTransactionById('trans123', 'user123');

            expect(TransactionModel.findOne).toHaveBeenCalledWith({ _id: 'trans123', userId: 'user123' });
            expect(result).toEqual(expectedDomain);
        });

        it('should return null if transaction not found', async () => {
            mockLean.mockResolvedValueOnce(null);

            const result = await transactionRepository.findTransactionById('nonexistent', 'user123');

            expect(result).toBeNull();
        });
    });

    describe('updateTransaction', () => {
        it('should update and return mapped transaction', async () => {
            mockLean.mockResolvedValueOnce(mockDoc);

            const payload = { amount: 100 };
            const result = await transactionRepository.updateTransaction('trans123', 'user123', payload);

            expect(TransactionModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'trans123', userId: 'user123' },
                payload,
                { returnDocument: 'after', runValidators: true }
            );
            expect(result).toEqual(expectedDomain);
        });
    });

    describe('deleteTransaction', () => {
        it('should delete and return mapped transaction', async () => {
            mockLean.mockResolvedValueOnce(mockDoc);

            const result = await transactionRepository.deleteTransaction('trans123', 'user123');

            expect(TransactionModel.findOneAndDelete).toHaveBeenCalledWith(
                { _id: 'trans123', userId: 'user123' },
                { session: undefined }
            );
            expect(result).toEqual(expectedDomain);
        });
    });
});

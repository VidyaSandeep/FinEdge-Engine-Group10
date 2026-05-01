import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/services/transaction.service.js', () => ({
  createTransaction: jest.fn(),
  getTransactions: jest.fn(),
  getTransactionById: jest.fn(),
  updateTransaction: jest.fn(),
  deleteTransaction: jest.fn()
}));

const transactionService = await import('../../../src/services/transaction.service.js');
const transactionController = await import('../../../src/controllers/transaction.controller.js');

describe('Controller - Transaction Controller', () => {
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

    const mockTransaction = { id: 'trans123', amount: 50, type: 'expense' };

    describe('create', () => {
        it('should create transaction and send success response', async () => {
            transactionService.createTransaction.mockResolvedValue(mockTransaction);
            mockReq.body = { amount: 50, type: 'expense' };

            await transactionController.create(mockReq, mockRes, mockNext);

            expect(transactionService.createTransaction).toHaveBeenCalledWith('user123', mockReq.body);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockTransaction
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should pass error to next()', async () => {
            const error = new Error('Database error');
            transactionService.createTransaction.mockRejectedValue(error);

            await transactionController.create(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('getAll', () => {
        it('should get all transactions and send success response', async () => {
            transactionService.getTransactions.mockResolvedValue([mockTransaction]);

            await transactionController.getAll(mockReq, mockRes, mockNext);

            expect(transactionService.getTransactions).toHaveBeenCalledWith('user123', mockReq.query);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: [mockTransaction]
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should pass error to next()', async () => {
            const error = new Error('Database error');
            transactionService.getTransactions.mockRejectedValue(error);

            await transactionController.getAll(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('getById', () => {
        it('should get transaction by id and send success response', async () => {
            transactionService.getTransactionById.mockResolvedValue(mockTransaction);
            mockReq.params = { id: 'trans123' };

            await transactionController.getById(mockReq, mockRes, mockNext);

            expect(transactionService.getTransactionById).toHaveBeenCalledWith('trans123', 'user123');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockTransaction
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should pass error to next()', async () => {
            const error = new Error('Not found');
            transactionService.getTransactionById.mockRejectedValue(error);

            await transactionController.getById(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('update', () => {
        it('should update transaction and send success response', async () => {
            transactionService.updateTransaction.mockResolvedValue({ ...mockTransaction, amount: 100 });
            mockReq.params = { id: 'trans123' };
            mockReq.body = { amount: 100 };

            await transactionController.update(mockReq, mockRes, mockNext);

            expect(transactionService.updateTransaction).toHaveBeenCalledWith('trans123', 'user123', mockReq.body);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({ amount: 100 })
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should pass error to next()', async () => {
            const error = new Error('Not found');
            transactionService.updateTransaction.mockRejectedValue(error);

            await transactionController.update(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('remove', () => {
        it('should delete transaction and send success response', async () => {
            transactionService.deleteTransaction.mockResolvedValue(mockTransaction);
            mockReq.params = { id: 'trans123' };

            await transactionController.remove(mockReq, mockRes, mockNext);

            expect(transactionService.deleteTransaction).toHaveBeenCalledWith('trans123', 'user123');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should pass error to next()', async () => {
            const error = new Error('Not found');
            transactionService.deleteTransaction.mockRejectedValue(error);

            await transactionController.remove(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});

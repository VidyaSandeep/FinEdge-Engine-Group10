import * as transactionService from '../services/transaction.service.js';
import { sendSuccess } from '../utils/response.js';
import logger from '../utils/logger.js';


export async function create(req, res, next) {
    try {
        const userId = req.user.id;
        const result = await transactionService.createTransaction(userId, req.body);

        logger.info({ transactionId: result.id, type: result.type }, 'New transaction created');

        return sendSuccess(res, {
            statusCode: 201,
            message: 'Transaction recorded successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}


export async function getAll(req, res, next) {
    try {
        const userId = req.user.id;
        const result = await transactionService.getTransactions(userId, req.query);

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Transactions retrieved successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function getById(req, res, next) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const result = await transactionService.getTransactionById(id, userId);

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Transaction details fetched',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}


export async function update(req, res, next) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const result = await transactionService.updateTransaction(id, userId, req.body);

        logger.info({ transactionId: id }, 'Transaction updated');

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Transaction updated successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Deletes a transaction from the user's history.
 */
export async function remove(req, res, next) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        await transactionService.deleteTransaction(id, userId);

        logger.info({ transactionId: id }, 'Transaction deleted');

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Transaction deleted successfully',
        });
    } catch (error) {
        next(error);
    }
}

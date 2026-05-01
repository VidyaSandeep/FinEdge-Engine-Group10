import * as transactionRepo from '../repositories/transaction.repository.js';
import { autoCategorize } from '../utils/categorizer.js';
import eventBus, { EVENTS } from '../utils/eventBus.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/**
 * Creates a new transaction and emits a real-time event.
 */
export async function createTransaction(userId, payload) {
    const { amount, type, description } = payload;
    let { category } = payload;

    // guess category from the description if it is not provided
    if (!category || category.toLowerCase() === 'uncategorized' || category === 'Other') {
        category = autoCategorize(description);
    }

    const result = await transactionRepo.createTransaction({
        userId,
        amount,
        type,
        category,
        description: description || '',
        date: payload.date || new Date(),
    });

    // Emit event for real-time notifications (async)
    eventBus.emit(EVENTS.TRANSACTION.CREATED, { userId, transaction: result });

    return result;
}

export async function getTransactions(userId, filters = {}) {
    return await transactionRepo.findTransactionsByUserId(userId, filters);
}

export async function getTransactionById(id, userId) {
    const transaction = await transactionRepo.findTransactionById(id, userId);
    if (!transaction) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, { message: 'Transaction not found or unauthorized' });
    }
    return transaction;
}

export async function updateTransaction(id, userId, payload) {
    const existing = await transactionRepo.findTransactionById(id, userId);
    if (!existing) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, { message: 'Transaction not found or unauthorized' });
    }

    // If description changes and category is still unspecified; auto-categorize.
    if (payload.description && (!payload.category || payload.category === 'Other')) {
        payload.category = autoCategorize(payload.description);
    }

    const result = await transactionRepo.updateTransaction(id, userId, payload);

    if (result) {
        eventBus.emit(EVENTS.TRANSACTION.UPDATED, { userId, transaction: result });
    }

    return result;
}

export async function deleteTransaction(id, userId) {
    const transaction = await transactionRepo.deleteTransaction(id, userId);
    if (!transaction) {
        throw new ApiError(ERROR_CODES.NOT_FOUND, { message: 'Transaction not found or unauthorized' });
    }

    eventBus.emit(EVENTS.TRANSACTION.DELETED, { userId, transaction });

    return transaction;
}

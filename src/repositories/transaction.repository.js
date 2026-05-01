import Transaction from '../models/transaction.model.js';
import { normalizeCategory } from '../utils/category.js';

export async function createTransaction(payload, tx) {
    if (payload.category) {
        payload.category = normalizeCategory(payload.category);
    }
    const transaction = await Transaction.create([payload], { session: tx });
    return toDomain(transaction[0]);
}

/**
 * Get all transactions of a user with advanced filtering.
 * filter by category, type, fromDate, toDate.
 */
export async function findTransactionsByUserId(userId, filters = {}) {
    const { fromDate, toDate, category, type } = filters;

    const query = { userId };

    if (category) query.category = normalizeCategory(category);
    if (type) query.type = type;
    if (fromDate || toDate) {
        query.date = {};
        if (fromDate) query.date.$gte = new Date(fromDate);
        if (toDate) query.date.$lte = new Date(toDate);
    }

    const transactions = await Transaction.find(query).sort({ date: -1 }).lean();
    return transactions.map(toDomain);
}

export async function findTransactionById(id, userId) {
    const transaction = await Transaction.findOne({ _id: id, userId }).lean();
    return transaction ? toDomain(transaction) : null;
}

export async function updateTransaction(id, userId, payload, tx) {
    if (payload.category) {
        payload.category = normalizeCategory(payload.category);
    }
    const transaction = await Transaction.findOneAndUpdate(
        { _id: id, userId },
        payload,
        { returnDocument: 'after', runValidators: true, session: tx }
    ).lean();

    return transaction ? toDomain(transaction) : null;
}

export async function deleteTransaction(id, userId, tx) {
    const transaction = await Transaction.findOneAndDelete({ _id: id, userId }, { session: tx }).lean();
    return transaction ? toDomain(transaction) : null;
}

export async function deleteTransactionsByUserId(userId, tx) {
    return await Transaction.deleteMany({ userId }, { session: tx });
}

function toDomain(doc) {
    if (!doc) return null;

    return {
        id: String(doc._id),
        userId: String(doc.userId),
        type: doc.type,
        category: doc.category,
        amount: doc.amount,
        date: doc.date,
        description: doc.description,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}

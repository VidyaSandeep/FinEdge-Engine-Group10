import BudgetModel from '../models/budget.model.js';
import { normalizeCategory } from '../utils/category.js';

export async function upsertBudget(userId, data, tx) {
    const { year, month, category } = data;
    const normalizedCategoryName = normalizeCategory(category);
    const query = { userId, year, month, category: normalizedCategoryName };
    const update = { ...data, userId, category: normalizedCategoryName };

    const doc = await BudgetModel.findOneAndUpdate(query, update, {
        returnDocument: 'after',
        upsert: true,
        runValidators: true,
        session: tx
    });
    return toDomain(doc);
}

export async function findBudget(userId, year, month, category = 'All') {
    const normalizedCategoryName = normalizeCategory(category);
    const doc = await BudgetModel.findOne({ userId, year, month, category: normalizedCategoryName });
    return toDomain(doc);
}

export async function findBudgetsByUserId(userId, filters = {}) {
    const docs = await BudgetModel.find({ userId, ...filters }).sort({ year: -1, month: -1 });
    return docs.map(toDomain);
}

export async function deleteBudget(id, userId, tx) {
    return await BudgetModel.findOneAndDelete({ _id: id, userId }, { session: tx });
}

export async function deleteBudgetsByUserId(userId, tx) {
    return await BudgetModel.deleteMany({ userId }, { session: tx });
}


const toDomain = (doc) => {
    if (!doc) return null;
    const obj = doc.toObject();
    return {
        id: obj._id,
        userId: obj.userId,
        category: obj.category,
        month: obj.month,
        year: obj.year,
        monthlyGoal: obj.monthlyGoal,
        savingsTarget: obj.savingsTarget,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt
    };
};
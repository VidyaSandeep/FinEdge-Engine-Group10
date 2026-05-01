import * as budgetRepo from '../repositories/budget.repository.js';
import logger from '../utils/logger.js';

export async function setBudget(userId, data) {
    const budget = await budgetRepo.upsertBudget(userId, data);
    logger.info({ userId, budgetId: budget.id }, 'Budget goal set');
    return budget;
}

export async function getUserBudgets(userId, filters) {
    return await budgetRepo.findBudgetsByUserId(userId, filters);
}

export async function getBudgetForPeriod(userId, year, month, category) {
    return await budgetRepo.findBudget(userId, year, month, category);
}

export async function removeBudget(id, userId) {
    const result = await budgetRepo.deleteBudget(id, userId);
    if (result) {
        logger.info({ userId, budgetId: id }, 'Budget deleted');
    }
    return result;
}

import * as transactionRepo from '../repositories/transaction.repository.js';
import * as budgetRepo from '../repositories/budget.repository.js';
import cacheService from './cache.service.js';
import logger from '../utils/logger.js';
import { SAVING_TIPS_TEMPLATES, THRESHOLDS } from '../constants/constants.js';

/**
 * saving tips based on spending vs budget.
 */
export function generateSavingTips(totalExpenses, monthlyGoal, categorySpending = [], categoryBudgets = {}) {
    const tips = [];

    // Overall budget check
    if (totalExpenses > monthlyGoal) {
        tips.push(SAVING_TIPS_TEMPLATES.OVERALL_EXCEEDED);
    } else if (totalExpenses > monthlyGoal * THRESHOLDS.CAUTION) {
        const cautionMsg = SAVING_TIPS_TEMPLATES.OVERALL_CAUTION.replace('{threshold}', THRESHOLDS.CAUTION * 100);
        tips.push(cautionMsg);
    } else {
        tips.push(SAVING_TIPS_TEMPLATES.OVERALL_GOOD);
    }

    categorySpending.forEach(cat => {
        const catName = cat.category;
        const catBudget = categoryBudgets[catName] || categoryBudgets['All']; 
        
        const isHigh = catBudget 
            ? cat.amount > catBudget * THRESHOLDS.CAUTION 
            : cat.amount > THRESHOLDS.HIGH_SPENDING_ABSOLUTE;

        if (isHigh) {
            const tipTemplate = SAVING_TIPS_TEMPLATES[catName] || SAVING_TIPS_TEMPLATES['Default'];
            tips.push(`Tip: ${tipTemplate}`);
        }
    });

    return [...new Set(tips)];
}

export async function getFinancialSummary(userId, filters = {}) {
    const cacheKey = `summary:${userId}:${JSON.stringify(filters)}`;
    const cachedData = cacheService.get(cacheKey);

    if (cachedData) {
        logger.debug({ userId }, 'Serving financial summary from cache');
        return cachedData;
    }

    logger.info({ userId }, 'Computing financial summary');

    const transactions = await transactionRepo.findTransactionsByUserId(userId, filters);

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryMap = {};

    transactions.forEach(tx => {
        if (tx.type === 'income') {
            totalIncome += tx.amount;
        } else {
            totalExpenses += tx.amount;
            categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
        }
    });

    const categorySpending = Object.entries(categoryMap).map(([category, amount]) => ({
        category,
        amount
    }));

    const now = new Date();
    const year = filters.year || now.getFullYear();
    const month = filters.month || (now.getMonth() + 1);
    
    const budgets = await budgetRepo.findBudgetsByUserId(userId, { year, month });
    
    const categoryBudgets = {};
    budgets.forEach(b => {
        categoryBudgets[b.category] = b.monthlyGoal;
    });

    const mainBudget = categoryBudgets['All'] || 0;
    const balance = totalIncome - totalExpenses;
    
    const savingTips = mainBudget > 0 
        ? generateSavingTips(totalExpenses, mainBudget, categorySpending, categoryBudgets) 
        : [];

    const summary = {
        period: { year, month },
        totals: {
            income: totalIncome,
            expenses: totalExpenses,
            balance
        },
        categorySpending,
        budgets,
        savingTips
    };

    cacheService.set(cacheKey, summary, 120);

    return summary;
}

/**
 * Calculates monthly trends for the last N months.
 */
export async function getMonthlyTrends(userId, monthsCount = 6) {
    const cacheKey = `trends:${userId}:${monthsCount}`;
    const cachedData = cacheService.get(cacheKey);

    if (cachedData) return cachedData;

    const trends = [];
    const now = new Date();

    // Iterate backwards through months
    for (let i = 0; i < monthsCount; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        // Calculate start and end of that month
        const fromDate = new Date(year, month - 1, 1);
        const toDate = new Date(year, month, 0, 23, 59, 59);

        const transactions = await transactionRepo.findTransactionsByUserId(userId, { fromDate, toDate });

        let income = 0;
        let expenses = 0;
        transactions.forEach(tx => {
            if (tx.type === 'income') income += tx.amount;
            else expenses += tx.amount;
        });

        trends.push({
            month: `${year}-${String(month).padStart(2, '0')}`,
            income,
            expenses,
            savings: income - expenses
        });
    }

    const result = trends.reverse(); // Order from oldest to newest
    cacheService.set(cacheKey, result, 300); // Cache trends for 5 minutes

    return result;
}

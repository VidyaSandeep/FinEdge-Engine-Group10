import * as budgetService from '../services/budget.service.js';
import { sendSuccess } from '../utils/response.js';

export async function setBudget(req, res, next) {
    try {
        const userId = req.user.id;
        const result = await budgetService.setBudget(userId, req.body);

        return sendSuccess(res, {
            statusCode: 201,
            message: 'Budget goal updated',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function list(req, res, next) {
    try {
        const userId = req.user.id;
        const result = await budgetService.getUserBudgets(userId, req.query);

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Budgets retrieved successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function remove(req, res, next) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        await budgetService.removeBudget(id, userId);

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Budget goal deleted',
        });
    } catch (error) {
        next(error);
    }
}

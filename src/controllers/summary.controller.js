import * as summaryService from '../services/summary.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getSummary(req, res, next) {
    try {
        const userId = req.user.id;
        const { month, year, category, fromDate, toDate } = req.query;
        
        const filters = { fromDate, toDate };
        if (month) filters.month = parseInt(month);
        if (year) filters.year = parseInt(year);
        if (category) filters.category = category;

        const result = await summaryService.getFinancialSummary(userId, filters);

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Financial summary generated successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Handles fetching monthly trends (last 6 months by default).
 */
export async function getTrends(req, res, next) {
    try {
        const userId = req.user.id;
        const { limit } = req.query;
        
        const monthsCount = limit ? parseInt(limit) : 6;
        const result = await summaryService.getMonthlyTrends(userId, monthsCount);

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Financial trends retrieved successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

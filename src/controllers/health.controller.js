
import { healthService } from '../services/health.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getHealth(req, res, next) {
    try {
        const result = await healthService.check();
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Service is healthy',
            data: result,
        });
    } catch (error) {
        return next(error);
    }
}
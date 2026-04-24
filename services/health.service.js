import { ERROR_CODES } from '../constants/errorCodes.js';
import { pingDb } from '../datasource/mongo.datasource.js';

export const healthService = {
    async check() {
        let db = 'down';

        try {
            const alive = await pingDb();
            db = alive ? 'up' : 'down';
        } catch {
            db = 'down';
        }

        if (db === 'down') {
            throw new ApiError(ERROR_CODES.SERVICE_UNHEALTHY);
        }

        return {
            healthy: true,
            app: 'up',
            db,
            timestamp: new Date().toISOString(),
        };
    },
};
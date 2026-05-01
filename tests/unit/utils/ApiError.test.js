import { ApiError } from '../../../src/utils/ApiError.js';
import { ERROR_CODES } from '../../../src/constants/errorCodes.js';

describe('Utility - ApiError', () => {
    it('should create an error with default internal server error code', () => {
        const error = new ApiError();
        expect(error.code).toBe(ERROR_CODES.INTERNAL_SERVER_ERROR);
        expect(error.statusCode).toBe(500);
    });

    it('should create an error with a specific valid code', () => {
        const error = new ApiError(ERROR_CODES.NOT_FOUND);
        expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
        expect(error.statusCode).toBe(404);
    });

    it('should fallback to internal server error for unknown code', () => {
        const error = new ApiError('UNKNOWN_CODE');
        expect(error.code).toBe('UNKNOWN_CODE');
        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('Internal Server Error');
    });

    it('should allow overriding message and statusCode', () => {
        const error = new ApiError(ERROR_CODES.NOT_FOUND, {
            message: 'Custom not found',
            statusCode: 499
        });
        expect(error.message).toBe('Custom not found');
        expect(error.statusCode).toBe(499);
    });

    it('should include additional errors if provided', () => {
        const details = [{ field: 'email', message: 'invalid' }];
        const error = new ApiError(ERROR_CODES.VALIDATION_ERROR, { errors: details });
        expect(error.errors).toEqual(details);
    });
});

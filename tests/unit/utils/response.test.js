import { jest } from '@jest/globals';
import { sendSuccess, sendError } from '../../../src/utils/response.js';

describe('Utility - Response', () => {
    let mockRes;

    beforeEach(() => {
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe('sendSuccess', () => {
        it('should use default values if options are missing', () => {
            sendSuccess(mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Success',
                data: null
            }));
        });

        it('should use provided values', () => {
            sendSuccess(mockRes, { statusCode: 201, message: 'Created', data: { id: 1 } });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Created',
                data: { id: 1 }
            });
        });
    });

    describe('sendError', () => {
        it('should use default values if options are missing', () => {
            sendError(mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Internal Server Error'
            });
        });

        it('should use provided values and include errors array', () => {
            const errors = [{ field: 'name', message: 'required' }];
            sendError(mockRes, {
                statusCode: 400,
                code: 'VAL_ERR',
                message: 'Bad Request',
                errors
            });
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                code: 'VAL_ERR',
                message: 'Bad Request',
                errors
            });
        });
    });
});

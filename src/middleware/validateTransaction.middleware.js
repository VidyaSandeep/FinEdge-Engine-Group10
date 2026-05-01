import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';


const transactionSchema = z.object({
    type: z.enum(['income', 'expense'], {
        errorMap: () => ({ message: "Type must be either 'income' or 'expense'" })
    }),
    amount: z.number().positive("Amount must be a positive number"),
    category: z.string().max(100).optional(),
    date: z.union([
        z.string().datetime(),
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD")
    ], { 
        errorMap: () => ({ message: "Invalid date format. Use ISO 8601 (e.g., 2026-05-01T19:17:51Z) or simple date (YYYY-MM-DD)" }) 
    }).optional(),
    description: z.string().max(500).optional(),
});

const createSchema = transactionSchema;
const updateSchema = transactionSchema.partial();

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            const validationErrors = error.issues.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));

            return next(new ApiError(ERROR_CODES.INVALID_INPUT, {
                message: 'Validation failed for transaction data',
                errors: validationErrors
            }));
        }
        next(error);
    }
};

export default {
    create: validate(createSchema),
    update: validate(updateSchema)
};

import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});

const updateSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    isActive: z.boolean().optional(),
}).strict();

const validateRegister = (req, res, next) => {
    try {
        registerSchema.parse(req.body);
        next();
    } catch (error) {
        handleZodError(error, next);
    }
};

const validateLogin = (req, res, next) => {
    try {
        loginSchema.parse(req.body);
        next();
    } catch (error) {
        handleZodError(error, next);
    }
};

const validateUpdate = (req, res, next) => {
    try {
        updateSchema.parse(req.body);
        next();
    } catch (error) {
        handleZodError(error, next);
    }
};

function handleZodError(error, next) {
    if (error instanceof z.ZodError) {
        const validationErrors = error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }));
        
        return next(new ApiError(ERROR_CODES.INVALID_INPUT, {
            message: 'Validation failed',
            errors: validationErrors
        }));
    }
    next(error);
}

export default {
    register: validateRegister,
    login: validateLogin,
    update: validateUpdate
};

import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { findByEmailWithPassword } from '../repositories/user.repository.js';


export async function loginUser(email, password) {
    if (!email || !password) {
        throw new ApiError(ERROR_CODES.INVALID_CREDENTIALS);
    }
    const user = await findByEmailWithPassword(email);
    if (!user) {
        throw new ApiError(ERROR_CODES.INVALID_CREDENTIALS);
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        throw new ApiError(ERROR_CODES.INVALID_CREDENTIALS);
    }
    return user;
}
import { is } from 'zod/locales';
import User from '../models/user.model.js';


export async function createUser(payload) {
    const user = await User.create(payload);
    return toDomain(user);
}

export async function findUserById(userId, isActive) {
    const user = await User.findById(userId).lean();
    if (user && isActive !== undefined &&
        user.isActive === isActive) {
        return null;
    }
    return user ? toDomain(user) : null;
}

export async function findUserByEmail(email, isActive) {
    const query = { email: email.trim().toLowerCase() };
    if (isActive !== undefined) {
        query.isActive = isActive;
    }
    const user = await User.findOne(query).lean();
    return user ? toDomain(user) : null;
}

export async function findUserByEmailWithPassword(email, isActive) {
    const query = { email: email.trim().toLowerCase() };
    if (isActive !== undefined) {
        query.isActive = isActive;
    }
    const user = await User.findOne(query).select('+password').lean();
    return user ? toDomain(user) : null;
}

export async function softDeleteUserById(userId) {
    const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true, runValidators: true }
    ).lean();

    return user ? toDomain(user) : null;
}

export async function deleteUserById(userId) {
    const user = await User.findByIdAndDelete(userId).lean();
    return user ? toDomain(user) : null;
}

export async function userExistsByEmail(email) {
    const count = await User.countDocuments({
        email: email.trim().toLowerCase(),
    });
    return count > 0;
}

function toDomain(doc) {
    if (!doc) return null;

    return {
        id: String(doc._id),
        name: doc.name,
        email: doc.email,
        passwordHash: doc.password,
        isActive: doc.isActive,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}

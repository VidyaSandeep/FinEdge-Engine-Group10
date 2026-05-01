import { is } from 'zod/locales';
import User from '../models/user.model.js';


export async function createUser(payload, tx) {
    const user = await User.create([payload], { session: tx });
    return toDomain(user[0]);
}

export async function findUserById(userId, isActive) {
    const user = await User.findById(userId).populate('preferences').lean();
    if (user && isActive !== undefined &&
        user.isActive !== isActive) {
        return null;
    }
    return user ? toDomain(user) : null;
}

export async function updateUser(userId, payload, tx) {
    const user = await User.findByIdAndUpdate(
        userId,
        payload,
        { returnDocument: 'after', runValidators: true, session: tx }
    ).populate('preferences').lean();

    return user ? toDomain(user) : null;
}

export async function findUserByEmail(email, isActive) {
    const query = { email: email.trim().toLowerCase() };
    if (isActive !== undefined) {
        query.isActive = isActive;
    }
    const user = await User.findOne(query).populate('preferences').lean();
    return user ? toDomain(user) : null;
}

export async function findUserByEmailWithPassword(email, isActive) {
    const query = { email: email.trim().toLowerCase() };
    if (isActive !== undefined) {
        query.isActive = isActive;
    }
    const user = await User.findOne(query).select('+password').populate('preferences').lean();
    return user ? toDomain(user) : null;
}

export async function softDeleteUserById(userId) {
    const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { returnDocument: 'after', runValidators: true }
    ).lean();

    return user ? toDomain(user) : null;
}

export async function deleteUserById(userId, tx) {
    const user = await User.findByIdAndDelete(userId, { session: tx }).lean();
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
        preferences: doc.preferences ? {
            id: String(doc.preferences._id || doc.preferences),
            currency: doc.preferences.currency
        } : null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}

import User from '../models/user.model.js';


export async function create(payload) {
    const user = await User.create(payload);
    return toDomain(user);
}

export async function findById(userId) {
    const user = await User.findById(userId).lean();
    return user ? toDomain(user) : null;
}

export async function findByEmail(email) {
    const user = await User.findOne({
        email: email.trim().toLowerCase(),
    }).lean();

    return user ? toDomain(user) : null;
}

export async function findByEmailWithPassword(email) {
    const user = await User.findOne({
        email: email.trim().toLowerCase(),
    })
        .select('+passwordHash')
        .lean();

    return user ? toDomain(user) : null;
}

export async function softDeleteById(userId) {
    const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true, runValidators: true }
    ).lean();

    return user ? toDomain(user) : null;
}

export async function deleteById(userId) {
    const user = await User.findByIdAndDelete(userId).lean();
    return user ? toDomain(user) : null;
}

export async function existsByEmail(email) {
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
        passwordHash: doc.passwordHash,
        isActive: doc.isActive,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}

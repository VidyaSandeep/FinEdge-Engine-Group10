import User from '../models/user.model.js';


export async function createUser(payload) {
    const user = await User.create(payload);
    return toDomain(user);
}

export async function findUserById(userId) {
    const user = await User.findById(userId).lean();
    return user ? toDomain(user) : null;
}

export async function findUserByEmail(email) {
    const user = await User.findOne({
        email: email.trim().toLowerCase(),
    }).lean();

    return user ? toDomain(user) : null;
}

export async function findUserByEmailWithPassword(email) {
    const user = await User.findOne({
        email: email.trim().toLowerCase(),
    })
        .select('+password')
        .lean();

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

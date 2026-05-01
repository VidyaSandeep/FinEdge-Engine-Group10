import UserPreference from '../models/userPreference.model.js';

/**
 * Find preferences for a specific user.
 * @param {string} userId 
 */
export async function findByUserId(userId) {
  const pref = await UserPreference.findOne({ userId }).lean();
  return toDomain(pref);
}

/**
 * Upsert preferences for a user.
 * @param {string} userId 
 * @param {object} data 
 */
export async function upsertByUserId(userId, data, tx) {
  const preferences = await UserPreference.findOneAndUpdate(
    { userId },
    { ...data, userId },
    { upsert: true, returnDocument: 'after', runValidators: true, session: tx }
  ).lean();

  return toDomain(preferences);
}

/**
 * Delete preferences for a user.
 * @param {string} userId 
 * @param {object} tx 
 */
export async function deleteByUserId(userId, tx) {
  const pref = await UserPreference.findOneAndDelete({ userId }, { session: tx }).lean();
  return toDomain(pref);
}

function toDomain(doc) {
  if (!doc) return null;

  return {
    id: String(doc._id),
    userId: doc.userId,
    currency: doc.currency,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

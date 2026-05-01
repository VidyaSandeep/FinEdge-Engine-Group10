import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Handles database transactions in a way that isolates Mongoose from the service layer.
 * Fallbacks to non-transactional mode if the environment (like standalone Mongo) doesn't support it.
 */
export async function withTransaction(callback) {
    let isReplicaSet = false;
    try {
        const client = mongoose.connection.getClient();
        isReplicaSet = client?.topology?.description?.type?.includes('ReplicaSet') || 
                            client?.topology?.type === 'ReplicaSetNoPrimary' ||
                            client?.topology?.type === 'ReplicaSetWithPrimary';
    } catch (e) {
        logger.debug('Mongoose client not available. Running without transaction.');
    }

    if (!isReplicaSet) {
        logger.debug('Standalone MongoDB detected. Running without transaction.');
        return await callback(undefined);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const result = await callback(session);
        if (session.inTransaction()) {
            await session.commitTransaction();
        }
        return result;
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw error;
    } finally {
        session.endSession();
    }
}

import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';


export async function connectDb() {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('MongoDB connected');
}

export function getDbReadyState() {
    return mongoose.connection.readyState;
}

export async function pingDb() {
    if (mongoose.connection.readyState !== 1) {
        return false;
    }

    await mongoose.connection.db.admin().ping();
    return true;
}
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { connectDb } from './datasource/db.js';
import app from './app.js';

async function startServer() {
    try {
        await connectDb();

        app.listen(env.PORT, () => {
            logger.info({ port: env.PORT }, 'Server is running');
        });
    } catch (error) {
        logger.fatal({ err: error }, 'Failed to start server');
        process.exit(1);
    }
}

startServer();
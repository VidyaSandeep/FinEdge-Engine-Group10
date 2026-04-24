import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogHandler } from './middleware/requestLogHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

import healthRoutes from './routes/healthRoutes.js';

const app = express();

//blocks others from seeing our express version
app.disable('x-powered-by');

app.use(helmet());

app.use(cors({
    origin: '*',
    credentials: true,
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({
    extended: false,
    limit: '16kb',
    parameterLimit: 100,
}));

app.use(requestLogHandler);

// API routes rate limiting (100 requests per 15 minutes per IP)
app.use('/api/', apiRateLimiter);

// API Routes
app.use('/api/v1/health', healthRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
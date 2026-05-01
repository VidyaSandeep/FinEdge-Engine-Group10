import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoutes from './routes/health.route.js';
import userRoutes from './routes/user.routes.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { requestLogHandler } from './middleware/requestLog.middleware.js';
import { apiRateLimiter } from './middleware/rateLimiter.middleware.js';

const app = express();

//blocks others from seeing our express version
app.disable('x-powered-by');

app.use(helmet());

app.use(cors({
    origin: true,
    credentials: true,
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({
    extended: false,
    limit: '16kb',
    parameterLimit: 100,
}));

app.use(requestLogHandler);

app.get('/', (req, res) => {
    return res.status(200).json({
        message: "Welcome to the FinEdge API",
        version: "1.0.0",
    });
});


app.use('/api/', apiRateLimiter);

app.use('/api/health', healthRoutes);
app.use('/api/users', userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
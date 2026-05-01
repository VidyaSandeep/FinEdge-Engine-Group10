import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import healthRoutes from './routes/health.route.js';
import userRoutes from './routes/user.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import summaryRoutes from './routes/summary.routes.js';
import notFoundHandler from './middleware/notFound.middleware.js';
import errorHandler from './middleware/error.middleware.js';
import requestLogHandler from './middleware/requestLog.middleware.js';
import { apiRateLimiter } from './middleware/rateLimiter.middleware.js';
import requestIdMiddleware from './middleware/requestId.middleware.js';
import contextMiddleware from './middleware/context.middleware.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

// Event listener initialization
import './services/notification.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

//blocks others from seeing our express version
app.disable('x-powered-by');

app.use(helmet());

app.use(cors({
    origin: true,
    credentials: true,
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({
    extended: false,
    limit: '16kb',
    parameterLimit: 100,
}));

app.use(requestIdMiddleware);
app.use(contextMiddleware);
app.use(requestLogHandler);

app.get('/', (req, res) => {
    return res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Ignore common browser noise
app.get([
    '/favicon.ico',
    '/.well-known/appspecific/com.chrome.devtools.json',
    '/sw.js'], (req, res) => res.status(204).end());


app.use('/api/', apiRateLimiter);

// Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/health', healthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/summary', summaryRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
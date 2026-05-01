import { THRESHOLDS } from '../constants/constants.js';
import eventBus, { EVENTS } from '../utils/eventBus.js';
import logger from '../utils/logger.js';
import * as summaryService from './summary.service.js';

/**
 * The Notification Service listens for system events and triggers
 * Later can be extended with email or socket.io or sse.
 * For now , it just logs the events and alerts.
 */
class NotificationService {
    constructor() {
        this.init();
    }

    init() {
        // Listen for transaction creation to check for budget breaches
        eventBus.on(EVENTS.TRANSACTION.CREATED, (data) => this.handleTransactionCreated(data));

        // General logging for major events
        eventBus.on(EVENTS.USER.REGISTERED, (user) => {
            logger.info({ userId: user.id }, 'Welcome notification queued for new user');
        });

        logger.info('Notification Service initialized and listening for events');
    }

    /**
     * When a transaction is created, check it with the user budget.
     */
    async handleTransactionCreated({ userId, transaction }) {
        try {
            // Fetch current summary for the month
            const now = new Date();
            const summary = await summaryService.getFinancialSummary(userId, {
                year: now.getFullYear(),
                month: now.getMonth() + 1
            });

            const globalBudget = summary.budgets.find(b => b.category === 'All');
            
            if (globalBudget && summary.totals.expenses > globalBudget.monthlyGoal) {
                logger.warn({
                    userId,
                    expenses: summary.totals.expenses,
                    goal: globalBudget.monthlyGoal
                }, 'BUDGET BREACH DETECTED!');

                eventBus.emit(EVENTS.BUDGET.BREACHED, { userId, summary });
            }

            // Alert on high-value transactions 
            if (transaction.type === 'expense' && transaction.amount > THRESHOLDS.MAXIMUM_SINGLE_TRANSACTION_EXPENSE) {
                logger.info({ userId, amount: transaction.amount }, 'High-value transaction alert triggered');
            }

        } catch (error) {
            logger.error({ err: error }, 'Error in NotificationService during transaction handling');
        }
    }
}

// Singleton instance
export default new NotificationService();

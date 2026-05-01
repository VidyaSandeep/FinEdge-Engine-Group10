import { jest } from '@jest/globals';

describe('Service - Notification Service', () => {
    let notificationService;
    let logger;
    let eventBus;
    let summaryService;
    let EVENTS;

    beforeEach(async () => {
        jest.resetModules();
        
        // Setup mocks before importing the service
        jest.unstable_mockModule('../../../src/services/summary.service.js', () => ({
            getFinancialSummary: jest.fn()
        }));

        jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
            default: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn()
            }
        }));

        jest.unstable_mockModule('../../../src/utils/eventBus.js', () => ({
            default: {
                on: jest.fn(),
                emit: jest.fn()
            },
            EVENTS: {
                TRANSACTION: { CREATED: 'TRANSACTION_CREATED' },
                USER: { REGISTERED: 'USER_REGISTERED' },
                BUDGET: { BREACHED: 'BUDGET_BREACHED' }
            }
        }));

        // Re-import modules after resetting
        summaryService = await import('../../../src/services/summary.service.js');
        logger = (await import('../../../src/utils/logger.js')).default;
        eventBus = (await import('../../../src/utils/eventBus.js')).default;
        const eventBusModule = await import('../../../src/utils/eventBus.js');
        EVENTS = eventBusModule.EVENTS;
        
        const notificationModule = await import('../../../src/services/notification.service.js');
        notificationService = notificationModule.default;
    });

    describe('Budget Breach Detection', () => {
        it('should log warning and emit event when budget is breached', async () => {
            const mockSummary = {
                budgets: [{ category: 'All', monthlyGoal: 1000 }],
                totals: { expenses: 1200 }
            };
            summaryService.getFinancialSummary.mockResolvedValue(mockSummary);
            
            await notificationService.handleTransactionCreated({
                userId: 'user123',
                transaction: { amount: 500, type: 'expense' }
            });

            expect(logger.warn).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 'user123' }),
                expect.stringContaining('BUDGET BREACH')
            );
            
            expect(eventBus.emit).toHaveBeenCalledWith(
                EVENTS.BUDGET.BREACHED, 
                expect.objectContaining({ userId: 'user123', summary: mockSummary })
            );
        });

        it('should NOT log warning if budget is not breached', async () => {
            const mockSummary = {
                budgets: [{ category: 'All', monthlyGoal: 2000 }],
                totals: { expenses: 1200 }
            };
            summaryService.getFinancialSummary.mockResolvedValue(mockSummary);

            await notificationService.handleTransactionCreated({
                userId: 'user123',
                transaction: { amount: 100, type: 'expense' }
            });

            expect(logger.warn).not.toHaveBeenCalled();
            expect(eventBus.emit).not.toHaveBeenCalledWith(EVENTS.BUDGET.BREACHED, expect.any(Object));
        });
    });

    describe('High Value Alerts', () => {
        it('should log alert for high value transactions', async () => {
            summaryService.getFinancialSummary.mockResolvedValue({ 
                budgets: [], 
                totals: { expenses: 100 } 
            });

            await notificationService.handleTransactionCreated({
                userId: 'user123',
                transaction: { amount: 10000, type: 'expense' } // Threshold is 5000
            });

            expect(logger.info).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 'user123', amount: 10000 }),
                expect.stringContaining('High-value transaction')
            );
        });
    });

    describe('Error Handling', () => {
        it('should log error when summaryService fails', async () => {
            summaryService.getFinancialSummary.mockRejectedValue(new Error('DB Down'));

            await notificationService.handleTransactionCreated({
                userId: 'user123',
                transaction: { amount: 100, type: 'expense' }
            });

            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({ err: expect.any(Error) }),
                expect.stringContaining('Error in NotificationService')
            );
        });
    });
});

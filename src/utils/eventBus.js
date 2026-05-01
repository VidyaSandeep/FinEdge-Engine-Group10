import { EventEmitter } from 'events';
import logger from './logger.js';



/**
 * Event Names
 */
export const EVENTS = {
    TRANSACTION: {
        CREATED: 'transaction.created',
        UPDATED: 'transaction.updated',
        DELETED: 'transaction.deleted',
    },
    BUDGET: {
        BREACHED: 'budget.breached',
    },
    USER: {
        REGISTERED: 'user.registered',
        LOGIN: 'user.login',
    }
};

/**
 * Event Bus
 */
class EventBus extends EventEmitter {
    constructor() {
        super();
    }

    emit(event, ...args) {
        logger.debug({ event }, 'Event emitted');
        return super.emit(event, ...args);
    }
}

const eventBus = new EventBus();
export default eventBus;

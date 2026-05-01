import { AsyncLocalStorage } from 'async_hooks';

/**
 * AsyncLocalStorage allows us to store and retrieve request-specific data
 * (like requestId or userId) without passing it through function arguments.
 */
export const logContext = new AsyncLocalStorage();

/**
 * Helper to get the current context store.
 */
export const getContext = () => logContext.getStore() || {};

/**
 * Helper to update the current context store.
 */
export const updateContext = (newContext) => {
    const store = logContext.getStore();
    if (store) {
        Object.assign(store, newContext);
    }
};

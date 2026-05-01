import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    debug: jest.fn(),
    info: jest.fn()
  }
}));

const logger = (await import('../../../src/utils/logger.js')).default;
const cacheService = (await import('../../../src/services/cache.service.js')).default;

describe('Service - Cache Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        cacheService.clear();
    });

    it('should set and get a value', () => {
        cacheService.set('key1', 'value1');
        expect(cacheService.get('key1')).toBe('value1');
    });

    it('should return null for non-existent key', () => {
        expect(cacheService.get('nonexistent')).toBeNull();
    });

    it('should expire items based on TTL', () => {
        jest.useFakeTimers();
        
        cacheService.set('expireKey', 'expireValue', 10); // 10 seconds
        expect(cacheService.get('expireKey')).toBe('expireValue');

        // Advance time by 11 seconds
        jest.advanceTimersByTime(11000);
        
        expect(cacheService.get('expireKey')).toBeNull();
        
        jest.useRealTimers();
    });

    it('should delete a key', () => {
        cacheService.set('keyToDelete', 'value');
        cacheService.delete('keyToDelete');
        expect(cacheService.get('keyToDelete')).toBeNull();
    });

    it('should clear the entire cache', () => {
        cacheService.set('k1', 'v1');
        cacheService.set('k2', 'v2');
        cacheService.clear();
        expect(cacheService.get('k1')).toBeNull();
        expect(cacheService.get('k2')).toBeNull();
    });
});

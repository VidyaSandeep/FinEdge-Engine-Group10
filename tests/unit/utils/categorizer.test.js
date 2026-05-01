import { autoCategorize } from '../../../src/utils/categorizer.js';

describe('Utility - Categorizer', () => {
    it('should categorize based on known keywords (case-insensitive)', () => {
        expect(autoCategorize('Paid for Starbucks coffee')).toBe('Food');
        expect(autoCategorize('Uber ride to office')).toBe('Transportation');
        expect(autoCategorize('Netflix monthly subscription')).toBe('Entertainment');
    });

    it('should categorize partial matches', () => {
        expect(autoCategorize('MCDONALDS LUNCH')).toBe('Food');
        expect(autoCategorize('LYFT RIDE')).toBe('Transportation');
    });

    it('should return "Other" for unknown descriptions', () => {
        expect(autoCategorize('Miscellaneous purchase')).toBe('Other');
        expect(autoCategorize('')).toBe('Other');
    });

    it('should handle special characters or weird spacing', () => {
        expect(autoCategorize('!!! STARBUCKS !!!')).toBe('Food');
        expect(autoCategorize('   spotify   ')).toBe('Entertainment');
    });
});

/**
 * Common categorized keywords
 */
export const CATEGORY_KEYWORDS = {
    'Food': ['starbucks', 'mcdonalds', 'restaurant', 'coffee', 'pizza', 'burger', 'cafe', 'grocery', 'supermarket'],
    'Transportation': ['uber', 'lyft', 'gas', 'petrol', 'train', 'bus', 'taxi', 'metro'],
    'Entertainment': ['netflix', 'spotify', 'cinema', 'movie', 'game', 'concert', 'steam'],
    'Utilities': ['rent', 'electricity', 'water', 'internet', 'mobile', 'phone', 'bill'],
    'Health': ['pharmacy', 'hospital', 'doctor', 'gym', 'fitness', 'medical'],
};

/**
 * Templates for financial advice
 */
export const SAVING_TIPS_TEMPLATES = {
    'OVERALL_EXCEEDED': 'Warning: You have exceeded your total monthly budget goal.',
    'OVERALL_CAUTION': 'Caution: You have used over {threshold}% of your monthly budget.',
    'OVERALL_GOOD': 'Great job! You are well within your budget this month.',
    'Food': 'Food expenses are high. Meal prepping could save you significantly.',
    'Entertainment': 'You spent a lot on Entertainment. Consider free local events next month.',
    'Transportation': 'Transport costs are rising. Have you considered a monthly pass or carpooling?',
    'Utilities': 'Utilities are a fixed cost, but small habits (like turning off lights) add up.',
    'Shopping': 'Shopping can be impulsive. Try the 48-hour rule before buying non-essentials.',
    'Default': 'You are spending more than usual in this category. Review your recent transactions.'
};

/**
 * Thresholds for triggering tips
 */
export const THRESHOLDS = {
    CAUTION: 0.8,    // 80%
    CRITICAL: 1.0,   // 100%
    HIGH_SPENDING_ABSOLUTE: 1000,
    MAXIMUM_SINGLE_TRANSACTION_EXPENSE: 5000
};

export const CURRENCIES = {
    USD: {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$'
    },
    GBP: {
        code: 'GBP',
        name: 'British Pound',
        symbol: '£'
    },
    EUR: {
        code: 'EUR',
        name: 'Euro',
        symbol: '€'
    },
};

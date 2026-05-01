import { CATEGORY_KEYWORDS } from '../constants/constants.js';

/**
 * Check description for keywords and suggest a category.
 * @param {string} description 
 * @returns {string} Suggested category or 'Other'
 */
export function autoCategorize(description) {
    if (!description) return 'Other';

    const lowerDesc = description.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(keyword => lowerDesc.includes(keyword))) {
            return category;
        }
    }
    return 'Other';
}

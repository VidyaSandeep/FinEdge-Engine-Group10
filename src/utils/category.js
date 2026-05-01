/**
 * Normalizes a category string to Title Case (e.g., "food" -> "Food").
 * Also trims whitespace.
 * 
 * @param {string} category 
 * @returns {string}
 */
export function normalizeCategory(category) {
    if (!category) return 'All';
    const trimmed = category.trim();
    if (!trimmed) return 'All';
    
    // Special case for 'All'
    if (trimmed.toLowerCase() === 'all') return 'All';

    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Client-side utility functions (formatters, validators, date helpers).
 */

/**
 * Formats an ISO date string into a user-friendly localized format.
 *
 * @param {string | Date} date - Date to format
 * @returns {string} Formatted localized string
 */
export function formatDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}


/**
 * habitHelpers.js
 * ----------------
 * Pure utility functions for date handling and streak calculations.
 * Avoids direct dependencies on the system clock where possible,
 * enabling precise unit testing and resolving code quality smells.
 */

/**
 * Parse a YYYY-MM-DD date string timezone-safely into a local Date object.
 * Prevents UTC timezone shifting.
 * 
 * @param {string} dateStr - e.g. "2026-06-19"
 * @returns {Date}
 */
export function parseLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") {
    return new Date();
  }
  return new Date(dateStr + "T00:00:00");
}

/**
 * Generate a YYYY-MM-DD date string.
 * 
 * @param {Date} [date] - Optional date object, defaults to now.
 * @returns {string}
 */
export function todayString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/**
 * Calculate the next streak based on the last activity date, the current streak,
 * and the current today date string.
 * 
 * Timezone-safe and resilient to Daylight Saving Time (DST) changes.
 * 
 * @param {string|null} lastDate - e.g. "2026-06-18" or null
 * @param {number} currentStreak
 * @param {string} today - e.g. "2026-06-19"
 * @returns {number} next streak count
 */
export function nextStreak(lastDate, currentStreak, today) {
  if (!lastDate) return 1;
  if (lastDate === today) return currentStreak;

  const last = parseLocalDate(lastDate);
  const current = parseLocalDate(today);

  // Time difference in milliseconds
  const diffTime = current.getTime() - last.getTime();
  
  // Convert to days, rounding to the nearest integer to absorb DST +/- 1 hour deviations
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return diffDays === 1 ? currentStreak + 1 : 1;
}

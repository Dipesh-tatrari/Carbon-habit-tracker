/**
 * chartData.js
 * -------------
 * Aggregates the raw `habits` array (one entry per logged activity) into
 * per-day totals for the TrendsChart. Pure function, no React/recharts
 * imports — easy to test independently.
 */

/**
 * Build a daily series for the last `days` days (oldest first), summing
 * CO2 saved (kg) and Eco-points earned per day. Days with no entries
 * still appear with zero values, so the chart shows gaps accurately.
 *
 * @param {Array} habits - entries from HabitContext, each with
 *   { date: "YYYY-MM-DD", savedG: number, points: number }
 * @param {number} days - how many days back to include (default 7)
 * @returns {Array<{ date: string, label: string, savedKg: number, points: number }>}
 */
export function getDailyTrends(habits, days = 7) {
  const series = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    const dayEntries = habits.filter((h) => h.date === dateStr);
    const savedG = dayEntries.reduce((sum, h) => sum + (h.savedG || 0), 0);
    const points = dayEntries.reduce((sum, h) => sum + (h.points || 0), 0);

    series.push({
      date: dateStr,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      shortDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      savedKg: Math.round((savedG / 1000) * 100) / 100,
      points,
    });
  }

  return series;
}

/**
 * Build a calendar-heatmap grid (GitHub-contributions style) for the last
 * `weeks` weeks, ending today. Weeks run Sunday -> Saturday; the first
 * week is left-padded with `null` cells if the range doesn't start on a
 * Sunday, and the last week is right-padded to a full 7 days.
 *
 * Each real cell is:
 *   { date: "YYYY-MM-DD", count: number, savedKg: number, level: 0-3 }
 *
 * `level` buckets the day's activity count for coloring:
 *   0 entries -> 0   (empty)
 *   1 entry   -> 1   (light)
 *   2 entries -> 2   (medium)
 *   3+ entries-> 3   (full glow)
 *
 * @param {Array} habits - entries from HabitContext
 * @param {number} weeks - how many weeks of history to include (default 12)
 * @returns {Array<Array<{date,count,savedKg,level}|null>>} weeks of 7 days
 */
/**
 * Build a calendar-heatmap grid (GitHub-contributions style).
 *
 * FIXES applied:
 *   1. All dates use local time (not UTC/toISOString) so today's cell is
 *      always correct regardless of timezone (e.g. IST UTC+5:30).
 *   2. The grid always starts on the Sunday that contains the day
 *      `weeks * 7` days ago — so every month always shows its full
 *      week-aligned range, no days are eaten by padding.
 *   3. Future cells in the current week are rendered as null (empty) so
 *      the grid never shows dates beyond today.
 *   4. Month labels are placed at the first Sunday of each month, or the
 *      first cell if the month starts mid-week — guaranteed non-overlapping.
 *
 * Each real cell:
 *   { date: "YYYY-MM-DD", count: number, savedKg: number, level: 0-3 }
 * Padding cells: null
 *
 * @param {Array}  habits - entries from HabitContext
 * @param {number} weeks  - number of week columns to show (default 12)
 * @returns {Array<Array<cell|null>>} array of weeks, each 7 days Sun->Sat
 */
export function getHeatmapData(habits, weeks = 12) {
  // --- 1. Timezone-safe "today" -------------------------------------------
  // Never use toISOString() — it converts to UTC which can be tomorrow or
  // yesterday depending on local timezone offset.
  const now = new Date();
  const todayStr = localDateStr(now);

  // --- 2. Grid start = Sunday of the week that was `weeks` weeks ago ------
  // This ensures every week column is complete (Sun-Sat) with no days lost
  // to left-padding, and April always starts on its correct week.
  const anchorDate = new Date(now);
  anchorDate.setDate(anchorDate.getDate() - weeks * 7);
  // Rewind to the Sunday of that week
  anchorDate.setDate(anchorDate.getDate() - anchorDate.getDay());

  // --- 3. Build lookup: local-date-string -> { count, savedG } ------------
  const byDate = {};
  for (const h of habits) {
    // h.date is already "YYYY-MM-DD" stored as local date — use directly.
    if (!byDate[h.date]) byDate[h.date] = { count: 0, savedG: 0 };
    byDate[h.date].count += 1;
    byDate[h.date].savedG += h.savedG || 0;
  }

  // --- 4. Walk day by day from anchorDate, building week columns ----------
  const weeksGrid = [];
  const cursor = new Date(anchorDate);

  for (let w = 0; w < weeks + 1; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = localDateStr(cursor);

      // Future dates (beyond today) → null padding
      if (cursor > now) {
        week.push(null);
      } else {
        const day = byDate[dateStr] || { count: 0, savedG: 0 };
        week.push({
          date: dateStr,
          count: day.count,
          savedKg: Math.round((day.savedG / 1000) * 100) / 100,
          level: levelForCount(day.count),
          isToday: dateStr === todayStr,
        });
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    // Only include week columns that have at least one real cell
    if (week.some((c) => c !== null)) {
      weeksGrid.push(week);
    }
  }

  return weeksGrid;
}

/**
 * Return a "YYYY-MM-DD" string in LOCAL time — never use toISOString()
 * for calendar dates because it converts to UTC.
 */
function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function levelForCount(count) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
}

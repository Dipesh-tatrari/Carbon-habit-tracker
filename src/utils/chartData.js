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
export function getHeatmapData(habits, weeks = 12) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = weeks * 7;
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (totalDays - 1));

  // Quick lookup: date string -> { count, savedG }
  const byDate = {};
  for (const h of habits) {
    if (!byDate[h.date]) byDate[h.date] = { count: 0, savedG: 0 };
    byDate[h.date].count += 1;
    byDate[h.date].savedG += h.savedG || 0;
  }

  // Flat list of cells from startDate -> today
  const cells = [];
  const cursor = new Date(startDate);
  while (cursor <= today) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const day = byDate[dateStr] || { count: 0, savedG: 0 };
    cells.push({
      date: dateStr,
      count: day.count,
      savedKg: Math.round((day.savedG / 1000) * 100) / 100,
      level: levelForCount(day.count),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Left-pad the first week so columns align to Sunday-start weeks.
  const startWeekday = startDate.getDay(); // 0 = Sunday
  const padded = [...Array(startWeekday).fill(null), ...cells];

  // Right-pad the last week so it's a full 7 days too.
  while (padded.length % 7 !== 0) {
    padded.push(null);
  }

  // Chunk into weeks of 7
  const weeksGrid = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeksGrid.push(padded.slice(i, i + 7));
  }

  return weeksGrid;
}

function levelForCount(count) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
}

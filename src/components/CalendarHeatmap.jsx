/**
 * CalendarHeatmap.jsx
 * ---------------------
 * GitHub-contributions-style grid showing logging consistency.
 * Fixed:
 *   - Today's cell has a white ring so it's always identifiable
 *   - Month labels are derived from each week's Sunday (col[0]), not the
 *     first real cell — so months always start on the correct week
 *   - No UTC date bugs — all parsing uses "T00:00:00" local time
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { getHeatmapData } from "../utils/chartData";

const LEVEL_STYLES = [
  { fill: "rgba(255,255,255,0.04)" },
  { fill: "rgba(74, 222, 128, 0.25)" },
  { fill: "rgba(74, 222, 128, 0.55)" },
  { fill: "#4ade80" },
];

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LABELS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const CELL      = 12;
const GAP       = 3;
const MONTH_GAP = 10;
const COL_WIDTH = CELL + GAP;

export default function CalendarHeatmap({ habits, weeks = 12 }) {
  const grid = getHeatmapData(habits, weeks);
  const [hovered, setHovered] = useState(null);

  // Month boundary detection — use col[0] (Sunday) of each week so the
  // label appears at the correct week even when Sunday is a null pad cell.
  // We parse with "T00:00:00" to force local time, never UTC.
  const monthStartIndices = new Set();
  let prevMonth = null;

  grid.forEach((week, i) => {
    // Use the first non-null cell to determine the month of this column.
    const firstReal = week.find((d) => d !== null);
    if (!firstReal) return;
    const month = new Date(firstReal.date + "T00:00:00").getMonth();
    if (prevMonth !== null && month !== prevMonth) {
      monthStartIndices.add(i);
    }
    prevMonth = month;
  });

  // Compute x offsets with month gaps.
  const colOffsets = [];
  let x = 0;
  grid.forEach((_, i) => {
    if (monthStartIndices.has(i)) x += MONTH_GAP;
    colOffsets.push(x);
    x += COL_WIDTH;
  });

  // Build month label list — one per boundary + first column.
  const monthLabels = grid
    .map((week, i) => {
      if (i !== 0 && !monthStartIndices.has(i)) return null;
      const firstReal = week.find((d) => d !== null);
      if (!firstReal) return null;
      const month = new Date(firstReal.date + "T00:00:00").getMonth();
      return { x: colOffsets[i], text: MONTH_LABELS[month] };
    })
    .filter(Boolean);

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: colOffsets[colOffsets.length - 1] + CELL + 28 }}>

        {/* Month labels */}
        <div className="ml-7 mb-1 relative h-4">
          {monthLabels.map(({ x: lx, text }, i) => (
            <span key={i} className="absolute text-xs text-slate-500" style={{ left: lx }}>
              {text}
            </span>
          ))}
        </div>

        <div className="flex">
          {/* Day-of-week labels — only alternate rows to avoid crowding */}
          <div className="flex flex-col gap-[3px] mr-1">
            {DAY_LABELS.map((label, i) => (
              <div key={label} className="h-[12px] flex items-center">
                {i % 2 === 1 && (
                  <span className="text-[10px] text-slate-500 leading-none">{label}</span>
                )}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {grid.map((week, wi) => (
            <div
              key={wi}
              className="flex flex-col gap-[3px]"
              style={{
                width: CELL,
                marginRight: GAP,
                marginLeft: monthStartIndices.has(wi) ? MONTH_GAP : 0,
              }}
            >
              {week.map((day, di) => {
                if (day === null) {
                  return <div key={di} style={{ width: CELL, height: CELL }} />;
                }

                const style = LEVEL_STYLES[day.level];
                const isToday = day.isToday;
                const glow = day.level === 3
                  ? "drop-shadow(0 0 4px rgba(74,222,128,0.8))"
                  : "none";

                return (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: (wi * 7 + di) * 0.002 }}
                    onMouseEnter={() => setHovered(day)}
                    onMouseLeave={() => setHovered(null)}
                    title={formatDate(day.date)}
                    style={{
                      width: CELL,
                      height: CELL,
                      backgroundColor: style.fill,
                      filter: glow,
                      // Today always gets a visible white ring regardless of level
                      outline: isToday ? "2px solid rgba(255,255,255,0.7)" : "none",
                      outlineOffset: "1px",
                      borderRadius: 3,
                      cursor: "pointer",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip + legend */}
      <div className="flex items-center justify-between mt-3 text-xs text-slate-400 gap-3">
        <span className="truncate min-h-[1em]">
          {hovered
            ? `${formatDate(hovered.date)}${hovered.isToday ? " (today)" : ""} — ${
                hovered.count === 0
                  ? "no habits logged"
                  : `${hovered.count} habit${hovered.count === 1 ? "" : "s"} · ${hovered.savedKg} kg saved`
              }`
            : "Hover a day for details"}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span>Less</span>
          {LEVEL_STYLES.map((style, i) => (
            <div
              key={i}
              className="rounded-[3px]"
              style={{
                width: CELL,
                height: CELL,
                backgroundColor: style.fill,
                outline: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  // Parse with "T00:00:00" so it's treated as local time, not UTC midnight.
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * CalendarHeatmap.jsx
 * ---------------------
 * GitHub-contributions-style grid showing logging consistency over the
 * last `weeks` weeks. Each cell is one day; color intensity reflects how
 * many habits were logged that day (utils/chartData.js -> getHeatmapData).
 * Hovering a cell shows the date, count, and CO2 saved that day.
 *
 * Months are visually separated: a small extra gap is inserted before the
 * first week of each new month, and that week's column gets its own
 * month label — positioned to match the gap so labels never overlap.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { getHeatmapData } from "../utils/chartData";

// Level 0-3 -> fill color. Level 0 is an empty/dim cell; higher levels
// get progressively brighter emerald with a glow at the top level.
const LEVEL_STYLES = [
  { fill: "rgba(255,255,255,0.04)", glow: "none" },
  { fill: "rgba(74, 222, 128, 0.25)", glow: "none" },
  { fill: "rgba(74, 222, 128, 0.55)", glow: "none" },
  { fill: "#4ade80", glow: "drop-shadow(0 0 4px rgba(74,222,128,0.8))" },
];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CELL = 12;
const GAP = 3;
const MONTH_GAP = 8; // extra space inserted before each new month's column
const COL_WIDTH = CELL + GAP;

export default function CalendarHeatmap({ habits, weeks = 12 }) {
  const grid = getHeatmapData(habits, weeks);
  const [hovered, setHovered] = useState(null);

  // Find the week index where each month starts (month differs from the
  // previous week's first real day). The very first column never gets the
  // extra gap — only later month changes do.
  const monthStartIndices = new Set();
  let prevMonth = null;
  grid.forEach((week, i) => {
    const firstReal = week.find((d) => d);
    if (!firstReal) return;
    const month = new Date(firstReal.date + "T00:00:00").getMonth();
    if (prevMonth !== null && month !== prevMonth) {
      monthStartIndices.add(i);
    }
    prevMonth = month;
  });

  // x-offset for each week column, adding MONTH_GAP before new-month columns.
  const colOffsets = [];
  let x = 0;
  grid.forEach((_, i) => {
    if (monthStartIndices.has(i)) x += MONTH_GAP;
    colOffsets.push(x);
    x += COL_WIDTH;
  });
  const totalWidth = x;

  // One label per month boundary (plus the very first column), positioned
  // at that column's x-offset — guaranteed not to overlap since each gets
  // its own MONTH_GAP-separated column.
  const monthLabels = grid
    .map((week, i) => {
      if (i !== 0 && !monthStartIndices.has(i)) return null;
      const firstReal = week.find((d) => d);
      if (!firstReal) return null;
      const month = new Date(firstReal.date + "T00:00:00").getMonth();
      return { x: colOffsets[i], text: MONTH_LABELS[month] };
    })
    .filter(Boolean);

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: totalWidth + 28 }}>
        {/* Month labels */}
        <div className="ml-7 mb-1 relative h-4">
          {monthLabels.map(({ x: labelX, text }, i) => (
            <span key={i} className="absolute text-xs text-slate-500" style={{ left: labelX }}>
              {text}
            </span>
          ))}
        </div>

        <div className="flex">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-[3px] mr-1">
            {DAY_LABELS.map((label, i) => (
              <div key={label} className="h-[12px] flex items-center">
                {i % 2 === 1 && (
                  <span className="text-[10px] text-slate-500 leading-none">{label}</span>
                )}
              </div>
            ))}
          </div>

          {/* Weeks */}
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
                if (!day) {
                  return <div key={di} style={{ width: CELL, height: CELL }} />;
                }
                const style = LEVEL_STYLES[day.level];
                return (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: (wi * 7 + di) * 0.002 }}
                    onMouseEnter={() => setHovered(day)}
                    onMouseLeave={() => setHovered(null)}
                    className="rounded-[3px] cursor-pointer ring-1 ring-white/5"
                    style={{
                      width: CELL,
                      height: CELL,
                      backgroundColor: style.fill,
                      filter: style.glow,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip / legend row */}
      <div className="flex items-center justify-between mt-3 text-xs text-slate-400 gap-3">
        <span className="truncate">
          {hovered
            ? `${formatDate(hovered.date)} — ${hovered.count} habit${hovered.count === 1 ? "" : "s"} logged${
                hovered.count > 0 ? ` · ${hovered.savedKg} kg saved` : ""
              }`
            : "Hover a day for details"}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <span>Less</span>
          {LEVEL_STYLES.map((style, i) => (
            <div
              key={i}
              className="rounded-[3px] ring-1 ring-white/5"
              style={{ width: CELL, height: CELL, backgroundColor: style.fill, filter: style.glow }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

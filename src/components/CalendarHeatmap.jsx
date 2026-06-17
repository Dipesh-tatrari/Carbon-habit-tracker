/**
 * CalendarHeatmap.jsx
 * ---------------------
 * GitHub-contributions-style grid showing logging consistency.
 *
 * Month label fix: labels are positioned at the FIRST CELL OF THE NEW MONTH
 * within its week column — not at the column's Sunday — so "Jun" never
 * sits over May's last week. We calculate this by scanning each boundary
 * week for the day-index where the month number first changes.
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

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LABELS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const CELL      = 12;  // px — cell size
const GAP       = 3;   // px — gap between cells / columns
const MONTH_GAP = 10;  // px — extra gap inserted before first week of new month
const COL_STEP  = CELL + GAP; // total width consumed per week column

export default function CalendarHeatmap({ habits, weeks = 12 }) {
  const grid = getHeatmapData(habits, weeks);
  const [hovered, setHovered] = useState(null);

  // ── 1. Identify which week columns start a new month ──────────────────
  // A column starts a new month when its first real day has a different
  // month than the last real day of the previous column.
  const monthStartCols = new Set();
  for (let wi = 1; wi < grid.length; wi++) {
    const prevLast = [...grid[wi - 1]].reverse().find((d) => d !== null);
    const curFirst = grid[wi].find((d) => d !== null);
    if (!prevLast || !curFirst) continue;
    const prevMonth = new Date(prevLast.date + "T00:00:00").getMonth();
    const curMonth  = new Date(curFirst.date + "T00:00:00").getMonth();
    if (curMonth !== prevMonth) monthStartCols.add(wi);
  }

  // ── 2. Compute pixel x-offset for each week column ────────────────────
  // MONTH_GAP is added BEFORE the column that starts a new month, so the
  // column's own offset already includes it.
  const colX = [];
  let x = 0;
  for (let wi = 0; wi < grid.length; wi++) {
    if (monthStartCols.has(wi)) x += MONTH_GAP;
    colX.push(x);
    x += COL_STEP;
  }

  // ── 3. Build month labels ─────────────────────────────────────────────
  // For each label, find the EXACT day-index within its week where the new
  // month begins, then position the label at:
  //   colX[wi]  (the column's left edge, already past the MONTH_GAP)
  // This guarantees "Jun" sits above Jun 1's column, not May's last week.
  const monthLabels = [];

  function addLabel(wi) {
    const week = grid[wi];
    if (!week) return;

    // For the very first column use its first real day's month.
    // For boundary columns find the first day whose month differs from the
    // previous column's last day.
    let targetMonth;
    if (wi === 0) {
      const first = week.find((d) => d !== null);
      if (!first) return;
      targetMonth = new Date(first.date + "T00:00:00").getMonth();
    } else {
      const prevLast = [...grid[wi - 1]].reverse().find((d) => d !== null);
      if (!prevLast) return;
      const prevMonth = new Date(prevLast.date + "T00:00:00").getMonth();
      const firstNew = week.find(
        (d) => d !== null && new Date(d.date + "T00:00:00").getMonth() !== prevMonth
      );
      if (!firstNew) return;
      targetMonth = new Date(firstNew.date + "T00:00:00").getMonth();
    }

    monthLabels.push({ x: colX[wi], text: MONTH_NAMES[targetMonth] });
  }

  addLabel(0);
  monthStartCols.forEach((wi) => addLabel(wi));
  // Sort by x so labels render left→right
  monthLabels.sort((a, b) => a.x - b.x);

  const totalWidth = x; // total grid width in px

  // ── 4. Render ─────────────────────────────────────────────────────────
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: totalWidth + 30 }}>

        {/* Month labels */}
        <div className="ml-7 mb-1 relative h-4">
          {monthLabels.map(({ x: lx, text }, i) => (
            <span
              key={i}
              className="absolute text-xs text-slate-400 font-medium"
              style={{ left: lx }}
            >
              {text}
            </span>
          ))}
        </div>

        <div className="flex">
          {/* Day-of-week labels — alternate rows only to avoid crowding */}
          <div className="flex flex-col gap-[3px] mr-1 shrink-0">
            {DAY_LABELS.map((label, i) => (
              <div key={label} style={{ height: CELL }} className="flex items-center">
                {i % 2 === 1 && (
                  <span className="text-[10px] text-slate-500 leading-none">{label}</span>
                )}
              </div>
            ))}
          </div>

          {/* Week columns — positioned absolutely so MONTH_GAP works correctly */}
          <div className="relative" style={{ height: 7 * CELL + 6 * GAP, width: totalWidth }}>
            {grid.map((week, wi) => (
              <div
                key={wi}
                className="absolute flex flex-col"
                style={{ left: colX[wi], top: 0, gap: GAP, width: CELL }}
              >
                {week.map((day, di) => {
                  if (day === null) {
                    return <div key={di} style={{ width: CELL, height: CELL }} />;
                  }

                  const { fill } = LEVEL_STYLES[day.level];
                  const glowFilter =
                    day.level === 3
                      ? "drop-shadow(0 0 4px rgba(74,222,128,0.8))"
                      : "none";

                  return (
                    <motion.div
                      key={day.date}
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.18, delay: (wi * 7 + di) * 0.002 }}
                      onMouseEnter={() => setHovered(day)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        width: CELL,
                        height: CELL,
                        backgroundColor: fill,
                        filter: glowFilter,
                        borderRadius: 3,
                        cursor: "pointer",
                        // Today: white ring, always visible
                        outline: day.isToday
                          ? "2px solid rgba(255,255,255,0.75)"
                          : "1px solid rgba(255,255,255,0.06)",
                        outlineOffset: day.isToday ? "1px" : "0px",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip + legend */}
      <div className="flex items-center justify-between mt-3 text-xs text-slate-400 gap-3">
        <span className="truncate min-h-[1em]">
          {hovered
            ? `${formatDate(hovered.date)}${hovered.isToday ? " (today)" : ""} — ${
                hovered.count === 0
                  ? "no habits logged"
                  : `${hovered.count} habit${hovered.count === 1 ? "" : "s"} · ${hovered.savedKg} kg CO₂ saved`
              }`
            : "Hover a day for details"}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span>Less</span>
          {LEVEL_STYLES.map(({ fill }, i) => (
            <div
              key={i}
              style={{
                width: CELL,
                height: CELL,
                backgroundColor: fill,
                borderRadius: 3,
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
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * CalendarHeatmap.jsx
 * ---------------------
 * GitHub-contributions-style grid with months clearly separated.
 *
 * Key fix: weeks that span two months are SPLIT at the month boundary.
 * The days before the boundary go into the old month's group; the days
 * from the boundary onward go into the new month's group. This means
 * Jun 1 always appears inside the "Jun" block, never inside "May".
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { getHeatmapData } from "../utils/chartData";
import { parseLocalDate } from "../utils/habitHelpers";

const LEVEL_STYLES = [
  { fill: "rgba(255,255,255,0.05)" },
  { fill: "rgba(74,222,128,0.25)"  },
  { fill: "rgba(74,222,128,0.55)"  },
  { fill: "#4ade80"                },
];

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun",
                     "Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LABELS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const CELL = 13;
const GAP  = 3;

/**
 * Split a week array at the first day-index where the month changes.
 * Returns [beforeSlice, afterSlice] where either can be empty ([]).
 * Null padding cells take the month of the nearest real neighbour.
 *
 * Example: [null, May29, May30, May31, Jun1, Jun2, Jun3]
 *   -> before = [null, May29, May30, May31]   (col stays in May group)
 *   -> after  = [Jun1, Jun2, Jun3]             (new col in Jun group)
 *   Both slices are padded with nulls to stay 7 cells tall.
 */
function splitWeekAtMonthBoundary(week) {
  let splitIdx = -1;
  let prevMonth = null;

  for (let i = 0; i < week.length; i++) {
    if (!week[i]) continue;
    const m = parseLocalDate(week[i].date).getMonth();
    if (prevMonth !== null && m !== prevMonth) {
      splitIdx = i;
      break;
    }
    prevMonth = m;
  }

  if (splitIdx === -1) return [week, []]; // no split needed

  const before = week.slice(0, splitIdx)
    .concat(Array(7 - splitIdx).fill(null));          // pad to 7
  const after  = Array(splitIdx).fill(null)
    .concat(week.slice(splitIdx));                     // pad top with nulls

  return [before, after];
}

/**
 * Build month groups from the raw grid.
 * Each group: { name: string, cols: Array<Array<cell|null>> }
 * where each col is a 7-element array (Sun→Sat).
 *
 * Mixed weeks are split so every cell lands in the correct group.
 */
function buildMonthGroups(grid) {
  const groups = [];

  const pushToGroup = (monthIdx, col) => {
    const name = MONTH_NAMES[monthIdx];
    if (groups.length === 0 || groups[groups.length - 1].month !== monthIdx) {
      groups.push({ month: monthIdx, name, cols: [col] });
    } else {
      groups[groups.length - 1].cols.push(col);
    }
  };

  for (const week of grid) {
    const [before, after] = splitWeekAtMonthBoundary(week);

    // Determine month of `before` slice
    const beforeReal = before.find((d) => d !== null);
    if (beforeReal) {
      const m = parseLocalDate(beforeReal.date).getMonth();
      pushToGroup(m, before);
    }

    // Determine month of `after` slice (if it exists)
    if (after.length > 0) {
      const afterReal = after.find((d) => d !== null);
      if (afterReal) {
        const m = parseLocalDate(afterReal.date).getMonth();
        pushToGroup(m, after);
      }
    }
  }

  return groups;
}

export default function CalendarHeatmap({ habits, weeks = 12 }) {
  const grid = useMemo(() => getHeatmapData(habits, weeks), [habits, weeks]);
  const [hovered, setHovered] = useState(null);
  const [focusedDate, setFocusedDate] = useState(null);

  const groups = useMemo(() => buildMonthGroups(grid), [grid]);

  return (
    <div className="overflow-x-auto pb-1">
      <div 
        className="inline-flex flex-col min-w-max"
        role="grid"
        aria-label="Habit logging history calendar"
      >

        {/* Grid: day labels + month groups */}
        <div className="flex items-start" role="row">

          {/* Day-of-week labels */}
          <div
            className="flex flex-col shrink-0 mr-2"
            style={{ gap: GAP, paddingTop: 22 }}
          >
            {DAY_LABELS.map((label, i) => (
              <div
                key={label}
                className="flex items-center justify-end"
                style={{ height: CELL }}
              >
                {(i === 1 || i === 3 || i === 5) && (
                  <span className="text-[10px] text-slate-500 leading-none pr-1">
                    {label}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Month groups */}
          {groups.map((group, gi) => (
            <div
              key={`${group.name}-${gi}`}
              className="flex flex-col"
              style={{
                borderLeft: gi > 0
                  ? "2px solid rgba(255,255,255,0.12)"
                  : "none",
                paddingLeft: gi > 0 ? 8 : 0,
                marginLeft: gi > 0 ? 8 : 0,
              }}
            >
              {/* Month label */}
              <div
                className="text-xs font-semibold text-slate-300 mb-1.5"
                style={{ height: 16 }}
              >
                {group.name}
              </div>

              {/* Columns for this month */}
              <div className="flex" style={{ gap: GAP }}>
                {group.cols.map((col, ci) => (
                  <div
                    key={ci}
                    className="flex flex-col"
                    style={{ gap: GAP, width: CELL }}
                  >
                    {col.map((day, di) => {
                      if (day === null) {
                        return (
                          <div
                            key={di}
                            style={{ width: CELL, height: CELL }}
                          />
                        );
                      }

                      const { fill } = LEVEL_STYLES[day.level];
                      const glowFilter =
                        day.level === 3
                          ? "drop-shadow(0 0 5px rgba(74,222,128,0.85))"
                          : "none";

                      const dayLabel = `${formatDate(day.date)}${day.isToday ? " (today)" : ""}: ${
                        day.count === 0
                          ? "no habits logged"
                          : `${day.count} habit${day.count === 1 ? "" : "s"} logged, ${day.savedKg} kg CO₂ saved`
                      }`;

                      return (
                        <motion.div
                          key={day.date}
                          role="gridcell"
                          tabIndex={0}
                          aria-label={dayLabel}
                          initial={{ opacity: 0, scale: 0.4 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.18,
                            delay: (gi * 40 + ci * 7 + di) * 0.002,
                          }}
                          onMouseEnter={() => setHovered(day)}
                          onMouseLeave={() => setHovered(null)}
                          onFocus={() => {
                            setHovered(day);
                            setFocusedDate(day.date);
                          }}
                          onBlur={() => {
                            setHovered(null);
                            setFocusedDate(null);
                          }}
                          style={{
                            width: CELL,
                            height: CELL,
                            backgroundColor: fill,
                            filter: glowFilter,
                            borderRadius: 3,
                            cursor: "pointer",
                            outline: focusedDate === day.date
                              ? "2px solid #4ade80"
                              : day.isToday
                              ? "2px solid rgba(255,255,255,0.9)"
                              : "1px solid rgba(255,255,255,0.07)",
                            outlineOffset: (focusedDate === day.date || day.isToday) ? "1px" : "0px",
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tooltip + legend */}
        <div className="flex items-center justify-between mt-3 text-xs text-slate-400 gap-4">
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
                  outline: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}
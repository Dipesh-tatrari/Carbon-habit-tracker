/**
 * StreakTrail.jsx
 * ----------------
 * Signature visual: a winding contour-line "trail" showing the last 7
 * days. Filled, glowing waypoints mark days the user logged a habit.
 * Waypoints animate in with a staggered pop via Framer Motion.
 */

import { motion } from "framer-motion";

const TRAIL_POINTS = [
  { x: 30, y: 70 },
  { x: 145, y: 100 },
  { x: 260, y: 100 },
  { x: 375, y: 70 },
  { x: 490, y: 40 },
  { x: 605, y: 40 },
  { x: 690, y: 70 },
];

export default function StreakTrail({ habits }) {
  const days = getLastNDays(7);
  const loggedDates = new Set(habits.map((h) => h.date));
  const pathD = "M " + TRAIL_POINTS.map((p) => `${p.x},${p.y}`).join(" L ");

  const srSummary = days
    .map((d) => {
      const completed = loggedDates.has(d.date);
      return `${d.label}: ${completed ? "logged" : "no activity"}`;
    })
    .join(", ");

  return (
    <div className="relative">
      <span className="sr-only">
        7-day streak trail details: {srSummary}
      </span>
      <svg viewBox="0 0 720 150" className="w-full h-auto" role="img" aria-label="7-day streak trail" aria-hidden="true">
      {/* faint contour lines for texture */}
      <path d={offsetPath(pathD, -16)} fill="none" stroke="#334155" strokeWidth="1" opacity="0.5" />
      <path d={offsetPath(pathD, 16)} fill="none" stroke="#334155" strokeWidth="1" opacity="0.5" />
      {/* main trail */}
      <path d={pathD} fill="none" stroke="#334155" strokeWidth="2" />

      {TRAIL_POINTS.map((p, i) => {
        const completed = loggedDates.has(days[i].date);
        const isToday = i === TRAIL_POINTS.length - 1;
        return (
          <g key={days[i].date}>
            <motion.circle
              cx={p.x}
              cy={p.y}
              r={completed ? 9 : 7}
              fill={completed ? "#34D399" : "#1e293b"}
              stroke={completed ? "#4ade80" : "#475569"}
              strokeWidth="2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                filter: completed
                  ? [
                      "drop-shadow(0 0 0px rgba(163,230,53,0))",
                      "drop-shadow(0 0 6px rgba(163,230,53,0.8))",
                      "drop-shadow(0 0 0px rgba(163,230,53,0))",
                    ]
                  : "none",
              }}
              transition={{
                scale: { delay: i * 0.06, type: "spring", stiffness: 300, damping: 20 },
                opacity: { delay: i * 0.06 },
                filter: completed ? { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.06 } : {},
              }}
              style={{ transformOrigin: `${p.x}px ${p.y}px` }}
            />
            {completed && <circle cx={p.x} cy={p.y} r="3" fill="#bef264" />}
            <text
              x={p.x}
              y={p.y + 32}
              textAnchor="middle"
              fontSize="13"
              fontFamily="Inter, sans-serif"
              fill="#94a3b8"
              fontWeight={isToday ? "600" : "400"}
            >
              {days[i].label}
            </text>
          </g>
        );
      })}
      </svg>
    </div>
  );
}

/** Returns the last n days (oldest first) as { date: "YYYY-MM-DD", label: "Mon" } */
function getLastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
    });
  }
  return days;
}

/** Cheap vertical offset of a polyline path, used for the faint contour lines. */
function offsetPath(pathD, dy) {
  return pathD.replace(/(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/g, (_, x, __, y) => {
    return `${x},${Number(y) + dy}`;
  });
}

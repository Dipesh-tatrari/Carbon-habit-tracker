/**
 * TrendsChart.jsx
 * ----------------
 * Trend of CO2 saved (kg) over `days` days (7 or 30), rendered as a
 * glowing area chart. Styled to match the Green Limelight dark theme —
 * transparent background, slate grid lines, emerald/lime gradient fill,
 * and a glass-style tooltip. For ranges > 14 days, ticks are thinned and
 * point markers are hidden to avoid clutter.
 */

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getDailyTrends } from "../utils/chartData";

export default function TrendsChart({ habits, days = 7 }) {
  const data = useMemo(() => getDailyTrends(habits, days), [habits, days]);
  const hasData = useMemo(() => data.some((d) => d.savedKg > 0), [data]);

  if (!hasData) {
    return (
      <p className="text-slate-400 text-sm">
        Log a few habits over the next few days to see your trend here.
      </p>
    );
  }

  // For longer ranges, use "Jun 5" style labels and thin out the ticks so
  // the axis doesn't get crowded; for 7 days, show every weekday name.
  const labelKey = days > 7 ? "shortDate" : "label";
  const tickInterval = days > 14 ? Math.ceil(days / 8) : 0;

  return (
    <div className="h-56 sm:h-64 -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="savedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#1e293b" vertical={false} />

          <XAxis
            dataKey={labelKey}
            tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "Inter, sans-serif" }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
            interval={tickInterval}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => `${v}kg`}
          />

          <Tooltip
            cursor={{ stroke: "#4ade80", strokeWidth: 1, strokeDasharray: "4 4" }}
            contentStyle={{
              backgroundColor: "rgba(30, 41, 59, 0.9)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              backdropFilter: "blur(8px)",
            }}
            labelStyle={{ color: "#e2e8f0", fontFamily: "Inter, sans-serif", marginBottom: 4 }}
            itemStyle={{ color: "#4ade80", fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}
            formatter={(value) => [`${value} kg CO₂`, "Saved"]}
          />

          <Area
            type="monotone"
            dataKey="savedKg"
            stroke="#4ade80"
            strokeWidth={2}
            fill="url(#savedGradient)"
            dot={days > 14 ? false : { r: 3, fill: "#4ade80", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#bef264", strokeWidth: 0 }}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

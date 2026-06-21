/**
 * Insights.jsx (route: "/insights")
 * ------------------------------------
 * Gamification summary in the "Green Limelight" theme:
 *   - Current level (utils/badges.js -> getLevel) with an animated
 *     progress bar toward the next level.
 *   - 7-day CO₂ trend chart (TrendsChart).
 *   - Per-category CO₂-saved breakdown as glowing proportional bars.
 *   - Full badge grid (BadgeGrid) — locked and unlocked.
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Award, Flame, ListChecks, TrendingUp, CalendarDays } from "lucide-react";
import { useHabitStore } from "../context/HabitContext";
import { getTotalCarbonSaved, formatCarbon } from "../utils/carbonLogic";
import { getLevel, BADGES } from "../utils/badges";
import { habitIcon } from "../utils/habitIcons";
import TrendsChart from "../components/TrendsChart";
import BadgeGrid from "../components/BadgeGrid";
import CalendarHeatmap from "../components/CalendarHeatmap";
import BenchmarkCard from "../components/BenchmarkCard";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

export default function Insights() {
  const { habits, points, streak, unlockedBadges } = useHabitStore();
  const totalSaved = useMemo(() => getTotalCarbonSaved(habits), [habits]);
  const { current, next, progress } = useMemo(() => getLevel(points), [points]);
  const [trendDays, setTrendDays] = useState(7);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">Insights</h1>
        <p className="text-slate-400 mt-1">Your progress, level, and where your savings come from.</p>
      </div>

      {/* Level card */}
      <motion.section
        custom={0}
        initial="hidden"
        animate="show"
        variants={cardVariants}
        whileHover={{ y: -4 }}
        className="glass rounded-3xl p-6 sm:p-8 shadow-glow"
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl" aria-hidden="true">{current.icon}</span>
          <div>
            <p className="text-sm text-emerald-300 uppercase tracking-wide">Current level</p>
            <h2 className="font-display text-2xl font-semibold text-white">{current.name}</h2>
          </div>
        </div>

        {next ? (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span className="font-mono">{points} pts</span>
              <span>{next.threshold} pts to reach {next.name} {next.icon}</span>
            </div>
            <div 
              className="h-2.5 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${points} points out of ${next.threshold} points needed for level ${next.name}`}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400"
                style={{ boxShadow: "0 0 16px rgba(163, 230, 53, 0.55)" }}
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-lime-300 font-medium">
            You've reached the highest level — Canopy Guardian! 🎉
          </p>
        )}
      </motion.section>

      {/* CO₂ trend with 7/30-day toggle */}
      <motion.section
        custom={1}
        initial="hidden"
        animate="show"
        variants={cardVariants}
        whileHover={{ y: -4 }}
        className="glass rounded-3xl p-6 sm:p-8 shadow-glow-inset"
      >
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-300 uppercase tracking-wide">
            <TrendingUp size={16} />
            CO₂ savings trend
          </p>
          <div className="flex items-center gap-1 rounded-xl bg-white/[0.03] ring-1 ring-white/10 p-1">
            {[7, 30].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTrendDays(range)}
                aria-pressed={trendDays === range}
                className={[
                  "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                  trendDays === range
                    ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/40"
                    : "text-slate-400 hover:text-slate-200",
                ].join(" ")}
              >
                {range} days
              </button>
            ))}
          </div>
        </div>
        <TrendsChart habits={habits} days={trendDays} />
      </motion.section>

      {/* Calendar heatmap */}
      <motion.section
        custom={2}
        initial="hidden"
        animate="show"
        variants={cardVariants}
        whileHover={{ y: -4 }}
        className="glass rounded-3xl p-6 sm:p-8 shadow-glow-inset"
      >
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-300 uppercase tracking-wide mb-4">
          <CalendarDays size={16} />
          Logging consistency
        </p>
        <CalendarHeatmap habits={habits} weeks={12} />
      </motion.section>

      {/* Benchmark comparison */}
      <motion.section
        custom={3}
        initial="hidden"
        animate="show"
        variants={cardVariants}
        whileHover={{ y: -4 }}
        className="glass rounded-3xl p-6 sm:p-8 shadow-glow"
      >
        <p className="text-sm font-medium text-emerald-300 uppercase tracking-wide mb-4">
          Your impact vs. the baseline
        </p>
        <BenchmarkCard habits={habits} />
      </motion.section>

      {/* Category breakdown */}
      <motion.section
        custom={4}
        initial="hidden"
        animate="show"
        variants={cardVariants}
        whileHover={{ y: -4 }}
        className="glass rounded-3xl p-6 sm:p-8 shadow-glow-inset"
      >
        <h2 className="font-display text-lg font-semibold text-white mb-1">CO₂ saved by category</h2>
        <p className="text-sm text-slate-400 mb-6">
          Total saved across all logged habits:{" "}
          <span className="font-mono text-emerald-300">{formatCarbon(totalSaved)}</span>
        </p>
        <CategoryBreakdown habits={habits} />
      </motion.section>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MiniStat custom={5} icon={Award} label="Total Eco-points" value={points} accent="emerald" />
        <MiniStat custom={6} icon={Flame} label="Current streak" value={`${streak} day${streak === 1 ? "" : "s"}`} accent="lime" />
        <MiniStat custom={7} icon={ListChecks} label="Habits logged" value={habits.length} accent="emerald" />
      </div>

      {/* Badges */}
      <motion.section
        custom={8}
        initial="hidden"
        animate="show"
        variants={cardVariants}
        className="glass rounded-3xl p-6 sm:p-8 shadow-glow-inset"
      >
        <h2 className="font-display text-lg font-semibold text-white mb-1">Badges</h2>
        <p className="text-sm text-slate-400 mb-6">
          {unlockedBadges.length} of {BADGE_COUNT} unlocked
        </p>
        <BadgeGrid unlockedBadges={unlockedBadges} />
      </motion.section>
    </div>
  );
}

// Imported lazily here to avoid a circular import concern with BadgeGrid —
// BADGES is small and stable, so just reference its length for the count.
const BADGE_COUNT = BADGES.length;

function CategoryBreakdown({ habits }) {
  const categories = useMemo(() => ["transport", "food", "electricity"], []);
  const totals = useMemo(() => {
    return categories.map((cat) => ({
      category: cat,
      saved: habits.filter((h) => h.category === cat).reduce((sum, h) => sum + h.savedG, 0),
    }));
  }, [habits, categories]);

  const max = useMemo(() => Math.max(...totals.map((t) => t.saved), 1), [totals]);

  if (habits.length === 0) {
    return <p className="text-slate-400 text-sm">Log a few habits to see your breakdown here.</p>;
  }

  return (
    <div className="space-y-5">
      {totals.map((t, i) => {
        const Icon = habitIcon(t.category, null);
        return (
          <div key={t.category}>
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center gap-2 capitalize text-white font-medium">
                <Icon size={15} className="text-emerald-400" />
                {t.category}
              </span>
              <span className="font-mono text-slate-400">{formatCarbon(t.saved)}</span>
            </div>
            <div 
              className="h-2 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10"
              role="progressbar"
              aria-valuenow={Math.round((t.saved / max) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${t.category} savings: ${formatCarbon(t.saved)}`}
            >
              <motion.div
                className="h-full rounded-full bg-lime-400"
                style={{ boxShadow: "0 0 12px rgba(163, 230, 53, 0.6)" }}
                initial={{ width: 0 }}
                animate={{ width: `${(t.saved / max) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 * i }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, accent, custom }) {
  const accentClass = accent === "lime" ? "text-lime-300" : "text-emerald-300";
  return (
    <motion.div
      custom={custom}
      initial="hidden"
      animate="show"
      variants={cardVariants}
      whileHover={{ y: -3 }}
      className="glass rounded-2xl px-4 py-4 shadow-glow-inset flex items-center gap-3"
    >
      <div className={`grid place-items-center w-10 h-10 rounded-xl bg-white/[0.03] ring-1 ring-white/10 ${accentClass}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="font-mono text-xl font-semibold text-white mt-0.5">{value}</p>
      </div>
    </motion.div>
  );
}

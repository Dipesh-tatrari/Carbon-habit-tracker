/**
 * Dashboard.jsx (route: "/")
 * ---------------------------
 * "Green Limelight" dashboard:
 *   - Carbon Savings card with an animated glowing ring (Framer Motion
 *     animates stroke-dashoffset on mount to "fill" the ring).
 *   - Streak Counter that pulse-glows continuously while streak > 0.
 *   - 7-day StreakTrail.
 *   - Today's logged habits, each with a lucide icon.
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { TrendingDown, Flame, ListChecks, ArrowRight, TrendingUp } from "lucide-react";
import { useHabitStore } from "../context/HabitContext";
import { getTotalCarbonSaved, formatCarbon, getBenchmarkComparison } from "../utils/carbonLogic";
import { getLevel } from "../utils/badges";
import StreakTrail from "../components/StreakTrail";
import CanopyVisual from "../components/CanopyVisual";
import TrendsChart from "../components/TrendsChart";
import { habitIcon, unitFor } from "../utils/habitIcons";

// Visual "goal" the ring fills toward — purely cosmetic, gives the ring
// something to animate against. Tune freely.
const GOAL_G = 5000; // 5kg CO2 saved

const RING_RADIUS = 70;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

export default function Dashboard() {
  const { habits, points, streak, todaysHabits } = useHabitStore();
  const totalSaved = getTotalCarbonSaved(habits);
  const percent = Math.min(totalSaved / GOAL_G, 1);
  const { next, progress, currentIndex } = getLevel(points);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top row: ring + streak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Carbon savings ring */}
        <motion.section
          custom={0}
          initial="hidden"
          animate="show"
          variants={cardVariants}
          whileHover={{ y: -4 }}
          className="glass rounded-3xl p-6 sm:p-8 shadow-glow flex flex-col items-center text-center"
        >
          <p className="self-start flex items-center gap-2 text-sm font-medium text-emerald-300 uppercase tracking-wide">
            <TrendingDown size={16} />
            Carbon saved
          </p>

          <div className="relative mt-4 w-48 h-48">
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
              {/* track */}
              <circle cx="80" cy="80" r={RING_RADIUS} fill="none" stroke="#1e293b" strokeWidth="12" />
              {/* fill */}
              <motion.circle
                cx="80"
                cy="80"
                r={RING_RADIUS}
                fill="none"
                stroke="#4ade80"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                animate={{ strokeDashoffset: RING_CIRCUMFERENCE * (1 - percent) }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                style={{ filter: "drop-shadow(0 0 10px rgba(74, 222, 128, 0.65))" }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div>
                <p className="font-mono text-2xl sm:text-3xl font-semibold text-white">
                  {formatCarbon(totalSaved)}
                </p>
                <p className="text-xs text-slate-400 mt-1">of {formatCarbon(GOAL_G)} goal</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-400 mt-4 max-w-xs">
            Measured against the highest-carbon alternative for each choice you log.
          </p>

          {habits.length > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-400/10 ring-1 ring-lime-400/30 text-lime-300 text-xs font-medium">
              {getBenchmarkComparison(habits).percentReduction}% below the average commuter
            </div>
          )}
        </motion.section>

        {/* Streak + points */}
        <motion.section
          custom={1}
          initial="hidden"
          animate="show"
          variants={cardVariants}
          whileHover={{ y: -4 }}
          className="glass rounded-3xl p-6 sm:p-8 shadow-glow-lime flex flex-col justify-between"
        >
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-lime-300 uppercase tracking-wide">
              <Flame size={16} />
              Current streak
            </p>

            <motion.div
              className="mt-4 inline-flex items-center justify-center rounded-2xl bg-lime-400/10 ring-1 ring-lime-400/30 px-6 py-5"
              animate={
                streak > 0
                  ? {
                      boxShadow: [
                        "0 0 0px rgba(163,230,53,0)",
                        "0 0 40px rgba(163,230,53,0.55)",
                        "0 0 0px rgba(163,230,53,0)",
                      ],
                      scale: [1, 1.03, 1],
                    }
                  : {}
              }
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="font-mono text-4xl sm:text-5xl font-bold text-lime-300">
                {streak}
              </span>
              <span className="ml-2 text-slate-300 text-sm self-end mb-1.5">
                day{streak === 1 ? "" : "s"}
              </span>
            </motion.div>

            <p className="text-sm text-slate-400 mt-4">
              {streak > 0
                ? "You're on a roll — log today to keep it alive."
                : "Log a habit today to start a new streak."}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-emerald-400/10 ring-1 ring-emerald-400/30 px-4 py-3">
            <span className="text-sm text-emerald-300 font-medium">Eco-points</span>
            <span className="font-mono text-xl font-semibold text-emerald-300">{points}</span>
          </div>
        </motion.section>
      </div>

      {/* Canopy growth + weekly trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.section
          custom={2}
          initial="hidden"
          animate="show"
          variants={cardVariants}
          whileHover={{ y: -4 }}
          className="glass rounded-3xl p-6 sm:p-8 shadow-glow flex flex-col items-center"
        >
          <p className="self-start flex items-center gap-2 text-sm font-medium text-emerald-300 uppercase tracking-wide mb-2">
            🌳 Your canopy
          </p>
          <CanopyVisual levelIndex={currentIndex} />

          {next ? (
            <div className="w-full mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-mono">{points} pts</span>
                <span>{next.threshold} pts to {next.name} {next.icon}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10">
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
            <p className="text-xs text-lime-300 font-medium mt-3">
              Max level reached — your canopy is in full bloom! 🎉
            </p>
          )}
        </motion.section>

        <motion.section
          custom={3}
          initial="hidden"
          animate="show"
          variants={cardVariants}
          whileHover={{ y: -4 }}
          className="glass rounded-3xl p-6 sm:p-8 shadow-glow-inset"
        >
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-300 uppercase tracking-wide mb-4">
            <TrendingUp size={16} />
            7-day CO₂ savings
          </p>
          <TrendsChart habits={habits} days={7} />
        </motion.section>
      </div>

      {/* Streak trail */}
      <motion.section
        custom={4}
        initial="hidden"
        animate="show"
        variants={cardVariants}
        className="glass rounded-3xl p-6 sm:p-8 shadow-glow-inset"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-lg font-semibold text-white">This week's trail</h2>
          {todaysHabits.length === 0 && (
            <Link to="/log" className="text-sm font-medium text-emerald-300 hover:text-emerald-200">
              Log today's habit
            </Link>
          )}
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Glowing waypoints mark days you logged at least one habit.
        </p>
        <StreakTrail habits={habits} />
      </motion.section>

      {/* Today's habits */}
      <motion.section
        custom={5}
        initial="hidden"
        animate="show"
        variants={cardVariants}
        className="glass rounded-3xl p-6 sm:p-8 shadow-glow-inset"
      >
        <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ListChecks size={18} className="text-emerald-400" />
          Today's activity
        </h2>

        {todaysHabits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">Nothing logged yet today.</p>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="inline-block">
              <Link
                to="/log"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-400 text-slate-900 font-semibold text-sm shadow-glow hover:bg-emerald-300 transition-colors"
              >
                Log a habit
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {todaysHabits.map((habit, i) => {
              const Icon = habitIcon(habit.category, habit.type);
              return (
                <motion.li
                  key={habit.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ x: 4 }}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid place-items-center w-9 h-9 rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20 text-emerald-300">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-white capitalize">
                        {habit.category}: {habit.type || "electricity"}
                      </p>
                      <p className="text-sm text-slate-400">
                        {habit.value} {unitFor(habit.category)} · {formatCarbon(habit.impactG)} CO₂
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-sm text-lime-300 whitespace-nowrap">
                    +{habit.points} pts
                  </span>
                </motion.li>
              );
            })}
          </ul>
        )}
      </motion.section>
    </div>
  );
}

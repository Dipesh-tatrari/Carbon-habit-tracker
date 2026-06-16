/**
 * LogHabit.jsx (route: "/log")
 * ------------------------------
 * "Green Limelight" logging form: glass panel, icon-driven category/type
 * pickers (motion whileHover/whileTap), and a glowing focus ring on the
 * amount input. On submit, `processHabitEntry` (carbonLogic.js) computes
 * an instant preview while `logHabit` (HabitContext) persists the entry.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Salad, Zap, Sparkles } from "lucide-react";
import {
  TRANSPORT_FACTORS,
  FOOD_FACTORS,
  processHabitEntry,
  formatCarbon,
} from "../utils/carbonLogic";
import { habitIcon, unitFor } from "../utils/habitIcons";
import { getEcoTip } from "../utils/aiInsights";
import AiTipCard from "../components/AiTipCard";
import { useHabitStore } from "../context/HabitContext";

const CATEGORIES = [
  { id: "transport", label: "Transport", unit: "km", icon: Car, options: Object.keys(TRANSPORT_FACTORS) },
  { id: "food", label: "Food", unit: "meal(s)", icon: Salad, options: Object.keys(FOOD_FACTORS) },
  { id: "electricity", label: "Electricity", unit: "kWh", icon: Zap, options: [] },
];

export default function LogHabit() {
  const { logHabit, points, streak } = useHabitStore();

  const [category, setCategory] = useState("transport");
  const [type, setType] = useState(CATEGORIES[0].options[0]);
  const [value, setValue] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [tip, setTip] = useState(null);
  const [tipLoading, setTipLoading] = useState(false);
  const [logCount, setLogCount] = useState(0);

  const activeCategory = CATEGORIES.find((c) => c.id === category);

  function handleCategoryChange(nextCategoryId) {
    const next = CATEGORIES.find((c) => c.id === nextCategoryId);
    setCategory(nextCategoryId);
    setType(next.options[0] || "");
    setLastResult(null);
    setTip(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const numericValue = Number(value);
    if (!numericValue || numericValue <= 0) return;

    const preview = processHabitEntry(category, type, numericValue);
    logHabit(category, type, numericValue);

    setLastResult(preview);
    setValue("");
    setLogCount((c) => c + 1);

    // Fetch a personalized tip based on this entry. logHabit() already
    // updated the store, but `points`/`streak` here are still the
    // pre-update values from this render — fine for context, since the
    // tip only needs an approximate picture.
    setTip(null);
    setTipLoading(true);
    const newTip = await getEcoTip({
      ...preview,
      totalPoints: points + preview.points,
      streak,
    });
    setTip(newTip);
    setTipLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">Log a habit</h1>
        <p className="text-slate-400 mt-1">
          Record today's choice and see its CO₂ impact and Eco-points instantly.
        </p>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="glass rounded-3xl p-6 sm:p-8 space-y-6 shadow-glow"
      >
        {/* Category selector */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">Category</label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = category === c.id;
              return (
                <motion.button
                  type="button"
                  key={c.id}
                  onClick={() => handleCategoryChange(c.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={[
                    "flex flex-col items-center gap-1.5 rounded-2xl px-3 py-3 text-sm font-medium transition-colors ring-1",
                    active
                      ? "bg-emerald-400/15 ring-emerald-400/50 text-emerald-300 shadow-glow"
                      : "bg-white/[0.03] ring-white/10 text-slate-400 hover:text-slate-200 hover:ring-white/20",
                  ].join(" ")}
                >
                  <Icon size={20} />
                  {c.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Type selector (skipped for electricity) */}
        {activeCategory.options.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3 capitalize">
              {activeCategory.label} type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {activeCategory.options.map((opt) => {
                const Icon = habitIcon(category, opt);
                const active = type === opt;
                return (
                  <motion.button
                    type="button"
                    key={opt}
                    onClick={() => setType(opt)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className={[
                      "flex flex-col items-center gap-1.5 rounded-2xl px-3 py-3 text-sm font-medium capitalize transition-colors ring-1",
                      active
                        ? "bg-lime-400/15 ring-lime-400/50 text-lime-300 shadow-glow-lime"
                        : "bg-white/[0.03] ring-white/10 text-slate-400 hover:text-slate-200 hover:ring-white/20",
                    ].join(" ")}
                  >
                    <Icon size={18} />
                    {opt}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Value input — glowing focus border */}
        <div>
          <label htmlFor="value" className="block text-sm font-medium text-slate-300 mb-3">
            Amount ({activeCategory.unit})
          </label>
          <input
            id="value"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`e.g. ${activeCategory.id === "food" ? "1" : "10"}`}
            required
            className="w-full rounded-2xl bg-white/[0.03] ring-1 ring-white/10 px-4 py-3 text-white placeholder:text-slate-500
                       transition-all duration-200 outline-none
                       focus:ring-2 focus:ring-emerald-400/70 focus:shadow-glow focus:bg-white/[0.05]"
          />
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-400 text-slate-900 font-semibold text-sm shadow-glow hover:bg-emerald-300 transition-colors"
        >
          <Sparkles size={16} />
          Log activity
        </motion.button>
      </motion.form>

      {/* Instant feedback */}
      <AnimatePresence mode="wait">
        {lastResult && (
          <motion.div
            key={logCount}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="glass rounded-3xl p-6 sm:p-8 shadow-glow-lime"
          >
            <p className="text-sm font-medium text-lime-300 uppercase tracking-wide mb-2">Logged</p>
            <p className="font-display text-2xl font-semibold text-white capitalize">
              {lastResult.category}: {lastResult.type || "electricity"} — {lastResult.value} {unitFor(lastResult.category)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <ResultBlock label="CO₂ impact" value={formatCarbon(lastResult.impactG)} />
              <ResultBlock label="Eco-points earned" value={`+${lastResult.points}`} accent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI eco tip */}
      <AiTipCard loading={tipLoading} tip={tip} />
    </div>
  );
}

function ResultBlock({ label, value, accent }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 px-4 py-3">
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`font-mono text-xl font-semibold mt-1 ${accent ? "text-lime-300" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

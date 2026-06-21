/**
 * BenchmarkCard.jsx
 * -------------------
 * "You vs. the average commuter" comparison. Shows the user's actual CO2
 * impact against what it WOULD have been if every logged activity had
 * used the high-carbon baseline (utils/carbonLogic.js ->
 * getBenchmarkComparison), as two glowing horizontal bars plus a headline
 * percentage.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Gauge } from "lucide-react";
import { getBenchmarkComparison, formatCarbon } from "../utils/carbonLogic";

export default function BenchmarkCard({ habits }) {
  const { totalImpactG, totalBaselineG, percentReduction } = useMemo(
    () => getBenchmarkComparison(habits),
    [habits]
  );

  if (habits.length === 0) {
    return (
      <p className="text-slate-400 text-sm">
        Log a few habits to see how you compare to the average commuter.
      </p>
    );
  }

  const youWidth = totalBaselineG > 0 ? (totalImpactG / totalBaselineG) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-lime-400/10 ring-1 ring-lime-400/30 text-lime-300 shrink-0">
          <Gauge size={22} />
        </div>
        <p className="text-2xl sm:text-3xl font-display font-semibold text-white">
          {percentReduction}%{" "}
          <span className="text-base sm:text-lg font-body font-normal text-slate-300">
            lower than the average commuter
          </span>
        </p>
      </div>

      <div className="space-y-3">
        <BenchmarkBar
          label="You"
          valueG={totalImpactG}
          widthPercent={youWidth}
          colorClass="bg-emerald-400"
          glow="0 0 14px rgba(74, 222, 128, 0.6)"
        />
        <BenchmarkBar
          label="Average commuter"
          valueG={totalBaselineG}
          widthPercent={100}
          colorClass="bg-slate-600"
          glow="none"
        />
      </div>

      <p className="text-xs text-slate-500">
        "Average commuter" = the same activities you logged, but always choosing the
        highest-carbon option (e.g. driving instead of cycling, beef instead of plant-based).
      </p>
    </div>
  );
}

function BenchmarkBar({ label, valueG, widthPercent, colorClass, glow }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="font-mono text-slate-400">{formatCarbon(valueG)}</span>
      </div>
      <div 
        className="h-2.5 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10"
        role="progressbar"
        aria-valuenow={Math.round(widthPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${label}: ${formatCarbon(valueG)}`}
      >
        <motion.div
          className={`h-full rounded-full ${colorClass}`}
          style={{ boxShadow: glow }}
          initial={{ width: 0 }}
          animate={{ width: `${widthPercent}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

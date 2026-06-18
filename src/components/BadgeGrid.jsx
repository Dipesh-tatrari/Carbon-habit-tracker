/**
 * BadgeGrid.jsx
 * --------------
 * Grid of all available badges (utils/badges.js). Unlocked badges are
 * shown in full color with a glow; locked badges are dimmed with a
 * lock icon. Entrance animation staggers in by badge index.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { BADGES } from "../utils/badges";

export default function BadgeGrid({ unlockedBadges }) {
  const unlocked = useMemo(() => new Set(unlockedBadges), [unlockedBadges]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {BADGES.map((badge, i) => {
        const isUnlocked = unlocked.has(badge.id);
        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            whileHover={{ y: -3 }}
            className={[
              "rounded-2xl p-4 ring-1 flex flex-col items-center text-center gap-1.5 transition-colors",
              isUnlocked
                ? "bg-emerald-400/10 ring-emerald-400/30 shadow-glow"
                : "bg-white/[0.02] ring-white/5",
            ].join(" ")}
          >
            <div
              className={[
                "grid place-items-center w-12 h-12 rounded-xl text-2xl",
                isUnlocked ? "bg-emerald-400/10" : "bg-white/5",
              ].join(" ")}
            >
              {isUnlocked ? badge.icon : <Lock size={18} className="text-slate-500" />}
            </div>
            <p className={`text-sm font-semibold ${isUnlocked ? "text-white" : "text-slate-500"}`}>
              {badge.name}
            </p>
            <p className={`text-xs ${isUnlocked ? "text-slate-400" : "text-slate-600"}`}>
              {badge.description}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

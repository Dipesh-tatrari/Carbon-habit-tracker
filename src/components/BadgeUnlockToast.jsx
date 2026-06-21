/**
 * BadgeUnlockToast.jsx
 * ----------------------
 * Pops up in the corner whenever `recentlyUnlocked` (HabitContext) has
 * one or more newly-earned badges. Shows them one at a time, auto-
 * advancing every few seconds, then calls `clearRecentlyUnlocked()`.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, X } from "lucide-react";
import { useHabitStore } from "../context/HabitContext";

const DISPLAY_MS = 4000;

export default function BadgeUnlockToast() {
  const { recentlyUnlocked, clearRecentlyUnlocked } = useHabitStore();
  const [index, setIndex] = useState(0);

  const badges = recentlyUnlocked;
  const current = badges[index];

  useEffect(() => {
    if (badges.length === 0) {
      setIndex(0);
      return;
    }

    const timer = setTimeout(() => {
      if (index < badges.length - 1) {
        setIndex((i) => i + 1);
      } else {
        clearRecentlyUnlocked();
        setIndex(0);
      }
    }, DISPLAY_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badges, index]);

  return (
    <div className="fixed bottom-4 right-4 z-30 w-[calc(100%-2rem)] sm:w-auto sm:max-w-sm">
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id}
            role="alert"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="glass rounded-2xl p-4 shadow-glow-lime flex items-center gap-3"
          >
            <div className="grid place-items-center w-11 h-11 rounded-xl bg-lime-400/15 ring-1 ring-lime-400/40 text-2xl shrink-0">
              {current.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-medium text-lime-300 uppercase tracking-wide">
                <PartyPopper size={12} />
                Badge unlocked
              </p>
              <p className="font-display text-sm font-semibold text-white truncate">{current.name}</p>
              <p className="text-xs text-slate-400 truncate">{current.description}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                clearRecentlyUnlocked();
                setIndex(0);
              }}
              className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

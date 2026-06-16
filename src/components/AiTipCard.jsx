/**
 * AiTipCard.jsx
 * --------------
 * Displays a personalized eco tip (from aiInsights.js) in a glass card.
 * Shows an animated skeleton while loading, then fades the tip in.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";

export default function AiTipCard({ loading, tip }) {
  if (!loading && !tip) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="glass rounded-3xl p-6 sm:p-8 shadow-glow"
    >
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-300 uppercase tracking-wide mb-3">
        <Bot size={16} />
        Your AI eco tip
      </p>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <SkeletonLine width="100%" />
            <SkeletonLine width="80%" />
          </motion.div>
        ) : (
          <motion.p
            key="tip"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-slate-200 leading-relaxed"
          >
            {tip}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SkeletonLine({ width }) {
  return (
    <motion.div
      className="h-4 rounded-full bg-white/10"
      style={{ width }}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

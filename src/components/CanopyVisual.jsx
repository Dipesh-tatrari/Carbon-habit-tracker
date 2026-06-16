/**
 * CanopyVisual.jsx
 * ------------------
 * The app's "growth" signature visual: an illustrated tree/forest scene
 * that grows with the user's level (utils/badges.js -> getLevel). Trunk
 * height, canopy size, and the number of trees all scale up across the
 * 5 levels (Seedling -> Canopy Guardian). Framer Motion animates the
 * transition whenever the level changes.
 */

import { motion } from "framer-motion";
import { LEVELS } from "../utils/badges";

const GROUND_Y = 190;

// One config per level (index 0-4), tuned to feel like visible growth.
const STAGES = [
  { trunkHeight: 14, canopyRadius: 12, trees: 1 }, // Seedling
  { trunkHeight: 32, canopyRadius: 22, trees: 1 }, // Sprout
  { trunkHeight: 52, canopyRadius: 32, trees: 1 }, // Sapling
  { trunkHeight: 68, canopyRadius: 40, trees: 2 }, // Grove Keeper
  { trunkHeight: 78, canopyRadius: 46, trees: 3 }, // Canopy Guardian
];

const TREE_POSITIONS = [200, 110, 295]; // main tree center, then side trees
const TREE_SCALES = [1, 0.6, 0.65];

export default function CanopyVisual({ levelIndex }) {
  const stage = STAGES[levelIndex] ?? STAGES[0];
  const levelInfo = LEVELS[levelIndex] ?? LEVELS[0];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 400 210" className="w-full max-w-sm h-auto">
        {/* sky glow */}
        <defs>
          <radialGradient id="canopyGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="400" height="210" fill="url(#canopyGlow)" />

        {/* ground */}
        <ellipse cx="200" cy={GROUND_Y + 10} rx="180" ry="14" fill="#0f172a" />
        <line x1="20" y1={GROUND_Y} x2="380" y2={GROUND_Y} stroke="#1e293b" strokeWidth="2" />

        {/* fireflies — only at the top level */}
        {levelIndex === 4 &&
          [...Array(5)].map((_, i) => (
            <motion.circle
              key={i}
              cx={90 + i * 55}
              cy={60 + (i % 2) * 30}
              r="2.5"
              fill="#bef264"
              animate={{ opacity: [0.2, 1, 0.2], cy: [60 + (i % 2) * 30, 50 + (i % 2) * 30, 60 + (i % 2) * 30] }}
              transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
              style={{ filter: "drop-shadow(0 0 4px rgba(190,242,100,0.9))" }}
            />
          ))}

        {/* trees */}
        {Array.from({ length: stage.trees }).map((_, i) => (
          <Tree
            key={i}
            x={TREE_POSITIONS[i]}
            scale={TREE_SCALES[i]}
            trunkHeight={stage.trunkHeight}
            canopyRadius={stage.canopyRadius}
            isMain={i === 0}
          />
        ))}
      </svg>

      <motion.div
        key={levelInfo.name}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-2 flex items-center gap-2"
      >
        <span className="text-2xl" aria-hidden="true">{levelInfo.icon}</span>
        <span className="font-display text-sm font-semibold text-white">{levelInfo.name}</span>
      </motion.div>
    </div>
  );
}

/** A single tree: animated trunk + a cluster of overlapping canopy circles. */
function Tree({ x, scale, trunkHeight, canopyRadius, isMain }) {
  const trunkWidth = 8 * scale;
  const radius = canopyRadius * scale;
  const trunkH = trunkHeight * scale;
  const canopyY = GROUND_Y - trunkH;

  const trunkFill = "#7c5a3a";
  const canopyFill = isMain ? "#4ade80" : "#22c55e";

  return (
    <g style={{ transformOrigin: `${x}px ${GROUND_Y}px` }}>
      {/* trunk */}
      <motion.rect
        x={x - trunkWidth / 2}
        width={trunkWidth}
        fill={trunkFill}
        initial={{ height: 0, y: GROUND_Y }}
        animate={{ height: trunkH, y: canopyY }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        rx="2"
      />

      {/* canopy cluster — three overlapping circles for an organic shape */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        style={{ transformOrigin: `${x}px ${canopyY}px` }}
      >
        <circle cx={x} cy={canopyY} r={radius} fill={canopyFill} fillOpacity="0.9" />
        <circle cx={x - radius * 0.6} cy={canopyY + radius * 0.3} r={radius * 0.7} fill={canopyFill} fillOpacity="0.85" />
        <circle cx={x + radius * 0.6} cy={canopyY + radius * 0.3} r={radius * 0.7} fill={canopyFill} fillOpacity="0.85" />
      </motion.g>
    </g>
  );
}

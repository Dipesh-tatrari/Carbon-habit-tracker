/**
 * badges.js
 * ----------
 * Badge and level definitions, plus the logic to check which badges a
 * user has newly unlocked. Kept separate from HabitContext so the
 * definitions are easy to find and tune, and separate from carbonLogic
 * since these are gamification rules, not carbon math.
 */

import { getTotalCarbonSaved } from "./carbonLogic";

// ---------------------------------------------------------------------
// LEVELS — Eco-point thresholds. Must stay sorted by `threshold` ascending.
// Used by Insights and CanopyVisual to determine the user's "growth stage".
// ---------------------------------------------------------------------
export const LEVELS = [
  { threshold: 0, name: "Seedling", icon: "🌱" },
  { threshold: 50, name: "Sprout", icon: "🌿" },
  { threshold: 150, name: "Sapling", icon: "🌳" },
  { threshold: 400, name: "Grove Keeper", icon: "🌲" },
  { threshold: 1000, name: "Canopy Guardian", icon: "🏔️" },
];

/**
 * Determine the user's current level, the next level (or null if maxed),
 * progress (0–1) toward the next level, and the level's INDEX (0–4) —
 * the index is what CanopyVisual uses to pick a growth stage.
 */
export function getLevel(points) {
  let current = LEVELS[0];
  let currentIndex = 0;
  let next = LEVELS[1] || null;

  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].threshold) {
      current = LEVELS[i];
      currentIndex = i;
      next = LEVELS[i + 1] || null;
    }
  }

  let progress = 1;
  if (next) {
    const span = next.threshold - current.threshold;
    progress = span > 0 ? (points - current.threshold) / span : 1;
  }

  return { current, currentIndex, next, progress: Math.min(Math.max(progress, 0), 1) };
}

// ---------------------------------------------------------------------
// BADGES — each has a `condition(stats)` predicate. `stats` is:
//   { entries, points, streak, totalSavedG }
// where `entries` is the full habits array.
// ---------------------------------------------------------------------
export const BADGES = [
  {
    id: "first_log",
    name: "First Step",
    description: "Logged your very first activity",
    icon: "🌱",
    condition: (s) => s.entries.length >= 1,
  },
  {
    id: "streak_3",
    name: "On a Roll",
    description: "Reached a 3-day streak",
    icon: "🔥",
    condition: (s) => s.streak >= 3,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Reached a 7-day streak",
    icon: "🏆",
    condition: (s) => s.streak >= 7,
  },
  {
    id: "streak_30",
    name: "Habit Master",
    description: "Reached a 30-day streak",
    icon: "💎",
    condition: (s) => s.streak >= 30,
  },
  {
    id: "points_50",
    name: "Green Beginner",
    description: "Earned 50 Eco-points",
    icon: "🌿",
    condition: (s) => s.points >= 50,
  },
  {
    id: "points_150",
    name: "Eco Champion",
    description: "Earned 150 Eco-points",
    icon: "🌍",
    condition: (s) => s.points >= 150,
  },
  {
    id: "points_400",
    name: "Planet Protector",
    description: "Earned 400 Eco-points",
    icon: "🛡️",
    condition: (s) => s.points >= 400,
  },
  {
    id: "points_1000",
    name: "Canopy Guardian",
    description: "Earned 1000 Eco-points",
    icon: "🏔️",
    condition: (s) => s.points >= 1000,
  },
  {
    id: "pedal_power",
    name: "Pedal Power",
    description: "Logged a bicycle ride",
    icon: "🚲",
    condition: (s) => s.entries.some((e) => e.category === "transport" && e.type === "bicycle"),
  },
  {
    id: "green_plate",
    name: "Green Plate",
    description: "Logged a plant-based meal",
    icon: "🥗",
    condition: (s) =>
      s.entries.some((e) => e.category === "food" && (e.type === "vegan" || e.type === "vegetarian")),
  },
  {
    id: "saved_5kg",
    name: "5kg Saver",
    description: "Saved 5kg of CO₂ in total",
    icon: "♻️",
    condition: (s) => s.totalSavedG >= 5000,
  },
];

/**
 * Compare the user's current stats against every badge condition and
 * return the badges that are newly unlocked (i.e. their condition is now
 * true, but they aren't in `unlockedBadgeIds` yet).
 *
 * @param {{ entries: array, points: number, streak: number, unlockedBadgeIds: string[] }} state
 * @returns {Array} newly unlocked badge objects (empty if none)
 */
export function checkNewBadges(state) {
  const alreadyUnlocked = new Set(state.unlockedBadgeIds || []);
  const stats = {
    entries: state.entries,
    points: state.points,
    streak: state.streak,
    totalSavedG: getTotalCarbonSaved(state.entries),
  };

  return BADGES.filter((badge) => !alreadyUnlocked.has(badge.id) && badge.condition(stats));
}

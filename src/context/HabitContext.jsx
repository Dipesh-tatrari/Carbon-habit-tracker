/**
 * HabitContext.jsx
 * -----------------
 * Global habit state, now backed by Supabase instead of localStorage.
 *
 * On mount (or when the logged-in user changes) it fetches the user's
 * habits and stats from Supabase. Every write (logHabit, removeHabit)
 * is persisted to Supabase immediately, then mirrored into local React
 * state for instant UI updates — so the UI never waits for a network
 * round-trip to feel responsive.
 *
 * Table layout (see supabase/schema.sql):
 *   habits      — one row per logged activity
 *   user_stats  — one row per user (points, streak, last date, badges)
 *
 * All carbon / points math still lives in utils/carbonLogic.js.
 * All badge rules still live in utils/badges.js.
 * This file only manages state, persistence, and streak logic.
 */

import { createContext, useCallback, useContext, useEffect, useState, useMemo } from "react";
import { supabase } from "../utils/supabase";
import { useAuth } from "./AuthContext";
import { processHabitEntry } from "../utils/carbonLogic";
import { checkNewBadges } from "../utils/badges";

const HabitContext = createContext(null);

const DEFAULT_STATS = {
  total_points: 0,
  current_streak: 0,
  last_activity_date: null,
  unlocked_badges: [],
};

export function HabitProvider({ children }) {
  const { user } = useAuth();

  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // -----------------------------------------------------------------
  // Load user data whenever the signed-in user changes.
  // -----------------------------------------------------------------
  const loadUserData = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setStats(DEFAULT_STATS);
      return;
    }

    setDataLoading(true);
    try {
      const [habitsRes, statsRes] = await Promise.all([
        supabase
          .from("habits")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", user.id)
          .single(),
      ]);

      if (habitsRes.error) throw habitsRes.error;

      // Map snake_case DB columns -> camelCase used throughout the app.
      setHabits((habitsRes.data || []).map(dbRowToEntry));

      // user_stats row may not exist yet for brand-new users — that's fine.
      if (statsRes.data) {
        setStats({
          total_points: statsRes.data.total_points,
          current_streak: statsRes.data.current_streak,
          last_activity_date: statsRes.data.last_activity_date,
          unlocked_badges: statsRes.data.unlocked_badges || [],
        });
      } else {
        setStats(DEFAULT_STATS);
      }
    } catch (err) {
      console.error("[HabitContext] loadUserData error:", err.message);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // -----------------------------------------------------------------
  // logHabit — insert a new habit + upsert stats in parallel.
  // -----------------------------------------------------------------
  // -----------------------------------------------------------------
  // logHabit — insert a new habit + upsert stats in parallel.
  // -----------------------------------------------------------------
  const logHabit = useCallback(async (category, type, value) => {
    if (!user) return;

    const result = processHabitEntry(category, type, value);
    const today = todayString();
    const newStreak = nextStreak(stats.last_activity_date, stats.current_streak, today);
    const newPoints = stats.total_points + result.points;

    const newlyUnlocked = checkNewBadges({
      entries: [{ ...result, date: today }, ...habits],
      points: newPoints,
      streak: newStreak,
      unlockedBadgeIds: stats.unlocked_badges,
    });
    const newBadgeIds = [
      ...stats.unlocked_badges,
      ...newlyUnlocked.map((b) => b.id),
    ];

    const newStats = {
      total_points: newPoints,
      current_streak: newStreak,
      last_activity_date: today,
      unlocked_badges: newBadgeIds,
    };

    // Optimistic local update — UI responds instantly.
    const optimisticEntry = { id: crypto.randomUUID(), ...result, date: today };
    setHabits((prev) => [optimisticEntry, ...prev]);
    setStats(newStats);
    if (newlyUnlocked.length > 0) setRecentlyUnlocked(newlyUnlocked);

    // Persist to Supabase.
    const [habitRes, statsRes] = await Promise.all([
      supabase.from("habits").insert({
        user_id: user.id,
        category,
        type: type || "",
        value: result.value,
        impact_g: result.impactG,
        saved_g: result.savedG,
        points: result.points,
        date: today,
      }).select().single(),

      supabase.from("user_stats").upsert({
        user_id: user.id,
        total_points: newStats.total_points,
        current_streak: newStats.current_streak,
        last_activity_date: newStats.last_activity_date,
        unlocked_badges: newStats.unlocked_badges,
      }),
    ]);

    if (habitRes.error) {
      console.error("[logHabit] insert error:", habitRes.error.message);
      return;
    }

    // Replace the optimistic entry with the real DB row (gets the real UUID).
    const real = dbRowToEntry(habitRes.data);
    setHabits((prev) =>
      prev.map((h) => (h.id === optimisticEntry.id ? real : h))
    );
  }, [user, stats, habits]);

  // -----------------------------------------------------------------
  // removeHabit — delete one entry, recompute points.
  // -----------------------------------------------------------------
  const removeHabit = useCallback(async (id) => {
    if (!user) return;

    const target = habits.find((h) => h.id === id);
    if (!target) return;

    // Optimistic update.
    const newPoints = Math.max(stats.total_points - target.points, 0);
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setStats((prev) => ({ ...prev, total_points: newPoints }));

    await Promise.all([
      supabase.from("habits").delete().eq("id", id).eq("user_id", user.id),
      supabase
        .from("user_stats")
        .update({ total_points: newPoints })
        .eq("user_id", user.id),
    ]);
  }, [user, habits, stats]);

  // -----------------------------------------------------------------
  // resetAll — wipe all rows for this user (useful for demo reset).
  // -----------------------------------------------------------------
  const resetAll = useCallback(async () => {
    if (!user) return;
    setHabits([]);
    setStats(DEFAULT_STATS);
    await Promise.all([
      supabase.from("habits").delete().eq("user_id", user.id),
      supabase.from("user_stats").delete().eq("user_id", user.id),
    ]);
  }, [user]);

  const clearRecentlyUnlocked = useCallback(() => {
    setRecentlyUnlocked([]);
  }, []);

  const today = todayString();

  const todaysHabits = useMemo(() => {
    return habits.filter((h) => h.date === today);
  }, [habits, today]);

  const value = useMemo(() => ({
    habits,
    points: stats.total_points,
    streak: stats.current_streak,
    lastActivityDate: stats.last_activity_date,
    unlockedBadges: stats.unlocked_badges,
    recentlyUnlocked,
    todaysHabits,
    dataLoading,
    logHabit,
    removeHabit,
    resetAll,
    clearRecentlyUnlocked,
  }), [
    habits,
    stats,
    recentlyUnlocked,
    todaysHabits,
    dataLoading,
    logHabit,
    removeHabit,
    resetAll,
    clearRecentlyUnlocked,
  ]);

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
}

export function useHabitStore() {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error("useHabitStore must be used within a <HabitProvider>");
  return ctx;
}

// -----------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------

/** Map a Supabase habits row (snake_case) to the camelCase shape the
 *  rest of the app expects (mirrors processHabitEntry output). */
function dbRowToEntry(row) {
  return {
    id: row.id,
    category: row.category,
    type: row.type,
    value: Number(row.value),
    impactG: Number(row.impact_g),
    savedG: Number(row.saved_g),
    points: Number(row.points),
    date: row.date,
  };
}

/** Rules:
 *  - No prior date  -> streak = 1
 *  - Already logged today -> unchanged
 *  - Last log was yesterday -> streak + 1
 *  - Bigger gap -> reset to 1
 */
function nextStreak(lastDate, currentStreak, today) {
  if (!lastDate) return 1;
  if (lastDate === today) return currentStreak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  return lastDate === yStr ? currentStreak + 1 : 1;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

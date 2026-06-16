/**
 * Navbar.jsx
 * -----------
 * Sticky glass navbar. Active route gets an emerald glow pill via
 * NavLink's isActive callback. Lucide icons reinforce each section's
 * purpose: Home (dashboard), ClipboardList (logging), BarChart3
 * (insights), plus Flame/Award for the live stats on the right.
 */

import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Home, ClipboardList, BarChart3, Flame, Award, LogOut } from "lucide-react";
import { useHabitStore } from "../context/HabitContext";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/log", label: "Log", icon: ClipboardList },
  { to: "/insights", label: "Insights", icon: BarChart3 },
];

export default function Navbar() {
  const { points, streak } = useHabitStore();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-20 px-4 sm:px-6 pt-4">
      <div className="max-w-5xl mx-auto glass rounded-2xl shadow-glow-inset px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="grid place-items-center w-8 h-8 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <Leaf size={16} className="text-emerald-400" />
          </div>
          <span className="font-display text-base sm:text-lg font-semibold tracking-tight text-white hidden sm:inline">
            Canopy
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                [
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "text-emerald-300"
                    : "text-slate-400 hover:text-slate-100",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/40 shadow-glow"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon size={16} className="relative z-10" />
                  <span className="relative z-10 hidden sm:inline">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Live stats + user */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs sm:text-sm">
            <motion.div
              animate={
                streak > 0
                  ? { boxShadow: ["0 0 0px rgba(163,230,53,0)", "0 0 18px rgba(163,230,53,0.55)", "0 0 0px rgba(163,230,53,0)"] }
                  : {}
              }
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-lime-400/10 ring-1 ring-lime-400/30 text-lime-300"
            >
              <Flame size={14} />
              {streak}
            </motion.div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-400/10 ring-1 ring-emerald-400/30 text-emerald-300">
              <Award size={14} />
              {points}
            </div>
          </div>

          {/* User avatar + sign-out */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-xs text-slate-500 max-w-[120px] truncate">
                {user.email}
              </div>
              <motion.button
                type="button"
                onClick={signOut}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Sign out"
                className="grid place-items-center w-8 h-8 rounded-xl bg-white/[0.03] ring-1 ring-white/10 text-slate-400 hover:text-white hover:ring-white/20 transition-colors"
              >
                <LogOut size={14} />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * App.jsx
 * --------
 * Top-level component. Wraps everything in AuthProvider (Supabase session)
 * and HabitProvider (habit data), sets up routing, and enforces an auth
 * guard: unauthenticated users are redirected to /login for all app routes.
 *
 * Route map:
 *   /login   — Login page (public)
 *   /signup  — Signup page (public)
 *   /        — Dashboard (protected)
 *   /log     — Log a habit (protected)
 *   /insights— Insights (protected)
 */

import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { HabitProvider } from "./context/HabitContext";
import Navbar from "./components/Navbar";
import BadgeUnlockToast from "./components/BadgeUnlockToast";
import { Loader } from "lucide-react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const LogHabit  = lazy(() => import("./pages/LogHabit"));
const Insights  = lazy(() => import("./pages/Insights"));
const Login     = lazy(() => import("./pages/Login"));
const Signup    = lazy(() => import("./pages/Signup"));

export default function App() {
  return (
    <AuthProvider>
      <HabitProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </HabitProvider>
    </AuthProvider>
  );
}

/** Renders either the auth pages (no navbar) or the protected app shell. */
function AppShell() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While Supabase is checking the stored session, show a full-screen
  // spinner so we never flash the login page to an already-signed-in user.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={28} className="text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/login"  element={user ? <Navigate to="/" replace /> : <PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={user ? <Navigate to="/" replace /> : <PageTransition><Signup /></PageTransition>} />

        {/* Protected routes */}
        <Route path="/*" element={
          user ? (
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Suspense fallback={<PageLoading />}>
                  <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                      <Route path="/"         element={<PageTransition><Dashboard /></PageTransition>} />
                      <Route path="/log"      element={<PageTransition><LogHabit /></PageTransition>} />
                      <Route path="/insights" element={<PageTransition><Insights /></PageTransition>} />
                      <Route path="*"         element={<PageTransition><NotFound /></PageTransition>} />
                    </Routes>
                  </AnimatePresence>
                </Suspense>
              </main>
              <BadgeUnlockToast />
            </div>
          ) : (
            <Navigate to="/login" replace state={{ from: location }} />
          )
        } />
      </Routes>
    </AnimatePresence>
  );
}

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.28, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

function PageLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 flex items-center gap-2 text-slate-400 text-sm">
      <Loader size={16} className="animate-spin" />
      Loading…
    </div>
  );
}

function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-white">Page not found</h1>
      <p className="text-slate-400 mt-2">That trail doesn't exist yet.</p>
    </div>
  );
}

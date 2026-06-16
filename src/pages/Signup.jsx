/**
 * Signup.jsx (route: "/signup")
 * ------------------------------
 * New account creation form. After a successful signUp(), Supabase sends
 * a confirmation email by default — the user is told to check their inbox.
 * You can disable email confirmation in Supabase Dashboard -> Auth ->
 * Settings -> "Enable email confirmations" (turn it OFF for a hackathon
 * so users land straight in the app after signing up).
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Mail, Lock, UserPlus, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signUp, authError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirm) {
      setLocalError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const ok = await signUp(email, password);
    setLoading(false);

    if (ok) {
      // If email confirmation is disabled in Supabase, the user is already
      // signed in and AuthContext will update — navigate to home.
      // If confirmation is enabled, show a "check your inbox" message.
      setSuccess(true);
      setTimeout(() => navigate("/"), 1500);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/30 mb-3">
            <Leaf size={28} className="text-emerald-400" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-white">Create your account</h1>
          <p className="text-slate-400 text-sm mt-1">Start tracking your carbon footprint</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 sm:p-8 space-y-4 shadow-glow">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] ring-1 ring-white/10 text-white
                           placeholder:text-slate-500 text-sm transition-all outline-none
                           focus:ring-2 focus:ring-emerald-400/70 focus:shadow-glow"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] ring-1 ring-white/10 text-white
                           placeholder:text-slate-500 text-sm transition-all outline-none
                           focus:ring-2 focus:ring-emerald-400/70 focus:shadow-glow"
              />
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-slate-300 mb-2">
              Confirm password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] ring-1 ring-white/10 text-white
                           placeholder:text-slate-500 text-sm transition-all outline-none
                           focus:ring-2 focus:ring-emerald-400/70 focus:shadow-glow"
              />
            </div>
          </div>

          {/* Errors */}
          {(localError || authError) && (
            <p className="text-red-400 text-sm bg-red-400/10 ring-1 ring-red-400/30 rounded-xl px-3 py-2">
              {localError || authError}
            </p>
          )}

          {/* Success */}
          {success && (
            <p className="text-emerald-300 text-sm bg-emerald-400/10 ring-1 ring-emerald-400/30 rounded-xl px-3 py-2">
              Account created! Taking you to your dashboard…
            </p>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading || success}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
                       bg-emerald-400 text-slate-900 font-semibold text-sm shadow-glow
                       hover:bg-emerald-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {loading ? "Creating account…" : "Create account"}
          </motion.button>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-300 hover:text-emerald-200 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}

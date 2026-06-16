/**
 * Login.jsx (route: "/login")
 * ----------------------------
 * Email + password sign-in form. On success, Supabase sets the session
 * and AuthContext's `user` updates, which triggers App.jsx's auth guard
 * to redirect to the Dashboard.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Mail, Lock, LogIn, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn, authError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const ok = await signIn(email, password);
    setLoading(false);
    if (ok) navigate("/");
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
          <h1 className="font-display text-2xl font-semibold text-white">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your Canopy account</p>
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] ring-1 ring-white/10 text-white
                           placeholder:text-slate-500 text-sm transition-all outline-none
                           focus:ring-2 focus:ring-emerald-400/70 focus:shadow-glow"
              />
            </div>
          </div>

          {/* Error */}
          {authError && (
            <p className="text-red-400 text-sm bg-red-400/10 ring-1 ring-red-400/30 rounded-xl px-3 py-2">
              {authError}
            </p>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
                       bg-emerald-400 text-slate-900 font-semibold text-sm shadow-glow
                       hover:bg-emerald-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <LogIn size={16} />}
            {loading ? "Signing in…" : "Sign in"}
          </motion.button>

          <p className="text-center text-sm text-slate-400">
            No account?{" "}
            <Link to="/signup" className="text-emerald-300 hover:text-emerald-200 font-medium">
              Create one
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}

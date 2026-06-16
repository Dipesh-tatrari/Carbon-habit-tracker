/**
 * AuthContext.jsx
 * ----------------
 * Manages the Supabase auth session for the whole app.
 *
 * Exposes via `useAuth()`:
 *   user        — the currently signed-in Supabase user object (or null)
 *   loading     — true while the initial session check is in-flight
 *   signUp(email, password)  — creates a new account
 *   signIn(email, password)  — signs in an existing account
 *   signOut()                — signs out and clears all state
 *   authError   — last auth error message (string or null)
 *
 * Supabase's `onAuthStateChange` listener drives all state updates, so the
 * session is always in sync with the browser's stored JWT — no manual
 * localStorage calls needed.
 */

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until first session check
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Get the current session on first mount (handles page refresh).
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for sign-in / sign-out events from Supabase.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email, password) {
    setAuthError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthError(error.message);
      return false;
    }
    return true;
  }

  async function signIn(email, password) {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      return false;
    }
    return true;
  }

  async function signOut() {
    setAuthError(null);
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, authError, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>");
  return ctx;
}

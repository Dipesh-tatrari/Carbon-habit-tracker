/**
 * supabase.js
 * ------------
 * Single shared Supabase client for the entire app. Import `supabase`
 * from this file anywhere you need to talk to Supabase — auth or database.
 *
 * SETUP (one-time):
 *   1. Create a free project at https://supabase.com
 *   2. Go to Project Settings -> API
 *   3. Copy "Project URL" and "anon public" key into your .env:
 *        VITE_SUPABASE_URL=https://xxxx.supabase.co
 *        VITE_SUPABASE_ANON_KEY=eyJhbGci...
 *   4. Run the SQL in /supabase/schema.sql in your Supabase SQL editor.
 *
 * The anon key is safe to ship in the Vite bundle — it's public by design.
 * Supabase Row Level Security (RLS) policies (defined in schema.sql) ensure
 * each user can only read and write their own rows, even with the anon key.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

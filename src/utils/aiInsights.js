/**
 * aiInsights.js
 * --------------
 * Frontend helper for fetching a personalized eco tip from the Express
 * proxy server (server/index.js).
 *
 * In development: Vite proxies /api/* to localhost:3001, so we call /api/eco-tip.
 * In production:  The Express server is a separate Render Web Service.
 *                 Set VITE_API_URL=https://your-server.onrender.com in the
 *                 Render Static Site env vars, and this file picks it up.
 *
 * Always resolves to a string — the proxy has its own fallback, and this
 * file has a second layer so a network error never crashes the UI.
 */

const FALLBACK_TIPS = [
  "Try swapping one car trip this week for walking, cycling, or public transport — every small switch adds up!",
  "Unplugging devices on standby can shave a surprising amount off your energy footprint over a month.",
  "One plant-based meal a day can meaningfully reduce your weekly carbon footprint — even just swapping lunch.",
  "Small, consistent choices beat occasional big ones — your streak is the real win here.",
];

// In dev, VITE_API_URL is undefined so we fall back to the relative path
// that Vite's dev proxy handles. In production it points to the deployed
// Render server URL.
const API_BASE = import.meta.env.VITE_API_URL ?? "";

/**
 * Request a personalized tip based on a logged habit.
 *
 * @param {object} summary - context for the AI, e.g.
 *   { category, type, value, impactG, savedG, points, streak, totalPoints }
 * @returns {Promise<string>} a short tip — AI-generated or a fallback
 */
export async function getEcoTip(summary) {
  try {
    const response = await fetch(`${API_BASE}/api/eco-tip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary }),
    });

    if (!response.ok) throw new Error(`Server responded with ${response.status}`);

    const data = await response.json();
    return data.tip || randomFallback();
  } catch (err) {
    console.warn("[aiInsights] Falling back to static tip:", err.message);
    return randomFallback();
  }
}

function randomFallback() {
  return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
}

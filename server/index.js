/**
 * server/index.js
 * -----------------
 * Tiny Express proxy that keeps the GROQ_API_KEY on the server, where it
 * belongs.
 *
 * WHY A PROXY?
 *   - Groq's API does not return CORS headers, so the browser can't call
 *     it directly anyway.
 *   - Even if it did, shipping an API key inside a Vite build (anything
 *     prefixed VITE_) means anyone can extract it from the bundle.
 *
 * This server exposes ONE endpoint, POST /api/eco-tip, which the React
 * app calls. It forwards a prompt to Groq and returns a short tip — or a
 * static fallback tip if the API key is missing or the request fails, so
 * the UI never breaks mid-demo.
 *
 * RUN IT:
 *   1. cp server/.env.example server/.env   (then add your real key)
 *   2. npm run dev:all   (runs this server + Vite together)
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import {fileURLToPath} from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// Secure application with helmet headers
app.use(helmet());

// In production, FRONTEND_URL is set to the Render Static Site URL so only
// your deployed frontend can call this server. In dev, allow everything.
const allowedOrigin = process.env.FRONTEND_URL || "*";

app.use(cors({
  origin: allowedOrigin,
  methods: ["POST", "GET"],
}));
app.use(express.json({ limit: "10kb" }));

// Rate limit request to eco-tip endpoint to prevent abuse
const tipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many eco tips requested from this IP, please try again after 15 minutes."
  }
});

app.use("/api/eco-tip", tipLimiter);

const PORT = process.env.PORT || 3001;
const GROQ_MODEL = "llama-3.1-8b-instant";

// Shown if GROQ_API_KEY is missing or the Groq request fails — keeps the
// demo resilient (no internet, rate-limited, bad key, etc).
const FALLBACK_TIPS = [
  "Try swapping one car trip this week for walking, cycling, or public transport — every small switch adds up!",
  "Unplugging devices on standby can shave a surprising amount off your energy footprint over a month.",
  "One plant-based meal a day can meaningfully reduce your weekly carbon footprint — even just swapping lunch.",
  "Batching errands into a single trip cuts down on repeated short drives, which are often the least efficient.",
  "Small, consistent choices beat occasional big ones — your streak is the real win here.",
];

function randomFallback() {
  return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
}

/**
 * Build the prompt sent to Groq from the habit summary the frontend sends.
 *   summary: { category, type, value, impactG, savedG, points, streak, totalPoints }
 */
function buildPrompt(summary) {
  return (
    "You are a friendly, encouraging sustainability coach inside a " +
    "gamified habit-tracking app. Based on the user's most recent " +
    "logged activity below, give ONE short, specific, actionable tip " +
    "(max 2 sentences) to help them reduce their carbon footprint. " +
    "Be warm and motivating, not preachy.\n\n" +
    `Recent activity: ${JSON.stringify(summary)}`
  );
}

// Health check — Render pings this to verify the service is up.
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/eco-tip", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || !req.body.summary) {
    return res.status(400).json({ error: "Invalid request body: 'summary' is required." });
  }

  const summary = req.body.summary;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.json({ tip: randomFallback(), source: "fallback" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are a concise, friendly sustainability coach." },
          { role: "user", content: buildPrompt(summary) },
        ],
        max_tokens: 120,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API responded with ${response.status}`);
    }

    const data = await response.json();
    const tip = data.choices?.[0]?.message?.content?.trim();

    return res.json({ tip: tip || randomFallback(), source: tip ? "ai" : "fallback" });
  } catch (err) {
    console.error("[eco-tip] Groq request failed:", err.message);
    return res.json({ tip: randomFallback(), source: "fallback" });
  }
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`AI proxy server running at http://localhost:${PORT}`);
  });
}

export default app;

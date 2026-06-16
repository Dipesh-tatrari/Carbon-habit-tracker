/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // "Limelight" — a custom green ramp spanning deep emerald to
        // electric lime, used for gradients, glows, and accent rings.
        // Tailwind's built-in `emerald-*` and `lime-*` scales are still
        // used directly throughout the UI (e.g. text-emerald-400,
        // ring-emerald-500/50) — this scale exists for spots that need
        // a blended in-between tone or a gradient endpoint.
        limelight: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80", // bridges emerald & lime
          500: "#22e08f", // emerald/lime midpoint — primary accent
          600: "#16c97a",
          700: "#0fa968",
          800: "#0a7a4d",
          900: "#064e3b",
        },
        // Deep charcoal/slate surfaces for the dark theme.
        surface: {
          DEFAULT: "#0f172a", // slate-900 — page background
          raised: "#1e293b",  // slate-800 — card base (under glass blur)
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        // "Limelight" glow effects — soft radial halos behind cards.
        glow: "0 0 40px -10px rgba(34, 224, 143, 0.45)",
        "glow-lg": "0 0 70px -15px rgba(34, 224, 143, 0.55)",
        "glow-lime": "0 0 45px -12px rgba(163, 230, 53, 0.5)",
        "glow-inset": "inset 0 1px 0 0 rgba(255,255,255,0.06)",
      },
      keyframes: {
        "pulse-ring": {
          "0%, 100%": { boxShadow: "0 0 0px rgba(163, 230, 53, 0.35)" },
          "50%": { boxShadow: "0 0 35px rgba(163, 230, 53, 0.65)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

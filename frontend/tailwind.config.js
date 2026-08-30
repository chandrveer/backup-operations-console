/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        base: {
          DEFAULT: "#0B0F14",
          50: "#F7F9FA",
          100: "#E8EDF2",
        },
        surface: {
          DEFAULT: "#131A22",
          raised: "#1B232C",
          hover: "#212B36",
        },
        borderc: "#26313C",
        brand: {
          DEFAULT: "#4C9EF1",
          dim: "#2E5F8F",
          glow: "#7CBAFF",
        },
        signal: {
          success: "#3DDC84",
          warning: "#F5A623",
          critical: "#FF5470",
          info: "#4C9EF1",
          idle: "#6B7A8C",
        },
        light: {
          bg: "#F5F7FA",
          surface: "#FFFFFF",
          border: "#E1E7ED",
          text: "#101826",
          textdim: "#5B6B7C",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(76,158,241,0.15), 0 8px 24px -8px rgba(76,158,241,0.25)",
        card: "0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.55 },
        },
        sweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(6px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        sweep: "sweep 4s linear infinite",
        "fade-up": "fadeUp 0.35s ease-out",
      },
    },
  },
  plugins: [],
};

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        leonote: {
          neutral: {
            950: "#06070a",
            925: "#0a0c11",
            900: "#10131a",
            850: "#141923",
            800: "#1a2230",
            750: "#222c3d",
            700: "#2c374b",
            600: "#45516a",
            500: "#64728c",
            400: "#90a0bf",
            300: "#bec8da",
            100: "#f4f7fb",
          },
          brand: {
            indigo: "#6366f1",
            violet: "#7c3aed",
            cyan: "#22d3ee",
          },
          success: "#34d399",
          warning: "#fbbf24",
          danger: "#fb7185",
          info: "#38bdf8",
        },
      },
      borderRadius: {
        panel: "24px",
        card: "20px",
      },
      boxShadow: {
        glass: "0 24px 72px rgba(2,6,23,0.28)",
        glow: "0 24px 72px rgba(32,44,102,0.38)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #6366f1 0%, #7c3aed 52%, #22d3ee 100%)",
        "brand-radial": "radial-gradient(circle at top, rgba(99,102,241,.24), rgba(124,58,237,.14) 42%, rgba(34,211,238,.08) 72%, transparent 100%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.72", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        breathe: "breathe 3.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

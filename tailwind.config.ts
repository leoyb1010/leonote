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
        app: {
          bg: "var(--bg-app)",
          subtle: "var(--bg-subtle)",
        },
        surface: {
          base: "var(--surface-base)",
          raised: "var(--surface-raised)",
          overlay: "var(--surface-overlay)",
          glass: "var(--surface-glass)",
        },
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
          focus: "var(--border-focus)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          placeholder: "var(--text-placeholder)",
        },
        brand: {
          primary: "var(--primary)",
          hover: "var(--primary-hover)",
          soft: "var(--primary-soft)",
          pressed: "var(--primary-pressed)",
        },
        ai: {
          DEFAULT: "var(--ai-accent)",
          soft: "var(--ai-soft)",
        },
        semantic: {
          success: "var(--success)",
          "success-soft": "var(--success-soft)",
          warning: "var(--warning)",
          "warning-soft": "var(--warning-soft)",
          danger: "var(--danger)",
          "danger-soft": "var(--danger-soft)",
          info: "var(--info)",
          "info-soft": "var(--info-soft)",
        },
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        glow: "var(--shadow-glow)",
      },
      fontFamily: {
        ui: "var(--font-ui)",
        mono: "var(--font-mono)",
        reading: "var(--font-reading)",
      },
      fontSize: {
        xs: ["var(--text-xs)", { lineHeight: "var(--leading-normal)" }],
        sm: ["var(--text-sm)", { lineHeight: "var(--leading-normal)" }],
        base: ["var(--text-base)", { lineHeight: "var(--leading-relaxed)" }],
        md: ["var(--text-md)", { lineHeight: "var(--leading-relaxed)" }],
        lg: ["var(--text-lg)", { lineHeight: "var(--leading-tight)" }],
        xl: ["var(--text-xl)", { lineHeight: "var(--leading-tight)" }],
        "2xl": ["var(--text-2xl)", { lineHeight: "var(--leading-tight)" }],
        "3xl": ["var(--text-3xl)", { lineHeight: "var(--leading-tight)" }],
        "4xl": ["var(--text-4xl)", { lineHeight: "var(--leading-tight)" }],
      },
      spacing: {
        "4xs": "var(--space-4xs)",
        "3xs": "var(--space-3xs)",
        "2xs": "var(--space-2xs)",
        xs: "var(--space-xs)",
        sm: "var(--space-sm)",
        md: "var(--space-md)",
        lg: "var(--space-lg)",
        xl: "var(--space-xl)",
        "2xl": "var(--space-2xl)",
        "3xl": "var(--space-3xl)",
        "4xl": "var(--space-4xl)",
      },
      animation: {
        "fade-in": "fadeIn var(--motion-medium) var(--ease-out)",
        "slide-up": "slideUp var(--motion-medium) var(--ease-out)",
        "scale-in": "scaleIn var(--motion-medium) var(--ease-out)",
        "skeleton-pulse": "skeletonPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.98)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        skeletonPulse: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

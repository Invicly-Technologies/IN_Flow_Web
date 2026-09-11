import type { Config } from "tailwindcss";
import { colors } from "./src/lib/design-tokens";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: colors.primary,
          blue: colors.blue,
          cyan: colors.cyan,
        },
        navy: {
          DEFAULT: colors.dark,
          surface: colors.darkSurface,
          surface2: colors.darkSurface2,
          border: colors.darkBorder,
        },
        state: {
          success: colors.success,
          warning: colors.warning,
          danger: colors.danger,
        },
        priority: {
          p1: colors.danger,
          p2: colors.warning,
          p3: colors.blue,
          p4: colors.textFaint,
        },
        // Theme-aware semantic tokens — flip automatically with the `dark` class
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface-2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        text: {
          DEFAULT: "rgb(var(--text) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          faint: "rgb(var(--text-faint) / <alpha-value>)",
        },
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "12px",
        lg: "18px",
        xl: "24px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(21,32,51,.04)",
        DEFAULT: "0 4px 16px rgba(21,32,51,.06)",
        lg: "0 12px 32px rgba(21,32,51,.10)",
      },
      backgroundImage: {
        "brand-flow": `linear-gradient(90deg, ${colors.primary} 0%, ${colors.blue} 55%, ${colors.cyan} 100%)`,
        "brand-flow-soft": `linear-gradient(135deg, rgba(109,61,245,.12), rgba(49,92,255,.10) 55%, rgba(25,200,232,.12))`,
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

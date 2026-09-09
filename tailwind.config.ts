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
          dark: colors.dark,
        },
        surface: {
          background: colors.background,
          white: colors.white,
        },
        state: {
          success: colors.success,
          warning: colors.warning,
          danger: colors.danger,
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      backgroundImage: {
        "brand-flow": `linear-gradient(90deg, ${colors.primary} 0%, ${colors.blue} 55%, ${colors.cyan} 100%)`,
      },
    },
  },
  plugins: [],
};

export default config;

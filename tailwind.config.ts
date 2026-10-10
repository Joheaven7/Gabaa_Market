import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        zemen: {
          dark: "#080E14",
          card: "#0F1823",
          hover: "#152232",
          border: "#1E2F44",
          gold: {
            light: "#F5DF9E",
            DEFAULT: "#D4AF37",
            dark: "#A38018",
            hover: "#E5C158",
          },
          emerald: {
            light: "#34D399",
            DEFAULT: "#059669",
            dark: "#065F46",
          },
          red: {
            light: "#F87171",
            DEFAULT: "#DC2626",
            dark: "#991B1B",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 20px -3px rgba(212, 175, 55, 0.25)",
        emerald: "0 0 20px -3px rgba(5, 150, 105, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;

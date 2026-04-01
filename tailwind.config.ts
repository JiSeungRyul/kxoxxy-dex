import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        "muted-foreground": "rgb(var(--muted-foreground) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-foreground": "rgb(var(--accent-foreground) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        toggle: "rgb(var(--toggle) / <alpha-value>)",
        "toggle-foreground": "rgb(var(--toggle-foreground) / <alpha-value>)",
        "toggle-active": "rgb(var(--toggle-active) / <alpha-value>)",
        "toggle-active-foreground": "rgb(var(--toggle-active-foreground) / <alpha-value>)",
        "toggle-ring": "rgb(var(--toggle-ring) / <alpha-value>)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)"],
        body: ["var(--font-ibm-plex-sans)"],
      },
    },
  },
  plugins: [],
};

export default config;

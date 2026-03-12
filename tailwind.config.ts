import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f4efe6",
        ink: "#201714",
        ember: "#d94b31",
        emberDark: "#9f2f1b",
        pine: "#1d4d45",
        sand: "#d9cbb7",
        smoke: "#7d6f67",
        panel: "#fffaf2",
      },
      boxShadow: {
        card: "0 18px 40px rgba(32, 23, 20, 0.08)",
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


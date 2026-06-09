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
        // Cream paper background, deep clay accent — the HDB-brick aesthetic
        paper: {
          DEFAULT: "#F5F1EA",
          dim: "#EDE7DC",
          deep: "#E2D9C7",
        },
        ink: {
          DEFAULT: "#1A1814",
          soft: "#3A352D",
          muted: "#6B6357",
          faint: "#A39A8A",
        },
        clay: {
          DEFAULT: "#A6422C",
          dim: "#8B3525",
          deep: "#6D2818",
          wash: "#F5E6E0",
        },
        leaf: "#4A6741", // for "good" scores
        rust: "#B85730", // for "bad" / commute warnings
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
      },
    },
  },
  plugins: [],
};
export default config;

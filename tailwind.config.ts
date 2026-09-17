import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core surface palette — black / near-black background, charcoal cards.
        ink: {
          950: "#050506",
          900: "#0a0b0d",
          850: "#0e0f12",
          800: "#131519",
          750: "#181b20",
          700: "#1f232a",
          600: "#2a2f37",
        },
        // Text
        fg: "#f2f4f7",
        muted: "#8b93a1",
        faint: "#5b616c",
        // Accents
        signal: {
          // electric cyan / teal highlight
          DEFAULT: "#12e6c8",
          bright: "#2df5da",
          dim: "#0e9e8c",
        },
        buy: "#22c78a",
        sell: "#f0526a",
        warn: "#f5b544",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.8)",
        glow: "0 0 0 1px rgba(18,230,200,0.25), 0 0 24px -6px rgba(18,230,200,0.35)",
      },
      keyframes: {
        "signal-in": {
          "0%": { opacity: "0", transform: "translateY(-8px)", backgroundColor: "rgba(18,230,200,0.06)" },
          "60%": { backgroundColor: "rgba(18,230,200,0.06)" },
          "100%": { opacity: "1", transform: "translateY(0)", backgroundColor: "transparent" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "signal-in": "signal-in 0.7s ease-out",
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

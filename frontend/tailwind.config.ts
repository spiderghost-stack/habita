import type { Config } from "tailwindcss";

// Palette tirée du logo HaBiTa : le bleu pétrole de la toiture et l'or du
// dégradé central. Le reste (neutres, fond) est construit autour de ces deux
// couleurs plutôt que d'utiliser les gris par défaut de Tailwind.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        petrole: {
          50: "#eef5f4",
          100: "#d3e6e4",
          200: "#a7cdc9",
          300: "#79b3ac",
          400: "#4c9891",
          500: "#2c7a72",
          600: "#1d5f58",
          700: "#164a45",
          800: "#0f3733",
          900: "#0a2624",
        },
        or: {
          50: "#fbf6ea",
          100: "#f4e8c6",
          200: "#eacf8d",
          300: "#dfb459",
          400: "#cf9a35",
          500: "#b17f28",
          600: "#8c6420",
        },
        fond: "#f7f6f2",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};
export default config;

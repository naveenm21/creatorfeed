import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        card: "#0A0A0A",
        cardhover: "#111111",
        borderdefault: "#1F1F1F",
        borderhover: "#333333",
        primary: "#F7F7F7",
        secondary: "#888888",
        tertiary: "#555555",
        brandpurple: "#7C3AED",
        brandpurplehover: "#6D28D9",
        brandpurplesubtle: "#1A0533",
        ytred: "#FF0000",
        igpink: "#E1306C",
        tiktokwhite: "#FFFFFF",
        gold: "#F59E0B",
      },
      fontFamily: {
        sans: ['var(--font-inter)'], // Used Inter font variable defined in layout
      },
    },
  },
  plugins: [],
};
export default config;

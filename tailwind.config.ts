import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--canvas)",
        card: "var(--surface)",
        cardhover: "var(--surface-alt)",
        borderdefault: "var(--hairline)",
        borderhover: "var(--hairline-soft)",
        primary: "var(--ink)",
        secondary: "var(--text-2)",
        tertiary: "var(--text-3)",
        brandprimary: "var(--pink)",
        brandprimaryhover: "var(--pink-deep)",
        brandprimarysubtle: "var(--pink-soft)",
        brandorange: "var(--pink)",
        ytred: "#FF0000",
        igpink: "#E1306C",
        tiktokwhite: "#000000", /* Changed to black for contrast on light mode */
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;

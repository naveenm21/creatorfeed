import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#030303",
        card: "#1A1A1B",
        cardhover: "#272729",
        borderdefault: "#343536",
        borderhover: "#444546",
        primary: "#D7DADC",
        secondary: "#818384",
        tertiary: "#555555",
        brandprimary: "#FF4500", // Reddit Orangered
        brandprimaryhover: "#FF5722",
        brandprimarysubtle: "rgba(255, 69, 0, 0.1)",
        brandorange: "#FF4500",
        ytred: "#FF0000",
        igpink: "#E1306C",
        tiktokwhite: "#FFFFFF",
      },
      fontFamily: {
        sans: ['var(--font-inter)'], // Used Inter font variable defined in layout
      },
    },
  },
  plugins: [],
};
export default config;

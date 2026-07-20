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
        trapac: {
          orange: "#f15c27",
          "orange-dark": "#d94e1e",
          navy: "#141e28",
          dark: "#020202",
          gray: "#a7a9ac",
          "gray-light": "#dce6f0",
          blue: "#1779ba",
          amber: "#ffae00",
        },
      },
      fontFamily: {
        sans: ['"Trade Gothic Next"', "trade-gothic-next", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

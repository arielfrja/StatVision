import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        electric: "#00D1FF",
        action: "#fe6b00",
        gold: "#D4AF37",
        stadium: "#0c0e10",
        container: "#161a1e",
        "container-high": "#1b2025",
        "container-highest": "#20262c",
      },
    },
  },
  plugins: [],
} satisfies Config;

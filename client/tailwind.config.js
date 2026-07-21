/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0eeff",
          100: "#e0ddff",
          300: "#b8b3ff",
          400: "#a5a0ff",
          500: "#6c63ff",
          600: "#4f46e5",
          700: "#3730c4",
          900: "#1e1a8a",
        },
        surface: {
          50:  "#f0f0f8",
          100: "#e0e0f0",
          200: "#c4c4d4",
          500: "#55556a",
          600: "#2a2a3d",
          700: "#1a1a28",
          800: "#12121a",
          900: "#0f0f18",
          950: "#0a0a0f",
        },
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

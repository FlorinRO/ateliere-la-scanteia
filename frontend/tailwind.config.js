/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#f6f3ee", // crem galerie (background principal)
          top: "#f8f5f0", // ușor mai deschis (sus)
          bottom: "#f2efe9", // ușor mai cald (jos)
        },
        ink: {
          50: "#fafafa",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
        },
        accent: {
          600: "#7f1d1d", // burgundy elegant
          700: "#6b1a1a",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0, 0, 0, 0.06)",
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
        "3xl": "2rem",
      },
      letterSpacing: {
        wideplus: "0.18em",
      },
    },
  },
  plugins: [],
};

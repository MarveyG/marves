/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#6C3FC5',
          dark: '#2D1B5E',
          light: '#F0EBFF',
          lavender: '#C4AAFF',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      }
    },
  },
  plugins: [],
}
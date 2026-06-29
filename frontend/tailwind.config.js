/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sakura': '#FFB7C5',
        'campus-blue': '#4A90D9',
        'academic-purple': '#9B59B6',
        'energy-orange': '#FF8C42',
        'healing-green': '#5CD85C',
        'alert-red': '#E74C3C',
      }
    },
  },
  plugins: [],
}
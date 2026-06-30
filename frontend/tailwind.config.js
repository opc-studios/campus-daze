/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sakura-pink': '#FFB7C5',
        'campus-blue': '#4A90D9',
        'academic-purple': '#9B59B6',
        'vitality-orange': '#FF8C42',
        'healing-green': '#5CD85C',
        'alert-red': '#E74C3C',
      },
      fontFamily: {
        'game': ['"Source Han Sans"', 'sans-serif'],
      },
      borderRadius: {
        'game': '8px',
      }
    },
  },
  plugins: [],
}

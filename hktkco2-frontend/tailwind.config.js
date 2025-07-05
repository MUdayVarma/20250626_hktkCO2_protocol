/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hbco2-green': '#4ade80',
        'hbco2-dark': '#16a34a',
      }
    },
  },
  plugins: [],
}
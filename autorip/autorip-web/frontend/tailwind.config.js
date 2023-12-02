/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 5s linear infinite',
      },
      gridTemplateRows: {
        "layout": "auto 1fr"
      }
    },
  },
  daisyui: {
    themes: ["dracula"]
  },
  plugins: [require("daisyui")],
}

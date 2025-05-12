/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
       colors:{
        'primary':'#ff6900',
        'secondary':'#fff'
      }
    },
  },
  plugins: [],
}
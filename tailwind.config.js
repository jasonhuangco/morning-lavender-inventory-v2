/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdecd7',
          200: '#fad5ae',
          300: '#f6b67a',
          400: '#f18b44',
          500: '#ed6c1f',
          600: '#de5315',
          700: '#b83e14',
          800: '#933218',
          900: '#762b16',
        }
      }
    },
  },
  plugins: [],
}

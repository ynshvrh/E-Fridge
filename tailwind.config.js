/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f5',
          100: '#e5ece7',
          200: '#cbdbcf',
          300: '#a4c2ad',
          400: '#77a484',
          500: '#548762',
          600: '#416c4e',
          700: '#35563f',
          800: '#2d4634',
          900: '#263a2c',
        },
      },
    },
  },
  plugins: [],
}

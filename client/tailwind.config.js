/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        odoo: {
          50: '#f6f5f8',
          100: '#ede9f1',
          200: '#ded6e5',
          500: '#714B67', // Classic Odoo Purple
          600: '#5c3d54',
          700: '#482f42',
          800: '#342230',
          teal: '#00A09D', // Odoo secondary teal
          orange: '#F06050',
          yellow: '#F4A425',
          green: '#28A745',
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'background-orange': '#F7A93A',
        'orange': '#F47A36',
        'purple': '#7A4CC2',
        'black': '#1C1C1C',
        'white': '#FFFFFF',
        'gray': {
          50: '#F5F5F5',
          100: 'rgba(28, 28, 28, 0.1)',
          200: 'rgba(28, 28, 28, 0.2)',
          500: 'rgba(28, 28, 28, 0.5)',
          700: 'rgba(28, 28, 28, 0.7)',
        }
      }
    },
  },
  plugins: [],
};

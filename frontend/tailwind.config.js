/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        company: {
          red: '#E64141',
          dark: '#0B111A',
          surface: '#121922',
          panel: '#18212E',
          border: '#263141',
          muted: '#7F93AD',
          text: '#E8EEF8',
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4fa',
          100: '#d9e2f0',
          200: '#b3c5e1',
          300: '#7d9bcb',
          400: '#4869ab',
          500: '#2b4a87',
          600: '#1e3868',
          700: '#16294d',
          800: '#101f3a',
          900: '#0a1528',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Thème officiel de l'école : bleu foncé (EMIT)
        primaire: {
          50: '#eff5fb',
          100: '#d8e6f4',
          200: '#b0cbe8',
          300: '#7fa8d6',
          400: '#4a7fb8',
          500: '#2b5e94',
          600: '#1f4a78',
          700: '#173a60',
          800: '#102b48',
          900: '#0a1e33',
        },
        accent: '#3f88c5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

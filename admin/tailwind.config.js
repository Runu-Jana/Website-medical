/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0e9f8e',
          50: '#effbf8',
          100: '#d4f5ee',
          200: '#a9ebdd',
          300: '#71dcc8',
          400: '#38c4ad',
          500: '#14a890',
          600: '#0e9f8e',
          700: '#0c8174',
          800: '#0d665d',
          900: '#0e544d',
        },
        accent: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
        },
        danger: {
          DEFAULT: '#ef4444',
          light: '#f87171',
        },
        sidebar: '#0f172a',
        content: '#f1f5f9',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)',
        card: '0 4px 16px -2px rgba(16,24,40,0.06), 0 2px 6px -2px rgba(16,24,40,0.04)',
      },
    },
  },
  plugins: [],
};

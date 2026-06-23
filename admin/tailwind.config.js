/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1c64f2',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1c64f2',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          DEFAULT: '#16a34a',
          light: '#22c55e',
          dark: '#15803d',
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

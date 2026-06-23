/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1c64f2',
        primaryDark: '#1a56db',
        accent: '#16a34a',
        dark: '#1e293b',
        lightbg: '#f8fafc',
        bordergray: '#e2e8f0',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
        lift: '0 10px 25px -5px rgba(28,100,242,0.15), 0 8px 10px -6px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}

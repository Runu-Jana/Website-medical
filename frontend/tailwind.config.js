/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0e9f8e',
        primaryDark: '#0c8174',
        accent: '#16a34a',
        dark: '#1e293b',
        lightbg: '#f8fafc',
        bordergray: '#e2e8f0',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Bumped up one notch project-wide so body text reads larger.
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.1rem' }],
        sm: ['1rem', { lineHeight: '1.5rem' }],
        base: ['1.125rem', { lineHeight: '1.75rem' }],
        lg: ['1.25rem', { lineHeight: '1.85rem' }],
        xl: ['1.375rem', { lineHeight: '1.9rem' }],
        '2xl': ['1.625rem', { lineHeight: '2.1rem' }],
        '3xl': ['1.95rem', { lineHeight: '2.35rem' }],
        '4xl': ['2.5rem', { lineHeight: '2.75rem' }],
        '5xl': ['3.25rem', { lineHeight: '1.1' }],
        '6xl': ['4rem', { lineHeight: '1.1' }],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
        lift: '0 10px 25px -5px rgba(14,159,142,0.18), 0 8px 10px -6px rgba(0,0,0,0.06)',
      },
      keyframes: {
        // Indeterminate top progress bar (sweeps across while a chunk loads).
        loadbar: {
          '0%': { transform: 'translateX(-100%) scaleX(0.4)' },
          '50%': { transform: 'translateX(30%) scaleX(0.7)' },
          '100%': { transform: 'translateX(120%) scaleX(0.4)' },
        },
        // Soft left-to-right shimmer for skeleton blocks.
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        loadbar: 'loadbar 1.1s ease-in-out infinite',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}

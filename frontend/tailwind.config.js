/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'brand-blue':        '#2563eb',
        'brand-blue-dark':   '#1e40af',
        'brand-blue-mid':    '#1d4ed8',
        'brand-blue-faint':  '#eff6ff',
        'brand-red':         '#DE0F17',
        'brand-red-light':   '#fce8e9',
        'brand-green':       '#99CC33',
        'brand-green-dark':  '#7aaa1f',
        'brand-green-light': '#f5fae8',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn:    'fadeIn 0.25s ease forwards',
        scaleIn:   'scaleIn 0.2s ease forwards',
        slideDown: 'slideDown 0.2s ease forwards',
      },
    },
  },
  plugins: [],
};

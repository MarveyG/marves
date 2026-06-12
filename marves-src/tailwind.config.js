/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple:      '#6C3FC5',
          'purple-dark': '#2D1B5E',
          'purple-light': '#F0EBFF',
          lavender:    '#C4AAFF',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger:  '#EF4444',
      },
      fontFamily: {
        sans:    ['DM Sans', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(108,63,197,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        nav: '0 1px 0 #E5E7EB',
      },
    },
  },
  plugins: [],
}

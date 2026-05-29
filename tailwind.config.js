/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        alfa: {
          red: '#EF3124',
          burgundy: '#EF3124', // унифицировано с Альфа-красным
        },
        graphite: '#111111',
        'gray-dark': '#3A3A3A',
        'gray-mid': '#7A7A7A',
        'bg-light': '#F4F5F7',
        'ring-track': '#E8EAED',
        'ring-track-soft': '#EEF0F3',
      },
      fontFamily: {
        sans: ['Roboto', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(17,17,17,0.04), 0 10px 30px rgba(17,17,17,0.06)',
        'card-sm': '0 1px 2px rgba(17,17,17,0.05), 0 4px 14px rgba(17,17,17,0.05)',
        sheet: '0 -10px 50px rgba(17,17,17,0.16)',
        frame: '0 30px 80px rgba(17,17,17,0.18)',
      },
      keyframes: {
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'sheet-up': 'sheet-up 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'pop-in': 'pop-in 0.28s ease-out both',
      },
    },
  },
  plugins: [],
}

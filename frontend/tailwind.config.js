/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070b14',
          900: '#0a101d',
          800: '#111827',
          700: '#1e293b'
        },
        linux: {
          green: '#10b981',
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          yellow: '#f59e0b',
          red: '#ef4444'
        }
      },
      animation: {
        'gradient-x': 'gradient-x 3s ease infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 5px theme("colors.cyan.400"), 0 0 20px theme("colors.cyan.400")' },
          '100%': { boxShadow: '0 0 10px theme("colors.cyan.500"), 0 0 30px theme("colors.cyan.500")' },
        }
      }
    },
  },
  plugins: [],
}

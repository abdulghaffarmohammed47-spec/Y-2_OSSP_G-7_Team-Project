/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        workspace: '#050B14',
        elevated: '#0F172A',
        navy: {
          950: '#070b14',
          900: '#0a101d',
          800: '#111827',
          700: '#1e293b'
        },
        linux: {
          green: '#10B981',
          cyan: '#22D3EE',
          violet: '#8B5CF6',
          amber: '#F59E0B',
          red: '#EF4444'
        }
      },
      boxShadow: {
        'cyan-glow': '0 0 15px rgba(34, 211, 238, 0.15)',
        'emerald-glow': '0 0 15px rgba(16, 185, 129, 0.15)',
        'amber-glow': '0 0 15px rgba(245, 158, 11, 0.15)',
        'red-glow': '0 0 15px rgba(239, 68, 68, 0.15)'
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
          '0%': { boxShadow: '0 0 5px rgba(34, 211, 238, 0.4), 0 0 20px rgba(34, 211, 238, 0.4)' },
          '100%': { boxShadow: '0 0 10px rgba(34, 211, 238, 0.6), 0 0 30px rgba(34, 211, 238, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}

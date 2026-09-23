/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nexora: {
          bg: '#07080C',        // Ultra-deep root canvas
          secondary: '#0C0F15', // Secondary container layer
          surface: '#10141C',   // Surface panels and cards
          elevated: '#151A23',  // Elevated popovers, modals & decks
          border: '#1E2535',    // Subtle structural separation
          borderLight: 'rgba(255, 255, 255, 0.09)',
          muted: '#8E9BB0',     // Readable secondary text
          dim: '#4F5B70',       // Passive placeholders & counters
          accent: {
            cyan: '#00F0FF',
            blue: '#3B82F6',
            violet: '#8B5CF6',
            purple: '#A855F7',
            emerald: '#10B981',
            amber: '#F59E0B',
            rose: '#F43F5E',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 240, 255, 0.35)',
        'glow-violet': '0 0 25px -5px rgba(139, 92, 246, 0.35)',
        'glow-sm': '0 0 15px -3px rgba(0, 240, 255, 0.25)',
        'card-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
        'panel': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'speaking-wave': {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.6)' },
          '50%': { transform: 'scale(1.03)', boxShadow: '0 0 0 6px rgba(16, 185, 129, 0.2)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'speaking-wave': 'speaking-wave 1.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}

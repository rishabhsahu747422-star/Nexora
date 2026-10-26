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
          bg: '#090909',        // App background canvas
          workspace: '#0B0B0D', // Main workspace
          surface: '#111113',   // Primary panels and sidebars
          secondary: '#161619', // Secondary container layer
          elevated: '#1C1C20',  // Elevated popovers, modals & decks
          hover: '#252529',     // Hover background
          border: '#2D2D32',    // Borders and dividers
          borderLight: 'rgba(255, 255, 255, 0.08)',
          muted: '#A1A1AA',     // Secondary text
          dim: '#71717A',       // Passive placeholders
          accent: {
            crimson: '#E10600',
            lavender: '#B69CFF',
            blue: '#4D8DFF',
            saffron: '#FFC247',
            emerald: '#35D6A2',
            rose: '#FF75B5',
            cyan: '#40D9E8',
            orange: '#FF8A4C',
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

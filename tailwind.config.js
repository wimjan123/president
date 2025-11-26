/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        void: '#0a0c10',
        base: '#0f1318',
        surface: '#161b22',
        elevated: '#1c222b',
        overlay: '#242b36',
        player: {
          DEFAULT: '#3b82f6',
          dark: '#1d4ed8',
        },
        rival: {
          DEFAULT: '#ef4444',
          dark: '#b91c1c',
        },
        gold: '#f59e0b',
        cyan: '#06b6d4',
      },
      animation: {
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'post-enter': 'postEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'response-enter': 'responseEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-pause': 'pulsePause 2s ease-in-out infinite',
        'atmosphere': 'atmosphere 20s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        postEnter: {
          from: { opacity: '0', transform: 'translateY(-30px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        responseEnter: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulsePause: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(245, 158, 11, 0)' },
        },
        atmosphere: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A0E1A',
          surface: '#111827',
          elevated: '#1A2234',
        },
        border: {
          DEFAULT: '#1E293B',
        },
        brand: {
          DEFAULT: '#7C3AED',
          light: '#8B5CF6',
          dark: '#5B21B6',
        },
        success: {
          DEFAULT: '#059669',
          light: '#34D399',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FBBF24',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#F87171',
        },
        text: {
          primary: '#F1F5F9',
          muted: '#64748B',
          subtle: '#94A3B8',
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124, 58, 237, 0.15), 0 8px 24px -8px rgba(124, 58, 237, 0.25)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'ring-fill': {
          '0%': { strokeDashoffset: 'var(--ring-circumference)' },
          '100%': { strokeDashoffset: 'var(--ring-offset)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-18px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(14px) translateX(-10px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'ring-fill': 'ring-fill 1s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

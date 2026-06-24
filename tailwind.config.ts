import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neo: {
          // Dark section palette
          950: '#010710',
          900: '#030D20',
          800: '#061435',
          700: '#0A1C48',
          600: '#0E2560',
          500: '#143180',
          400: '#1C42A8',
          300: '#2856CC',
          // Brand accent
          blue:   '#2563EB',
          sky:    '#0EA5E9',
          gold:   '#F59E0B',
          green:  '#10B981',
          rose:   '#F43F5E',
          purple: '#7C3AED',
          amber:  '#F59E0B',
          // Light section palette
          light:        '#EEF2FF',
          'light-2':    '#F0F5FF',
          'light-card': '#FFFFFF',
          'light-border':'#DBEAFE',
          muted:        '#64748B',
          // Glow utils
          'blue-glow':  'rgba(37,99,235,0.18)',
          'gold-glow':  'rgba(245,158,11,0.2)',
          'sky-glow':   'rgba(14,165,233,0.15)',
          // Keep legacy refs
          cyan:         '#22D3EE',
          'blue-light': '#93C5FD',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'Cascadia Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'gradient-neo':     'linear-gradient(160deg, #010F2E 0%, #030D20 40%, #061435 100%)',
        'gradient-hero':    'linear-gradient(160deg, #010F2E 0%, #030D20 60%, #071840 100%)',
        'gradient-light':   'linear-gradient(160deg, #EEF2FF 0%, #F0F5FF 100%)',
        'gradient-card-dark':'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'gradient-blue':    'linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)',
        'gradient-gold':    'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
        'gradient-mesh':    'radial-gradient(at 30% 20%, hsla(220,100%,55%,0.12) 0px, transparent 50%), radial-gradient(at 80% 80%, hsla(200,100%,50%,0.08) 0px, transparent 50%)',
        'route-line':       'linear-gradient(90deg, transparent, #2563EB, transparent)',
      },
      animation: {
        'fade-up':    'fadeUp 0.6s ease-out forwards',
        'fade-in':    'fadeIn 0.8s ease-out forwards',
        'pulse-blue': 'pulseBlue 3s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
        'slide-in':   'slideIn 0.4s ease-out forwards',
        'flow':       'flow 2s linear infinite',
        'ping-slow':  'ping 2.5s cubic-bezier(0,0,0.2,1) infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseBlue: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(37,99,235,0.25)' },
          '50%':       { boxShadow: '0 0 40px rgba(37,99,235,0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-10px)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        flow: {
          '0%':   { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      boxShadow: {
        'glow-blue':  '0 0 24px rgba(37,99,235,0.3), 0 0 60px rgba(37,99,235,0.08)',
        'glow-gold':  '0 0 24px rgba(245,158,11,0.35)',
        'glow-sm':    '0 0 12px rgba(37,99,235,0.2)',
        'card-dark':  '0 4px 28px rgba(0,0,0,0.5)',
        'card-hover': '0 8px 48px rgba(0,0,0,0.65)',
        'card-light': '0 2px 16px rgba(37,99,235,0.08)',
        'card-light-hover': '0 6px 32px rgba(37,99,235,0.14)',
        'inner-top':  '0 1px 0 rgba(255,255,255,0.1) inset',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config

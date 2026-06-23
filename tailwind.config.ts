import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neo: {
          950: '#020813',
          900: '#040C1F',
          800: '#07112A',
          700: '#0C1A38',
          600: '#122244',
          500: '#1A2E58',
          400: '#243D72',
          300: '#2E4F8F',
          blue:   '#4B8EF8',
          cyan:   '#22D3EE',
          gold:   '#F59E0B',
          rose:   '#F43F5E',
          purple: '#818CF8',
          'blue-light': '#93C5FD',
          'blue-glow':  'rgba(75,142,248,0.25)',
          'cyan-glow':  'rgba(34,211,238,0.15)',
          'gold-glow':  'rgba(245,158,11,0.2)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-neo': 'linear-gradient(135deg, #040C1F 0%, #07112A 50%, #040C1F 100%)',
        'gradient-glow': 'radial-gradient(ellipse at 50% 0%, rgba(75,142,248,0.15) 0%, transparent 70%)',
        'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        'gradient-gold': 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
        'gradient-blue': 'linear-gradient(135deg, #4B8EF8 0%, #3B82F6 100%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, hsla(218,100%,60%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(240,100%,70%,0.08) 0px, transparent 50%)',
      },
      animation: {
        'fade-up':    'fadeUp 0.6s ease-out forwards',
        'fade-in':    'fadeIn 0.8s ease-out forwards',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
        'scan':       'scan 3s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(75,142,248,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(75,142,248,0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      boxShadow: {
        'glow-blue':   '0 0 30px rgba(75,142,248,0.35)',
        'glow-gold':   '0 0 30px rgba(245,158,11,0.35)',
        'glow-sm':     '0 0 15px rgba(75,142,248,0.2)',
        'card':        '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':  '0 8px 40px rgba(0,0,0,0.6)',
        'premium':     '0 1px 0 rgba(255,255,255,0.1) inset, 0 -1px 0 rgba(0,0,0,0.3) inset',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

export default config

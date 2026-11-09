import type { Config } from 'tailwindcss'

/**
 * Paleta corporativa de ILLAN (extraída de la tarjeta de visita).
 * Los valores viven como variables CSS en src/app/globals.css (:root) para poder
 * ajustarlos en un único sitio si se cambia el tono exacto del verde o el amarillo.
 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans Variable"', 'system-ui', 'sans-serif'],
        display: ['"Source Serif 4 Variable"', 'Georgia', '"Times New Roman"', 'serif'],
        brand: ['"Times New Roman"', 'Times', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          green: {
            DEFAULT: token('green'),
            light: token('green-light'),
            dark: token('green-dark'),
            deep: token('green-deep'),
            tint: token('green-tint'),
          },
          yellow: {
            DEFAULT: token('yellow'),
            dark: token('yellow-dark'),
            light: token('yellow-light'),
          },
        },
        stone: { 950: '#0c0a09' },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        skeleton: 'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        skeleton: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
    },
  },
  plugins: [],
}

export default config

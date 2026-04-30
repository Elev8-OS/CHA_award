import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CHA Brand Colors
        coral:    { DEFAULT: '#D4663F', light: '#E08259', dark: '#B5532F' },
        teal:     { DEFAULT: '#1F8A7A', light: '#2BA694', dark: '#176F62' },
        burgundy: { DEFAULT: '#7A2935', light: '#9A3645', dark: '#5C1F28' },
        gold:     { DEFAULT: '#E8A93C', light: '#EFBC5F', dark: '#C28A28' },
        navy:     { DEFAULT: '#1F3A4F', light: '#2A4D67', dark: '#142838' },

        // Neutrals
        cream:    { DEFAULT: '#F8F2E8', light: '#FCF8F0' },
        'warm-gray': '#6B6055',
        line:     'rgba(31, 58, 79, 0.12)',
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-dm-serif)', 'Georgia', 'serif'],
      },
      fontSize: {
        'display-xl': ['clamp(54px, 10vw, 140px)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(48px, 8vw, 104px)', { lineHeight: '0.92', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(40px, 6.5vw, 84px)', { lineHeight: '0.98', letterSpacing: '-0.02em' }],
      },
      animation: {
        pulse: 'pulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;

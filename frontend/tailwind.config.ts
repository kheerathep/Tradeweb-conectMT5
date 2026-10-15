import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        background: '#0f131c',
        'on-surface': '#dfe2ef',
        'on-surface-variant': '#c8c4d6',
        'surface-container-lowest': '#0a0e17',
        'surface-container-low': '#181c25',
        'surface-container': '#1c2029',
        'surface-container-high': '#262a33',
        'surface-container-highest': '#31353f',
        primary: {
          DEFAULT: '#c7bfff',
          container: '#8e7fff',
          dark: '#5a49cb',
        },
        secondary: {
          DEFAULT: '#51de9d',
          container: '#00b175',
          light: '#71fcb8',
        },
        tertiary: {
          DEFAULT: '#ffb3b5',
          container: '#ea6670',
          dark: '#93000a',
        },
        outline: {
          DEFAULT: '#928f9f',
          variant: '#474554',
        },
        surface: {
          DEFAULT: '#0f131c',
          hover: '#262a33',
          card: '#1c2029',
          border: '#31353f',
        },
        profit: {
          DEFAULT: '#51de9d',
          light: '#71fcb8',
          dark: '#00b175',
          bg: 'rgba(81, 222, 157, 0.12)',
        },
        loss: {
          DEFAULT: '#ea6670',
          light: '#ffb3b5',
          dark: '#b91c1c',
          bg: 'rgba(234, 102, 112, 0.12)',
        },
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#8e7fff',
          600: '#7c3aed',
          700: '#6d28d9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        data: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;

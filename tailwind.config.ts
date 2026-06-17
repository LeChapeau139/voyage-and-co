import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        terra: {
          DEFAULT: '#C2714A',
          dark: '#A85C38',
          light: '#F5E8DF',
        },
        sage: {
          DEFAULT: '#6B8F71',
          light: '#E8F0E9',
        },
        warm: {
          bg: '#FAFAF7',
          border: '#E8DFD0',
          card: '#F7F2EA',
          muted: '#B5A89A',
          secondary: '#8A7B6A',
          primary: '#2C2416',
        },
      },
    },
  },
  plugins: [],
}

export default config

import type { Config } from 'tailwindcss';

const config: Config = {
  // Only include classes used in source files — keeps the production CSS bundle tiny.
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand accent — a clean crypto-blue.
        brand: {
          DEFAULT: '#2563eb',
          light: '#3b82f6',
          dark: '#1d4ed8',
        },
        // Neutral surface colours for cards, backgrounds, etc.
        surface: {
          DEFAULT: '#0f172a',
          card: '#1e293b',
          border: '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;

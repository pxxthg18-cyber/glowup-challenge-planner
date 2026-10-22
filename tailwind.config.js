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
        glow: {
          cream: '#FAF7F2',
          card: '#FFFFFF',
          blush: '#F2DDE3',
          'blush-dark': '#E2BAC4',
          rose: '#C9879B',
          'rose-dark': '#B26F84',
          lavender: '#E8E3F5',
          'lavender-dark': '#CEC5EB',
          sage: '#DCE8DD',
          'sage-dark': '#BFD4C1',
          dark: '#29272B',
          muted: '#77727B',
          subtle: '#F4EFEA',
          border: '#E8E2D9',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        serif: [
          'Playfair Display',
          'Georgia',
          'serif',
        ],
      },
      fontSize: {
        '2xs': ['0.75rem', { lineHeight: '1rem' }],
        'xs': ['0.85rem', { lineHeight: '1.25rem' }],
        'sm': ['0.95rem', { lineHeight: '1.4rem' }],
        'base': ['1.05rem', { lineHeight: '1.6rem' }],
        'lg': ['1.2rem', { lineHeight: '1.75rem' }],
        'xl': ['1.35rem', { lineHeight: '1.9rem' }],
        '2xl': ['1.65rem', { lineHeight: '2.15rem' }],
        '3xl': ['2rem', { lineHeight: '2.45rem' }],
        '4xl': ['2.5rem', { lineHeight: '2.9rem' }],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(41, 39, 43, 0.04)',
        'soft': '0 4px 20px rgba(41, 39, 43, 0.06)',
        'medium': '0 8px 30px rgba(41, 39, 43, 0.08)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}

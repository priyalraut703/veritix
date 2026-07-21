/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design system tokens — see src/styles/tokens.md for rationale.
        paper: '#FFFFFF',
        ink: '#12110F',
        'ink-soft': '#68655D',
        line: '#E7E4DA',
        coral: '#FF4A2E',
        'coral-dim': '#FFE6E0',
        cobalt: '#2A3AFF',
        'cobalt-dim': '#E4E6FF',
        lime: '#D8FF3E',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        body: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        pill: '999px',
      },
      boxShadow: {
        hard: '4px 4px 0 #12110F',
        'hard-sm': '2px 2px 0 #12110F',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 20s linear infinite',
      },
    },
  },
  plugins: [],
}

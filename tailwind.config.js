/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effaf3', 100: '#d7f1e1', 200: '#b1e3c7', 500: '#1f8a54',
          600: '#157043', 700: '#0f5a36', 800: '#0b4529', 900: '#07301c',
        },
        gold: { 100: '#fdf3d0', 400: '#f0b92c', 500: '#d9a21b', 600: '#b98311' },
        ink: '#14201a',
        peach: { 50: '#fff8f3', 100: '#ffeee1', 200: '#ffdcc2', 300: '#ffc299', 400: '#ffa466' },
        mred: { 500: '#e5484d', 600: '#d12b30', 700: '#a91f24', 800: '#7f171b' },
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
      },
      animation: { 'fade-in': 'fade-in .45s ease-out', float: 'float 6s ease-in-out infinite', 'spin-slow': 'spin-slow 40s linear infinite' },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

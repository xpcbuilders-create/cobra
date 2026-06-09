/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 20px 90px rgba(14, 165, 233, 0.08)',
      },
      backgroundImage: {
        'glass-gradient': 'radial-gradient(circle at top, rgba(255,255,255,0.18), transparent 55%)',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0f766e', dark: '#115e59', light: '#d9f6ee' },
        accent:  { DEFAULT: '#f59e0b', dark: '#b45309', light: '#fff7ed' },
      },
    },
  },
  plugins: [],
};

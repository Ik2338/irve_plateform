/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0ea5e9', dark: '#0284c7', light: '#e0f2fe' },
        accent:  { DEFAULT: '#22c55e', dark: '#16a34a' },
      },
    },
  },
  plugins: [],
};

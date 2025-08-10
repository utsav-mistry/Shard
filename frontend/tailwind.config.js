/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        white: {
          100: '#FFFFFF',
          200: '#F9F9F9',
          300: '#F5F5F5',
          400: '#F0F0F0',
          500: '#E5E5E5',
          600: '#DDDDDD',
          700: '#CCCCCC',
          800: '#BBBBBB',
          900: '#AAAAAA',
        },
        black: {
          100: '#999999',
          200: '#777777',
          300: '#555555',
          400: '#333333',
          500: '#222222',
          600: '#1A1A1A',
          700: '#151515',
          800: '#0A0A0A',
          900: '#000000',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
      boxShadow: {
        'inner-md': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'inner-lg': 'inset 0 4px 6px 0 rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-purple': '#9333EA',
        'brand-purple-light': '#C084FC',
        'brand-purple-dark': '#7E22CE',
      },
      fontFamily: {
        'comic': ['Comic Sans MS', 'Comic Neue', 'cursive'],
      },
    },
  },
  plugins: [],
}


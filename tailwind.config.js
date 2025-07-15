/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        'cal': ['Cal Sans', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
      },
      colors: {
        'pixel-yellow': '#FFCC33', // 🟨
        'pixel-orange': '#FF9933', // 🟧
        'pixel-blue': '#004099',   // 🟦
        'pixel-purple': '#9966CC', // 🟪
        'pixel-brown': '#009185',  // 🟫
        'pixel-green': '#33CC66',  // 🟩
      },
    },
  },
  plugins: [],
}
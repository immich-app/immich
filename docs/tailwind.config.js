// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false, // disable Tailwind's reset
  },
  content: ['./src/**/*.{js,jsx,ts,tsx}', './{docs,blog}/**/*.{md,mdx}'], // my markdown stuff is in ../docs, not /src
  darkMode: ['class', '[data-theme="dark"]'], // hooks into docusaurus' dark mode settigns
  theme: {
    extend: {
      colors: {
        // Light Theme
        'immich-primary': '#4250af',
        'immich-bg': '#f9f8fb',
        'immich-fg': 'black',
        'immich-gray': '#F6F6F4',

        // Dark Theme
        'immich-dark-primary': '#adcbfa',
        'immich-dark-bg': '#070a14',
        'immich-dark-fg': '#e5e7eb',
        'immich-dark-gray': '#212121',
      },
    },
  },
  plugins: [],
};

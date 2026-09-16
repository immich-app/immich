// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false, // disable Tailwind's reset
  },
  content: ['./src/**/*.{js,jsx,ts,tsx}', './{docs,blog}/**/*.{md,mdx}'], // my markdown stuff is in ../docs, not /src
  darkMode: ['class', '[data-theme="dark"]'], // hooks into docusaurus' dark mode settings
  theme: {
    extend: {
      colors: {
        // Light Theme
        'immich-primary': '#4250af',

        // Dark Theme
        'immich-dark-primary': '#adcbfa',
      },
    },
  },
  plugins: [],
};

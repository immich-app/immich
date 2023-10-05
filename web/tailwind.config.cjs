/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light Theme
        'immich-primary': '#4250af',
        'immich-bg': 'white',
        'immich-fg': 'black',
        'immich-gray': '#F6F6F4',
        'immich-error': '#e57373',
        'immich-success': '#81c784',
        'immich-warning': '#ffb74d',

        // Dark Theme
        'immich-dark-primary': '#adcbfa',
        'immich-dark-bg': 'black',
        'immich-dark-fg': '#e5e7eb',
        'immich-dark-gray': '#212121',
        'immich-dark-error': '#d32f2f',
        'immich-dark-success': '#388e3c',
        'immich-dark-warning': '#f57c00',
      },
      fontFamily: {
        'immich-title': ['Snowburst One', 'cursive'],
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
};

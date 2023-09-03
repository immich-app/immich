/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'],
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

        // flowbite-svelte
        primary: {
          50: '#FFF5F2',
          100: '#FFF1EE',
          200: '#FFE4DE',
          300: '#FFD5CC',
          400: '#FFBCAD',
          500: '#FE795D',
          600: '#EF562F',
          700: '#EB4F27',
          800: '#CC4522',
          900: '#A5371B',
        },
      },
      fontFamily: {
        'immich-title': ['Snowburst One', 'cursive'],
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
  plugins: [require('flowbite/plugin')],
};

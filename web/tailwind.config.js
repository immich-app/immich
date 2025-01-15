import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './node_modules/@immich/ui/dist/**/*.{svelte,js}',
    '../../ui/src/**/*.{html,js,svelte,ts}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light Theme
        'immich-primary': 'rgb(var(--immich-primary) / <alpha-value>)',
        'immich-bg': 'rgb(var(--immich-bg) / <alpha-value>)',
        'immich-fg': 'rgb(var(--immich-fg) / <alpha-value>)',
        'immich-gray': 'rgb(var(--immich-gray) / <alpha-value>)',
        'immich-error': 'rgb(var(--immich-error) / <alpha-value>)',
        'immich-success': 'rgb(var(--immich-success) / <alpha-value>)',
        'immich-warning': 'rgb(var(--immich-warning) / <alpha-value>)',

        // Dark Theme
        'immich-dark-primary': 'rgb(var(--immich-dark-primary) / <alpha-value>)',
        'immich-dark-bg': 'rgb(var(--immich-dark-bg) / <alpha-value>)',
        'immich-dark-fg': 'rgb(var(--immich-dark-fg) / <alpha-value>)',
        'immich-dark-gray': 'rgb(var(--immich-dark-gray) / <alpha-value>)',
        'immich-dark-error': 'rgb(var(--immich-dark-error) / <alpha-value>)',
        'immich-dark-success': 'rgb(var(--immich-dark-success) / <alpha-value>)',
        'immich-dark-warning': 'rgb(var(--immich-dark-warning) / <alpha-value>)',

        primary: 'rgb(var(--immich-ui-primary) / <alpha-value>)',
        light: 'rgb(var(--immich-ui-light) / <alpha-value>)',
        dark: 'rgb(var(--immich-ui-dark) / <alpha-value>)',
        success: 'rgb(var(--immich-ui-success) / <alpha-value>)',
        danger: 'rgb(var(--immich-ui-danger) / <alpha-value>)',
        warning: 'rgb(var(--immich-ui-warning) / <alpha-value>)',
        info: 'rgb(var(--immich-ui-info) / <alpha-value>)',
        subtle: 'rgb(var(--immich-gray) / <alpha-value>)',
      },
      borderColor: ({ theme }) => ({
        ...theme('colors'),
        DEFAULT: 'rgb(var(--immich-ui-default-border) / <alpha-value>)',
      }),
      fontFamily: {
        'immich-mono': ['Overpass Mono', 'monospace'],
      },
      spacing: {
        18: '4.5rem',
      },
      screens: {
        tall: { raw: '(min-height: 800px)' },
      },
    },
  },
  plugins: [
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          'grid-auto-fit': (value) => ({
            gridTemplateColumns: `repeat(auto-fit, minmax(min(${value}, 100%), 1fr))`,
          }),
          'grid-auto-fill': (value) => ({
            gridTemplateColumns: `repeat(auto-fill, minmax(min(${value}, 100%), 1fr))`,
          }),
        },
        { values: theme('width') },
      );
    }),
  ],
};

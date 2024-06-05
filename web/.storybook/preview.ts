import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview } from '@storybook/svelte';
import '../src/app.css';

export const decorators = [
  withThemeByClassName({
    themes: {
      light: 'light',
      dark: 'dark',
    },
    defaultTheme: 'light',
  }),
];

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: {
        '639': {
          name: 'mobile',
          styles: {
            width: '639px',
            height: '100%',
          },
        },
        '640': {
          name: 'sm',
          styles: {
            width: '640px',
            height: '100%',
          },
        },
        '768': {
          name: 'md',
          styles: {
            width: '768px',
            height: '100%',
          },
        },
        '1024': {
          name: 'lg',
          styles: {
            width: '1024px',
            height: '100%',
          },
        },
        '1280': {
          name: 'xl',
          styles: {
            width: '1280px',
            height: '100%',
          },
        },
        '1536': {
          name: '2xl',
          styles: {
            width: '1536px',
            height: '100%',
          },
        },
      },
    },
  },
};

export default preview;

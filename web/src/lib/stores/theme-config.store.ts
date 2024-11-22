import { getTheme, type ServerConfigDto, type ServerFeaturesDto, type ServerThemeDto } from '@immich/sdk';
import { writable } from 'svelte/store';

export type ThemeConfig = ServerThemeDto & { loaded: boolean };

export const themeConfig = writable<ThemeConfig>({
  loaded: false,
  customCss: '',
  themes: {
    light: { primary: '', bg: '', fg: '', gray: '', error: '', warning: '', success: '' },
    dark: {
      primary: '',
      bg: '',
      fg: '',
      gray: '',
      error: '',
      warning: '',
      success: '',
    },
  },
});

export const retrieveThemeConfig = async () => {
  const [theme] = await Promise.all([getTheme()]);
  themeConfig.update(() => ({ ...theme, loaded: true }));
};

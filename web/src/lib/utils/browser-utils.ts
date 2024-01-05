import { Theme } from '$lib/constants';
import { colorTheme } from '$lib/stores/preferences.store';
import { get, writable } from 'svelte/store';

// default theme is dark mode (see app.html)
export const getCurrentTheme = (defaultTheme: Theme = Theme.DARK): Theme.DARK | Theme.LIGHT => {
  const currentTheme = get(colorTheme);

  if (currentTheme === Theme.SYSTEM) {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
  }

  return currentTheme || defaultTheme;
};

export const hasThemeChanged = writable<boolean>(false);

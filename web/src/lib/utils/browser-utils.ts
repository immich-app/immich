import { Theme } from '$lib/constants';
import { colorTheme } from '$lib/stores/preferences.store';
import { get, writable } from 'svelte/store';
/*
 *
 * The color-theme store value can be 'light', 'dark' or 'system' but the Immich theme can only be 'light' or 'dark'.
 * The goal of this method is to get the store value, if the value is set to system, use the browser theme.
 *
 */
export const getCurrentTheme = (): Theme.DARK | Theme.LIGHT => {
  const currentTheme = get(colorTheme);

  if (currentTheme === Theme.SYSTEM) {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
  }

  return currentTheme;
};

export const hasThemeChanged = writable<boolean>(false);

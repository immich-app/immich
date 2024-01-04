import { colorTheme } from '$lib/stores/preferences.store';
import { get, writable } from 'svelte/store';

// default theme is dark mode (see app.html)
export const getCurrentTheme = (defaultTheme: 'dark' | 'light' = 'dark'): 'dark' | 'light' => {
  const currentTheme = get(colorTheme);

  if (currentTheme === 'system') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return currentTheme || defaultTheme;
};

export const hasThemeChanged = writable<boolean>(false);

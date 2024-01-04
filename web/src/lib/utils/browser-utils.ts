import { colorTheme } from '$lib/stores/preferences.store';
import { get } from 'svelte/store';

// Default theme by default is the dark mode
export const getCurrentTheme = (defaultTheme: 'dark' | 'light'): 'dark' | 'light' => {
  const currentTheme = get(colorTheme);

  if (currentTheme === 'system') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return currentTheme || defaultTheme;
};

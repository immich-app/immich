import { Theme } from '$lib/constants';
import { colorTheme } from '$lib/stores/preferences.store';
import { get } from 'svelte/store';

export const handleToggleTheme = () => {
  const theme = get(colorTheme);
  theme.value = theme.value === Theme.DARK ? Theme.LIGHT : Theme.DARK;
  colorTheme.set(theme);
};

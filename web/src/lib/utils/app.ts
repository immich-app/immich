/*
 * we don't want to deal with imports so that import should be
 * replaced by the actual content of the file before fouc.ts is transpiled
 *
 */
import { colorThemeKeyName, Theme, type ThemeSetting } from '$lib/utils/theme';

const storedTheme = localStorage.getItem(colorThemeKeyName);
const theme: ThemeSetting = storedTheme ? JSON.parse(storedTheme) : { value: Theme.LIGHT, system: true };
const themeValue = theme.system && window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : theme.value;

document.documentElement.classList.toggle('dark', themeValue === Theme.DARK);

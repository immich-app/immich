// should be the same values as the one in perferences.store.ts
interface ThemeSetting {
  value: Theme;
  system: boolean;
}

// should be the same values as the ones in constants.ts
enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

// should be the same key as the one in preferences.store.ts
const storedTheme = localStorage.getItem('color-theme');
const theme: ThemeSetting = storedTheme ? JSON.parse(storedTheme) : { value: Theme.LIGHT, system: true };
const themeValue = theme.system && window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : theme.value;

document.documentElement.classList.toggle('dark', themeValue === Theme.DARK);

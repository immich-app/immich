export interface ThemeSetting {
  value: Theme;
  system: boolean;
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export const colorThemeKeyName = 'color-theme';

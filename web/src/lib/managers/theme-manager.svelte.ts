import { browser } from '$app/environment';
import { Theme } from '$lib/constants';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { PersistedLocalStorage } from '$lib/utils/persisted';
import { theme as uiTheme, type Theme as UiTheme } from '@immich/ui';

export interface ThemeSetting {
  value: Theme;
  system: boolean;
}

const getDefaultTheme = () => {
  if (!browser) {
    return Theme.DARK;
  }

  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
};

class ThemeManager {
  #theme = new PersistedLocalStorage<ThemeSetting>(
    'color-theme',
    { value: getDefaultTheme(), system: false },
    {
      valid: (value): value is ThemeSetting => {
        return Object.values(Theme).includes((value as ThemeSetting)?.value);
      },
    },
  );

  get theme() {
    return this.#theme.current;
  }

  value = $derived(this.theme.value);

  isDark = $derived(this.value === Theme.DARK);

  constructor() {
    eventManager.on('AppInit', () => this.#onAppInit());
  }

  setSystem(system: boolean) {
    this.#update(system ? 'system' : getDefaultTheme());
  }

  setTheme(theme: Theme) {
    this.#update(theme);
  }

  toggleTheme() {
    this.#update(this.value === Theme.DARK ? Theme.LIGHT : Theme.DARK);
  }

  #onAppInit() {
    globalThis.matchMedia('(prefers-color-scheme: dark)').addEventListener(
      'change',
      () => {
        if (this.theme.system) {
          this.#update('system');
        }
      },
      { passive: true },
    );
  }

  #update(value: Theme | 'system') {
    const theme: ThemeSetting =
      value === 'system' ? { system: true, value: getDefaultTheme() } : { system: false, value };

    document.documentElement.classList.toggle('dark', !(theme.value === Theme.LIGHT));

    this.#theme.current = theme;

    uiTheme.value = theme.value as unknown as UiTheme;

    eventManager.emit('ThemeChange', theme);
  }
}

export const themeManager = new ThemeManager();

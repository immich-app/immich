import { browser } from '$app/environment';
import { Theme } from '$lib/constants';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { PersistedLocalStorage } from '$lib/utils/persisted';

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
    eventManager.on('app.init', () => this.#onAppInit());
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
    globalThis.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.theme.system) {
        this.#update('system');
      }
    });
  }

  #update(value: Theme | 'system') {
    const theme: ThemeSetting =
      value === 'system' ? { system: true, value: getDefaultTheme() } : { system: false, value };

    if (theme.value === Theme.LIGHT) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    this.#theme.current = theme;

    eventManager.emit('theme.change', theme);
  }
}

export const themeManager = new ThemeManager();

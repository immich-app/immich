import { browser } from '$app/environment';
import { Theme } from '$lib/constants';
import { persisted } from 'svelte-local-storage-store';
import { get } from 'svelte/store';

export interface ThemeSetting {
  value: Theme;
  system: boolean;
}

export const handleToggleTheme = () => {
  const theme = get(colorTheme);
  theme.value = theme.value === Theme.DARK ? Theme.LIGHT : Theme.DARK;
  colorTheme.set(theme);
};

const initTheme = (): ThemeSetting => {
  if (browser && !window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return { value: Theme.LIGHT, system: false };
  }
  return { value: Theme.DARK, system: false };
};

const initialTheme = initTheme();

// The 'color-theme' key is also used by app.html to prevent FOUC on page load.
export const colorTheme = persisted<ThemeSetting>('color-theme', initialTheme, {
  serializer: {
    parse: (text: string): ThemeSetting => {
      const parsedText: ThemeSetting = JSON.parse(text);
      return Object.values(Theme).includes(parsedText.value) ? parsedText : initTheme();
    },
    stringify: (object) => JSON.stringify(object),
  },
});

// Locale to use for formatting dates, numbers, etc.
export const locale = persisted<string | undefined>('locale', undefined, {
  serializer: {
    parse: (text) => text,
    stringify: (object) => object ?? '',
  },
});

export interface MapSettings {
  allowDarkMode: boolean;
  includeArchived: boolean;
  onlyFavorites: boolean;
  relativeDate: string;
  dateAfter: string;
  dateBefore: string;
}

export const mapSettings = persisted<MapSettings>('map-settings', {
  allowDarkMode: true,
  includeArchived: false,
  onlyFavorites: false,
  relativeDate: '',
  dateAfter: '',
  dateBefore: '',
});

export const videoViewerVolume = persisted<number>('video-viewer-volume', 1, {});

export const isShowDetail = persisted<boolean>('info-opened', false, {});

export interface AlbumViewSettings {
  sortBy: string;
  sortDesc: boolean;
  view: string;
}

export interface SidebarSettings {
  people: boolean;
  sharing: boolean;
}

export const sidebarSettings = persisted<SidebarSettings>('sidebar-settings-1', {
  people: false,
  sharing: true,
});

export enum AlbumViewMode {
  Cover = 'Cover',
  List = 'List',
}

export const albumViewSettings = persisted<AlbumViewSettings>('album-view-settings', {
  sortBy: 'Most recent photo',
  sortDesc: true,
  view: AlbumViewMode.Cover,
});

export const showDeleteModal = persisted<boolean>('delete-confirm-dialog', true, {});

import { browser } from '$app/environment';
import { persisted } from 'svelte-local-storage-store';

const initialTheme = browser && !window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';

// The 'color-theme' key is also used by app.html to prevent FOUC on page load.
export const colorTheme = persisted<'dark' | 'light'>('color-theme', initialTheme, {
  serializer: {
    parse: (text) => (text === 'light' ? text : 'dark'),
    stringify: (obj) => obj,
  },
});

// Locale to use for formatting dates, numbers, etc.
export const locale = persisted<string | undefined>('locale', undefined, {
  serializer: {
    parse: (text) => text,
    stringify: (obj) => obj ?? '',
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

import { browser } from '$app/environment';
import { Theme, defaultLang } from '$lib/constants';
import { getPreferredLocale } from '$lib/utils/i18n';
import { persisted } from 'svelte-persisted-store';

export interface ThemeSetting {
  value: Theme;
  system: boolean;
}

// Locale to use for formatting dates, numbers, etc.
export const locale = persisted<string | undefined>('locale', undefined, {
  serializer: {
    parse: (text) => (text == '' ? 'en-US' : text),
    stringify: (object) => object ?? '',
  },
});

const preferredLocale = browser ? getPreferredLocale() : undefined;
export const lang = persisted<string>('lang', preferredLocale || defaultLang.code, {
  serializer: {
    parse: (text) => text,
    stringify: (object) => object ?? '',
  },
});

export interface MapSettings {
  allowDarkMode: boolean;
  includeArchived: boolean;
  onlyFavorites: boolean;
  withPartners: boolean;
  withSharedAlbums: boolean;
  relativeDate: string;
  dateAfter: string;
  dateBefore: string;
}

const defaultMapSettings = {
  allowDarkMode: true,
  includeArchived: false,
  onlyFavorites: false,
  withPartners: false,
  withSharedAlbums: false,
  relativeDate: '',
  dateAfter: '',
  dateBefore: '',
};

const persistedObject = <T>(key: string, defaults: T) =>
  persisted<T>(key, defaults, {
    serializer: {
      parse: (text) => ({ ...defaultMapSettings, ...JSON.parse(text ?? null) }),
      stringify: JSON.stringify,
    },
  });

export const mapSettings = persistedObject<MapSettings>('map-settings', defaultMapSettings);

export const videoViewerVolume = persisted<number>('video-viewer-volume', 1, {});
export const videoViewerMuted = persisted<boolean>('video-viewer-muted', false, {});

export const isShowDetail = persisted<boolean>('info-opened', false, {});

export interface AlbumViewSettings {
  view: string;
  filter: string;
  groupBy: string;
  groupOrder: string;
  sortBy: string;
  sortOrder: string;
  collapsedGroups: {
    // Grouping Option => Array<Group ID>
    [group: string]: string[];
  };
}

export interface PlacesViewSettings {
  groupBy: string;
  collapsedGroups: {
    // Grouping Option => Array<Group ID>
    [group: string]: string[];
  };
}

export interface SidebarSettings {
  people: boolean;
  sharing: boolean;
}

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export enum AlbumViewMode {
  Cover = 'Cover',
  List = 'List',
}

export enum AlbumFilter {
  All = 'All',
  Owned = 'Owned',
  Shared = 'Shared',
}

export enum AlbumGroupBy {
  None = 'None',
  Year = 'Year',
  Owner = 'Owner',
}

export enum AlbumSortBy {
  Title = 'Title',
  ItemCount = 'ItemCount',
  DateModified = 'DateModified',
  DateCreated = 'DateCreated',
  MostRecentPhoto = 'MostRecentPhoto',
  OldestPhoto = 'OldestPhoto',
}

export const albumViewSettings = persisted<AlbumViewSettings>('album-view-settings', {
  view: AlbumViewMode.Cover,
  filter: AlbumFilter.All,
  groupBy: AlbumGroupBy.Year,
  groupOrder: SortOrder.Desc,
  sortBy: AlbumSortBy.MostRecentPhoto,
  sortOrder: SortOrder.Desc,
  collapsedGroups: {},
});

export enum PlacesGroupBy {
  None = 'None',
  Country = 'Country',
}

export const placesViewSettings = persisted<PlacesViewSettings>('places-view-settings', {
  groupBy: PlacesGroupBy.None,
  collapsedGroups: {},
});

export const showDeleteModal = persisted<boolean>('delete-confirm-dialog', true, {});

export const alwaysLoadOriginalFile = persisted<boolean>('always-load-original-file', false, {});

export const playVideoThumbnailOnHover = persisted<boolean>('play-video-thumbnail-on-hover', true, {});

export const loopVideo = persisted<boolean>('loop-video', true, {});

export const recentAlbumsDropdown = persisted<boolean>('recent-albums-open', true, {});

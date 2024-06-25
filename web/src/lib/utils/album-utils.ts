import { goto } from '$app/navigation';
import { AppRoute } from '$lib/constants';
import {
  AlbumFilter,
  AlbumGroupBy,
  AlbumSortBy,
  SortOrder,
  albumViewSettings,
  type AlbumViewSettings,
} from '$lib/stores/preferences.store';
import { handleError } from '$lib/utils/handle-error';
import type { AlbumResponseDto } from '@immich/sdk';
import * as sdk from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';

/**
 * -------------------------
 * Albums General Management
 * -------------------------
 */
export const createAlbum = async (name?: string, assetIds?: string[]) => {
  try {
    const newAlbum: AlbumResponseDto = await sdk.createAlbum({
      createAlbumDto: {
        albumName: name ?? '',
        assetIds,
      },
    });
    return newAlbum;
  } catch (error) {
    const $t = get(t);
    handleError(error, $t('errors.failed_to_create_album'));
  }
};

export const createAlbumAndRedirect = async (name?: string, assetIds?: string[]) => {
  const newAlbum = await createAlbum(name, assetIds);
  if (newAlbum) {
    await goto(`${AppRoute.ALBUMS}/${newAlbum.id}`);
  }
};

/**
 * -------------
 * Album Sorting
 * -------------
 */
export interface AlbumSortOptionMetadata {
  id: AlbumSortBy;
  defaultOrder: SortOrder;
  columnStyle: string;
}

export const sortOptionsMetadata: AlbumSortOptionMetadata[] = [
  {
    id: AlbumSortBy.Title,
    defaultOrder: SortOrder.Asc,
    columnStyle: 'text-left w-8/12 sm:w-4/12 md:w-4/12 md:w-4/12 xl:w-[30%] 2xl:w-[40%]',
  },
  {
    id: AlbumSortBy.ItemCount,
    defaultOrder: SortOrder.Desc,
    columnStyle: 'text-center w-4/12 m:w-2/12 md:w-2/12 xl:w-[15%] 2xl:w-[12%]',
  },
  {
    id: AlbumSortBy.DateModified,
    defaultOrder: SortOrder.Desc,
    columnStyle: 'text-center hidden sm:block w-3/12 xl:w-[15%] 2xl:w-[12%]',
  },
  {
    id: AlbumSortBy.DateCreated,
    defaultOrder: SortOrder.Desc,
    columnStyle: 'text-center hidden sm:block w-3/12 xl:w-[15%] 2xl:w-[12%]',
  },
  {
    id: AlbumSortBy.MostRecentPhoto,
    defaultOrder: SortOrder.Desc,
    columnStyle: 'text-center hidden xl:block xl:w-[15%] 2xl:w-[12%]',
  },
  {
    id: AlbumSortBy.OldestPhoto,
    defaultOrder: SortOrder.Desc,
    columnStyle: 'text-center hidden xl:block xl:w-[15%] 2xl:w-[12%]',
  },
];

export const findSortOptionMetadata = (sortBy: string) => {
  // Default is sort by most recent photo
  const defaultSortOption = sortOptionsMetadata[4];
  return sortOptionsMetadata.find(({ id }) => sortBy === id) ?? defaultSortOption;
};

export const findFilterOption = (filter: string) => {
  // Default is All filter
  const defaultFilterOption = AlbumFilter.All;
  return Object.values(AlbumFilter).find((key) => filter === AlbumFilter[key]) ?? defaultFilterOption;
};

/**
 * --------------
 * Album Grouping
 * --------------
 */
export interface AlbumGroup {
  id: string;
  name: string;
  albums: AlbumResponseDto[];
}

export interface AlbumGroupOptionMetadata {
  id: AlbumGroupBy;
  defaultOrder: SortOrder;
  isDisabled: () => boolean;
}

export const groupOptionsMetadata: AlbumGroupOptionMetadata[] = [
  {
    id: AlbumGroupBy.None,
    defaultOrder: SortOrder.Asc,
    isDisabled: () => false,
  },
  {
    id: AlbumGroupBy.Year,
    defaultOrder: SortOrder.Desc,
    isDisabled() {
      const disabledWithSortOptions: string[] = [AlbumSortBy.DateCreated, AlbumSortBy.DateModified];
      return disabledWithSortOptions.includes(get(albumViewSettings).sortBy);
    },
  },
  {
    id: AlbumGroupBy.Owner,
    defaultOrder: SortOrder.Asc,
    isDisabled: () => false,
  },
];

export const findGroupOptionMetadata = (groupBy: string) => {
  // Default is no grouping
  const defaultGroupOption = groupOptionsMetadata[0];
  return groupOptionsMetadata.find(({ id }) => groupBy === id) ?? defaultGroupOption;
};

export const getSelectedAlbumGroupOption = (settings: AlbumViewSettings) => {
  const defaultGroupOption = AlbumGroupBy.None;
  const albumGroupOption = settings.groupBy ?? defaultGroupOption;

  if (findGroupOptionMetadata(albumGroupOption).isDisabled()) {
    return defaultGroupOption;
  }
  return albumGroupOption;
};

/**
 * ----------------------------
 * Album Groups Collapse/Expand
 * ----------------------------
 */
const getCollapsedAlbumGroups = (settings: AlbumViewSettings) => {
  settings.collapsedGroups ??= {};
  const { collapsedGroups, groupBy } = settings;
  collapsedGroups[groupBy] ??= [];
  return collapsedGroups[groupBy];
};

export const isAlbumGroupCollapsed = (settings: AlbumViewSettings, groupId: string) => {
  if (settings.groupBy === AlbumGroupBy.None) {
    return false;
  }
  return getCollapsedAlbumGroups(settings).includes(groupId);
};

export const toggleAlbumGroupCollapsing = (groupId: string) => {
  const settings = get(albumViewSettings);
  if (settings.groupBy === AlbumGroupBy.None) {
    return;
  }
  const collapsedGroups = getCollapsedAlbumGroups(settings);
  const groupIndex = collapsedGroups.indexOf(groupId);
  if (groupIndex === -1) {
    // Collapse
    collapsedGroups.push(groupId);
  } else {
    // Expand
    collapsedGroups.splice(groupIndex, 1);
  }
  albumViewSettings.set(settings);
};

export const collapseAllAlbumGroups = (groupIds: string[]) => {
  albumViewSettings.update((settings) => {
    const collapsedGroups = getCollapsedAlbumGroups(settings);
    collapsedGroups.length = 0;
    collapsedGroups.push(...groupIds);
    return settings;
  });
};

export const expandAllAlbumGroups = () => {
  collapseAllAlbumGroups([]);
};

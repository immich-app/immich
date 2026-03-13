import { SortOrder } from '$lib/stores/preferences.store';
import type { Translations } from 'svelte-i18n';
import { persisted } from 'svelte-persisted-store';

export enum SpaceSortBy {
  Name = 'Name',
  LastActivity = 'LastActivity',
  DateCreated = 'DateCreated',
  AssetCount = 'AssetCount',
}

export type SpaceViewMode = 'card' | 'list';

export interface SpaceViewSettings {
  sortBy: string;
  sortOrder: string;
  viewMode: SpaceViewMode;
}

export const pinnedSpaceIds = persisted<string[]>('pinned-space-ids', []);

export const spaceViewSettings = persisted<SpaceViewSettings>('space-view-settings', {
  sortBy: SpaceSortBy.LastActivity,
  sortOrder: SortOrder.Desc,
  viewMode: 'card',
});

export interface SpaceSortOptionMetadata {
  id: SpaceSortBy;
  label: Translations;
  defaultOrder: SortOrder;
}

export const sortOptionsMetadata: SpaceSortOptionMetadata[] = [
  { id: SpaceSortBy.Name, label: 'name', defaultOrder: SortOrder.Asc },
  { id: SpaceSortBy.LastActivity, label: 'last_activity', defaultOrder: SortOrder.Desc },
  { id: SpaceSortBy.DateCreated, label: 'date_created', defaultOrder: SortOrder.Desc },
  { id: SpaceSortBy.AssetCount, label: 'asset_count', defaultOrder: SortOrder.Desc },
];

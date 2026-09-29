import { type AssetResponseDto } from '@immich/sdk';
import { get } from 'svelte/store';
import { PlacesGroupBy, placesViewSettings, type PlacesViewSettings } from '$lib/stores/preferences.store';

/**
 * --------------
 * Places Grouping
 * --------------
 */
export interface PlacesGroup {
  id: string;
  name: string;
  places: AssetResponseDto[];
}

/**
 * ----------------------------
 * Places Groups Collapse/Expand
 * ----------------------------
 */
const getCollapsedPlacesGroups = (settings: PlacesViewSettings) => {
  settings.collapsedGroups ??= {};
  const { collapsedGroups, groupBy } = settings;
  collapsedGroups[groupBy] ??= [];
  return collapsedGroups[groupBy];
};

export const isPlacesGroupCollapsed = (settings: PlacesViewSettings, groupId: string) => {
  if (settings.groupBy === PlacesGroupBy.None) {
    return false;
  }
  return getCollapsedPlacesGroups(settings).includes(groupId);
};

export const togglePlacesGroupCollapsing = (groupId: string) => {
  const settings = get(placesViewSettings);
  if (settings.groupBy === PlacesGroupBy.None) {
    return;
  }
  const collapsedGroups = getCollapsedPlacesGroups(settings);
  const groupIndex = collapsedGroups.indexOf(groupId);
  if (groupIndex === -1) {
    // Collapse
    collapsedGroups.push(groupId);
  } else {
    // Expand
    collapsedGroups.splice(groupIndex, 1);
  }
  placesViewSettings.set(settings);
};

export const collapseAllPlacesGroups = (groupIds: string[]) => {
  placesViewSettings.update((settings) => {
    const collapsedGroups = getCollapsedPlacesGroups(settings);
    collapsedGroups.length = 0;
    collapsedGroups.push(...groupIds);
    return settings;
  });
};

export const expandAllPlacesGroups = () => {
  collapseAllPlacesGroups([]);
};

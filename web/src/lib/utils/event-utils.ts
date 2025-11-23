import {
  EventGroupBy,
  EventSortBy,
  eventViewSettings,
  SortOrder,
  type EventViewSettings,
} from '$lib/stores/preferences.store';
import type { EventResponseDto } from '@immich/sdk';
import { groupBy as lodashGroupBy } from 'lodash-es';
import { locale, t } from 'svelte-i18n';
import { get, get as getTranslation } from 'svelte/store';

/**
 * --------------
 * Event Grouping
 * --------------
 */
export interface EventGroup {
  id: string;
  name: string;
  events: EventResponseDto[];
}

export interface EventGroupOptionMetadata {
  id: EventGroupBy;
  defaultOrder: SortOrder;
  isDisabled: () => boolean;
}

export const groupOptionsMetadata: EventGroupOptionMetadata[] = [
  {
    id: EventGroupBy.None,
    defaultOrder: SortOrder.Asc,
    isDisabled: () => false,
  },
  {
    id: EventGroupBy.Year,
    defaultOrder: SortOrder.Desc,
    isDisabled: () => false,
  },
];

export const findGroupOptionMetadata = (groupBy: string) => {
  const defaultGroupOption = groupOptionsMetadata[0];
  return groupOptionsMetadata.find(({ id }) => groupBy === id) ?? defaultGroupOption;
};

export const getSelectedEventGroupOption = (settings: EventViewSettings) => {
  const defaultGroupOption = EventGroupBy.None;
  const eventGroupOption = settings.groupBy ?? defaultGroupOption;

  if (findGroupOptionMetadata(eventGroupOption).isDisabled()) {
    return defaultGroupOption;
  }
  return eventGroupOption;
};

/**
 * ----------------------------
 * Event Groups Collapse/Expand
 * ----------------------------
 */
const getCollapsedEventGroups = (settings: EventViewSettings) => {
  settings.collapsedGroups ??= {};
  const { collapsedGroups, groupBy } = settings;
  collapsedGroups[groupBy] ??= [];
  return collapsedGroups[groupBy];
};

export const isEventGroupCollapsed = (settings: EventViewSettings, groupId: string) => {
  if (settings.groupBy === EventGroupBy.None) {
    return false;
  }
  return getCollapsedEventGroups(settings).includes(groupId);
};

export const toggleEventGroupCollapsing = (groupId: string) => {
  const settings = get(eventViewSettings);
  if (settings.groupBy === EventGroupBy.None) {
    return;
  }
  const collapsedGroups = getCollapsedEventGroups(settings);
  const groupIndex = collapsedGroups.indexOf(groupId);
  if (groupIndex === -1) {
    // Collapse
    collapsedGroups.push(groupId);
  } else {
    // Expand
    collapsedGroups.splice(groupIndex, 1);
  }
  eventViewSettings.set(settings);
};

export const collapseAllEventGroups = (groupIds: string[]) => {
  eventViewSettings.update((settings) => {
    if (settings.groupBy === EventGroupBy.None) {
      return settings;
    }
    const collapsedGroups = getCollapsedEventGroups(settings);
    for (const groupId of groupIds) {
      if (!collapsedGroups.includes(groupId)) {
        collapsedGroups.push(groupId);
      }
    }
    return settings;
  });
};

export const expandAllEventGroups = () => {
  eventViewSettings.update((settings) => {
    if (settings.groupBy === EventGroupBy.None) {
      return settings;
    }
    const { collapsedGroups, groupBy } = settings;
    collapsedGroups[groupBy] = [];
    return settings;
  });
};

/**
 * --------------
 * Event Sorting
 * --------------
 */
export interface EventSortOptionMetadata {
  id: EventSortBy;
  defaultOrder: SortOrder;
}

export const sortOptionsMetadata: EventSortOptionMetadata[] = [
  {
    id: EventSortBy.Name,
    defaultOrder: SortOrder.Asc,
  },
  {
    id: EventSortBy.AlbumCount,
    defaultOrder: SortOrder.Desc,
  },
  {
    id: EventSortBy.DateCreated,
    defaultOrder: SortOrder.Desc,
  },
  {
    id: EventSortBy.DateModified,
    defaultOrder: SortOrder.Desc,
  },
];

export const findSortOptionMetadata = (sortBy: string) => {
  const defaultSortOption = sortOptionsMetadata[0];
  return sortOptionsMetadata.find(({ id }) => sortBy === id) ?? defaultSortOption;
};

export const stringToSortOrder = (sortOrder: string) => {
  return sortOrder === SortOrder.Desc ? SortOrder.Desc : SortOrder.Asc;
};

export const sortEvents = (
  events: EventResponseDto[],
  { sortBy, sortOrder: orderBy }: { sortBy: string; sortOrder: string },
): EventResponseDto[] => {
  const sortOrder = stringToSortOrder(orderBy);
  const sortSign = sortOrder === SortOrder.Desc ? -1 : 1;
  const localeString = get(locale) || 'en';

  const sorted = [...events].sort((a, b) => {
    switch (sortBy) {
      case EventSortBy.Name: {
        return a.eventName.localeCompare(b.eventName, localeString) * sortSign;
      }
      case EventSortBy.AlbumCount: {
        return ((a.albumCount ?? 0) - (b.albumCount ?? 0)) * sortSign;
      }
      case EventSortBy.DateCreated: {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sortSign;
      }
      case EventSortBy.DateModified: {
        const aDate = a.updatedAt || a.createdAt;
        const bDate = b.updatedAt || b.createdAt;
        return (new Date(aDate).getTime() - new Date(bDate).getTime()) * sortSign;
      }
      default: {
        return 0;
      }
    }
  });

  return sorted;
};

/**
 * --------------
 * Event Grouping Functions
 * --------------
 */
interface EventGroupOption {
  [option: string]: (order: SortOrder, events: EventResponseDto[]) => EventGroup[];
}

export const groupEvents = (
  events: EventResponseDto[],
  settings: { groupBy: EventGroupBy; groupOrder: SortOrder },
): EventGroup[] => {
  const groupBy = settings.groupBy;
  const order = stringToSortOrder(settings.groupOrder);
  const tValue = getTranslation(t);

  const groupOptions: EventGroupOption = {
    [EventGroupBy.None]: (order, events): EventGroup[] => {
      return [
        {
          id: tValue('events'),
          name: tValue('events'),
          events,
        },
      ];
    },

    [EventGroupBy.Year]: (order, events): EventGroup[] => {
      const unknownYear = tValue('unknown_year');

      const groupedByYear = lodashGroupBy(events, (event) => {
        const date = event.createdAt;
        return date ? new Date(date).getFullYear() : unknownYear;
      });

      const sortSign = order === SortOrder.Desc ? -1 : 1;
      const sortedByYear = Object.entries(groupedByYear).sort(([a], [b]) => {
        if (a === unknownYear) {
          return 1;
        } else if (b === unknownYear) {
          return -1;
        } else {
          return (Number.parseInt(a) - Number.parseInt(b)) * sortSign;
        }
      });

      return sortedByYear.map(([year, events]) => ({
        id: year,
        name: year,
        events,
      }));
    },
  };

  const groupFunc = groupOptions[groupBy] ?? groupOptions[EventGroupBy.None];
  return groupFunc(order, events);
};

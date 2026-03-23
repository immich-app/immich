export type FilterSection = 'timeline' | 'people' | 'location' | 'camera' | 'tags' | 'rating' | 'media';

export interface PersonOption {
  id: string;
  name: string;
  thumbnailPath?: string;
}

export interface LocationOption {
  value: string;
  type: 'country' | 'city';
}

export interface CameraOption {
  value: string;
  type: 'make' | 'model';
}

export interface TagOption {
  id: string;
  name: string;
}

export interface FilterPanelConfig {
  sections: FilterSection[];
  providers: {
    people?: () => Promise<PersonOption[]>;
    locations?: () => Promise<LocationOption[]>;
    cameras?: () => Promise<CameraOption[]>;
    tags?: () => Promise<TagOption[]>;
  };
}

export interface FilterState {
  personIds: string[];
  city?: string;
  country?: string;
  make?: string;
  model?: string;
  tagIds: string[];
  rating?: number;
  mediaType: 'all' | 'image' | 'video';
  sortOrder: 'asc' | 'desc';
  selectedYear?: number;
  selectedMonth?: number;
}

// Client-only view state (not sent to server)
export interface FilterViewState {
  collapsed: boolean;
}

export function createFilterState(): FilterState {
  return {
    personIds: [],
    tagIds: [],
    mediaType: 'all',
    sortOrder: 'desc',
  };
}

export function getActiveFilterCount(state: FilterState): number {
  return (
    (state.personIds.length > 0 ? 1 : 0) +
    (state.city ? 1 : 0) +
    (state.country && !state.city ? 1 : 0) +
    (state.make ? 1 : 0) +
    (state.tagIds.length > 0 ? 1 : 0) +
    (state.rating === undefined ? 0 : 1) +
    (state.mediaType === 'all' ? 0 : 1)
  );
}

export function clearFilters(state: FilterState): FilterState {
  return {
    ...state,
    personIds: [],
    city: undefined,
    country: undefined,
    make: undefined,
    model: undefined,
    tagIds: [],
    rating: undefined,
    mediaType: 'all',
    selectedYear: undefined,
    selectedMonth: undefined,
    // sortOrder is NOT cleared — it's a view preference
  };
}

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
    people?: (context?: FilterContext) => Promise<PersonOption[]>;
    locations?: (context?: FilterContext) => Promise<LocationOption[]>;
    cities?: (country: string, context?: FilterContext) => Promise<string[]>;
    cameras?: (context?: FilterContext) => Promise<CameraOption[]>;
    cameraModels?: (make: string, context?: FilterContext) => Promise<string[]>;
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
    (state.mediaType === 'all' ? 0 : 1) +
    (state.selectedYear === undefined ? 0 : 1)
  );
}

export type FilterContext = {
  takenAfter?: string;
  takenBefore?: string;
};

export function buildFilterContext(state: FilterState): FilterContext | undefined {
  if (!state.selectedYear) {
    return undefined;
  }
  if (state.selectedMonth) {
    return {
      takenAfter: new Date(Date.UTC(state.selectedYear, state.selectedMonth - 1, 1)).toISOString(),
      takenBefore: new Date(Date.UTC(state.selectedYear, state.selectedMonth, 1)).toISOString(),
    };
  }
  return {
    takenAfter: new Date(Date.UTC(state.selectedYear, 0, 1)).toISOString(),
    takenBefore: new Date(Date.UTC(state.selectedYear + 1, 0, 1)).toISOString(),
  };
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

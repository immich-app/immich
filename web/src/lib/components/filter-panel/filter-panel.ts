export type FilterSection = 'timeline' | 'people' | 'location' | 'camera' | 'tags' | 'rating' | 'media' | 'favorites';

export interface PersonOption {
  id: string;
  name: string;
  thumbnailUrl?: string;
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

export interface FilterSuggestionsResponse {
  countries: string[];
  cameraMakes: string[];
  tags: TagOption[];
  people: PersonOption[];
  ratings: number[];
  mediaTypes: string[];
  hasUnnamedPeople: boolean;
}

export interface FilterPanelConfig {
  sections: FilterSection[];
  suggestionsProvider?: (filters: FilterState) => Promise<FilterSuggestionsResponse>;
  providers?: {
    people?: (context?: FilterContext) => Promise<PersonOption[]>;
    allPeople?: () => Promise<PersonOption[]>;
    locations?: (context?: FilterContext) => Promise<LocationOption[]>;
    cities?: (country: string, context?: FilterContext) => Promise<string[]>;
    cameras?: (context?: FilterContext) => Promise<CameraOption[]>;
    cameraModels?: (make: string, context?: FilterContext) => Promise<string[]>;
    tags?: (context?: FilterContext) => Promise<TagOption[]>;
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
  isFavorite?: boolean;
  sortOrder: 'asc' | 'desc' | 'relevance';
  selectedYear?: number;
  selectedMonth?: number;
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
    (state.isFavorite === undefined ? 0 : 1) +
    (state.selectedYear === undefined ? 0 : 1)
  );
}

export type FilterContext = {
  takenAfter?: string;
  takenBefore?: string;
  personIds?: string[];
  tagIds?: string[];
  rating?: number;
  isFavorite?: boolean;
};

export function buildFilterContext(
  state: FilterState,
  exclude: Array<keyof FilterState> = [],
): FilterContext | undefined {
  const context: FilterContext = {};
  const includes = (key: keyof FilterState) => !exclude.includes(key);

  if (includes('personIds') && state.personIds?.length > 0) {
    context.personIds = state.personIds;
  }

  if (includes('tagIds') && state.tagIds?.length > 0) {
    context.tagIds = state.tagIds;
  }

  if (includes('rating') && state.rating !== undefined) {
    context.rating = state.rating;
  }

  if (includes('isFavorite') && state.isFavorite !== undefined) {
    context.isFavorite = state.isFavorite;
  }

  if (state.selectedYear && includes('selectedYear')) {
    if (state.selectedMonth && includes('selectedMonth')) {
      context.takenAfter = new Date(Date.UTC(state.selectedYear, state.selectedMonth - 1, 1)).toISOString();
      context.takenBefore = new Date(Date.UTC(state.selectedYear, state.selectedMonth, 1)).toISOString();
    } else {
      context.takenAfter = new Date(Date.UTC(state.selectedYear, 0, 1)).toISOString();
      context.takenBefore = new Date(Date.UTC(state.selectedYear + 1, 0, 1)).toISOString();
    }
  }

  return Object.keys(context).length > 0 ? context : undefined;
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
    isFavorite: undefined,
    selectedYear: undefined,
    selectedMonth: undefined,
    // sortOrder is NOT cleared — it's a view preference
  };
}

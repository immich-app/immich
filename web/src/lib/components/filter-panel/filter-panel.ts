export type FilterSection =
  | 'timeline'
  | 'people'
  | 'location'
  | 'camera'
  | 'tags'
  | 'rating'
  | 'media'
  | 'favorites'
  | 'albums';

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
  cities?: string[];
  cameraMakes: string[];
  cameraModels?: string[];
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
  isNotInAlbum?: boolean;
  sortOrder: 'asc' | 'desc' | 'relevance';
  dateAfter?: string;
  dateBefore?: string;
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
  const hasTemporalFilter =
    hasDateValue(state.dateAfter) || hasDateValue(state.dateBefore) || state.selectedYear !== undefined;

  return (
    (state.personIds.length > 0 ? 1 : 0) +
    (state.city ? 1 : 0) +
    (state.country && !state.city ? 1 : 0) +
    (state.make ? 1 : 0) +
    (state.tagIds.length > 0 ? 1 : 0) +
    (state.rating === undefined ? 0 : 1) +
    (state.mediaType === 'all' ? 0 : 1) +
    (state.isFavorite === undefined ? 0 : 1) +
    (state.isNotInAlbum === true ? 1 : 0) +
    (hasTemporalFilter ? 1 : 0)
  );
}

export type FilterContext = {
  takenAfter?: string;
  takenBefore?: string;
  personIds?: string[];
  tagIds?: string[];
  rating?: number;
  isFavorite?: boolean;
  isNotInAlbum?: boolean;
};

function hasDateValue(value: string | undefined): value is string {
  return value !== undefined && value !== '';
}

function parseDateOnly(value: string | undefined): Date | undefined {
  if (!hasDateValue(value)) {
    return undefined;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return undefined;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return undefined;
  }

  return date;
}

function dateOnlyToUtcStart(value: string | undefined): string | undefined {
  return parseDateOnly(value)?.toISOString();
}

function dateOnlyToExclusiveUtcEnd(value: string | undefined): string | undefined {
  const date = parseDateOnly(value);
  if (!date) {
    return undefined;
  }

  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}

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

  if (includes('isNotInAlbum') && state.isNotInAlbum === true) {
    context.isNotInAlbum = true;
  }

  const validDateAfter = includes('dateAfter') ? dateOnlyToUtcStart(state.dateAfter) : undefined;
  const validDateBefore = includes('dateBefore') ? dateOnlyToExclusiveUtcEnd(state.dateBefore) : undefined;

  if (validDateAfter || validDateBefore) {
    if (validDateAfter) {
      context.takenAfter = validDateAfter;
    }
    if (validDateBefore) {
      context.takenBefore = validDateBefore;
    }
  } else if (state.selectedYear && includes('selectedYear')) {
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
    isNotInAlbum: undefined,
    dateAfter: undefined,
    dateBefore: undefined,
    selectedYear: undefined,
    selectedMonth: undefined,
    // sortOrder is NOT cleared — it's a view preference
  };
}

import type { FilterState } from '$lib/components/filter-panel/filter-panel';
import {
  buildSmartSearchFacetKey,
  buildSmartSearchFacetsParams,
  buildSmartSearchParams,
  mapSmartSearchFacetsToFilterSuggestions,
  SEARCH_FILTER_DEBOUNCE_MS,
} from '$lib/utils/space-search';
import { AssetOrder, AssetTypeEnum } from '@immich/sdk';
import { describe, expect, it } from 'vitest';

const baseFilters: FilterState = {
  personIds: [],
  tagIds: [],
  mediaType: 'all',
  sortOrder: 'desc',
};

describe('buildSmartSearchParams', () => {
  describe('with spaceId', () => {
    it('sets spaceId, maps personIds to spacePersonIds, ignores withSharedSpaces', () => {
      const result = buildSmartSearchParams({
        query: 'beach',
        filters: { ...baseFilters, personIds: ['p1', 'p2'] },
        spaceId: 'space-1',
        withSharedSpaces: true,
      });
      expect(result.spaceId).toBe('space-1');
      expect(result.spacePersonIds).toEqual(['p1', 'p2']);
      expect(result.personIds).toBeUndefined();
      expect(result.withSharedSpaces).toBeUndefined();
    });
  });

  describe('without spaceId', () => {
    it('omits spaceId, passes personIds directly, sets withSharedSpaces when truthy', () => {
      const result = buildSmartSearchParams({
        query: 'beach',
        filters: { ...baseFilters, personIds: ['p1'] },
        withSharedSpaces: true,
      });
      expect(result.spaceId).toBeUndefined();
      expect(result.personIds).toEqual(['p1']);
      expect(result.spacePersonIds).toBeUndefined();
      expect(result.withSharedSpaces).toBe(true);
    });

    it('omits withSharedSpaces when false', () => {
      const result = buildSmartSearchParams({
        query: 'beach',
        filters: baseFilters,
        withSharedSpaces: false,
      });
      expect(result.withSharedSpaces).toBeUndefined();
    });

    it('omits withSharedSpaces when undefined', () => {
      const result = buildSmartSearchParams({ query: 'beach', filters: baseFilters });
      expect(result.withSharedSpaces).toBeUndefined();
    });
  });

  describe('field mappings', () => {
    it('omits personIds and spacePersonIds when filters.personIds is empty', () => {
      const result = buildSmartSearchParams({ query: 'beach', filters: baseFilters });
      expect(result.personIds).toBeUndefined();
      expect(result.spacePersonIds).toBeUndefined();
    });

    it('sets language when provided', () => {
      const result = buildSmartSearchParams({ query: 'beach', filters: baseFilters, language: 'de' });
      expect(result.language).toBe('de');
    });

    it('sets type for mediaType image', () => {
      const result = buildSmartSearchParams({
        query: 'beach',
        filters: { ...baseFilters, mediaType: 'image' },
      });
      expect(result.type).toBe(AssetTypeEnum.Image);
    });

    it('sets type for mediaType video', () => {
      const result = buildSmartSearchParams({
        query: 'beach',
        filters: { ...baseFilters, mediaType: 'video' },
      });
      expect(result.type).toBe(AssetTypeEnum.Video);
    });

    it('omits type for mediaType all', () => {
      const result = buildSmartSearchParams({ query: 'beach', filters: baseFilters });
      expect(result.type).toBeUndefined();
    });

    it('sets order for sortOrder asc', () => {
      const result = buildSmartSearchParams({
        query: 'beach',
        filters: { ...baseFilters, sortOrder: 'asc' },
      });
      expect(result.order).toBe(AssetOrder.Asc);
    });

    it('sets order for sortOrder desc', () => {
      const result = buildSmartSearchParams({
        query: 'beach',
        filters: { ...baseFilters, sortOrder: 'desc' },
      });
      expect(result.order).toBe(AssetOrder.Desc);
    });

    it('omits order for sortOrder relevance', () => {
      const result = buildSmartSearchParams({
        query: 'beach',
        filters: { ...baseFilters, sortOrder: 'relevance' },
      });
      expect(result.order).toBeUndefined();
    });

    it('sets isFavorite when explicitly false', () => {
      const result = buildSmartSearchParams({
        query: 'beach',
        filters: { ...baseFilters, isFavorite: false },
      });
      expect(result.isFavorite).toBe(false);
    });

    it('sets isFavorite when true', () => {
      const result = buildSmartSearchParams({
        query: 'beach',
        filters: { ...baseFilters, isFavorite: true },
      });
      expect(result.isFavorite).toBe(true);
    });

    it('omits isFavorite when undefined', () => {
      const result = buildSmartSearchParams({ query: 'beach', filters: baseFilters });
      expect(result.isFavorite).toBeUndefined();
    });

    it('builds takenAfter/takenBefore for selectedYear + selectedMonth (January)', () => {
      const result = buildSmartSearchParams({
        query: 'beach',
        filters: { ...baseFilters, selectedYear: 2024, selectedMonth: 1 },
      });
      expect(result.takenAfter).toBe('2024-01-01T00:00:00.000Z');
      expect(result.takenBefore).toBe('2024-02-01T00:00:00.000Z');
    });

    it('builds takenAfter/takenBefore for selectedYear only', () => {
      const result = buildSmartSearchParams({
        query: 'beach',
        filters: { ...baseFilters, selectedYear: 2024 },
      });
      expect(result.takenAfter).toBe('2024-01-01T00:00:00.000Z');
      expect(result.takenBefore).toBe('2025-01-01T00:00:00.000Z');
    });

    it('builds takenAfter/takenBefore from custom dates', () => {
      const result = buildSmartSearchParams({
        query: 'beach',
        filters: { ...baseFilters, dateAfter: '2024-01-01', dateBefore: '2024-12-31' },
      });

      expect(result.takenAfter).toBe('2024-01-01T00:00:00.000Z');
      expect(result.takenBefore).toBe('2025-01-01T00:00:00.000Z');
    });

    it('prefers custom dates over selected year and month', () => {
      const result = buildSmartSearchParams({
        query: 'beach',
        filters: { ...baseFilters, selectedYear: 2023, selectedMonth: 8, dateAfter: '2024-01-01' },
      });

      expect(result.takenAfter).toBe('2024-01-01T00:00:00.000Z');
      expect(result.takenBefore).toBeUndefined();
    });
  });

  describe('compound cases', () => {
    it('handles all filters active simultaneously', () => {
      const result = buildSmartSearchParams({
        query: 'cherry blossoms',
        filters: {
          ...baseFilters,
          personIds: ['p-1'],
          city: 'Tokyo',
          country: 'Japan',
          make: 'Sony',
          model: 'A7IV',
          tagIds: ['t-1', 't-2'],
          rating: 5,
          mediaType: 'video',
          selectedYear: 2025,
          selectedMonth: 3,
          sortOrder: 'desc',
          isFavorite: true,
        },
        spaceId: 'space-1',
      });
      expect(result.query).toBe('cherry blossoms');
      expect(result.spaceId).toBe('space-1');
      expect(result.spacePersonIds).toEqual(['p-1']);
      expect(result.city).toBe('Tokyo');
      expect(result.country).toBe('Japan');
      expect(result.make).toBe('Sony');
      expect(result.model).toBe('A7IV');
      expect(result.tagIds).toEqual(['t-1', 't-2']);
      expect(result.rating).toBe(5);
      expect(result.type).toBe(AssetTypeEnum.Video);
      expect(result.takenAfter).toBeDefined();
      expect(result.takenBefore).toBeDefined();
      expect(result.order).toBe(AssetOrder.Desc);
      expect(result.isFavorite).toBe(true);
    });

    it('does not include empty string fields', () => {
      const result = buildSmartSearchParams({
        query: 'beach',
        filters: { ...baseFilters, city: '', country: '', make: '', model: '' },
        spaceId: 'space-1',
      });
      expect(result.city).toBeUndefined();
      expect(result.country).toBeUndefined();
      expect(result.make).toBeUndefined();
      expect(result.model).toBeUndefined();
    });
  });
});

describe('buildSmartSearchFacetsParams', () => {
  it('uses the same filters as smart search but strips sort order', () => {
    const result = buildSmartSearchFacetsParams({
      query: 'beach',
      filters: { ...baseFilters, sortOrder: 'asc', rating: 4, mediaType: 'image' },
      withSharedSpaces: true,
      language: 'de',
    });

    expect(result).toEqual({
      query: 'beach',
      withSharedSpaces: true,
      language: 'de',
      rating: 4,
      type: AssetTypeEnum.Image,
    });
    expect(result).not.toHaveProperty('order');
    expect(result).not.toHaveProperty('page');
    expect(result).not.toHaveProperty('size');
  });

  it('maps space people to spacePersonIds and omits withSharedSpaces for spaces', () => {
    const result = buildSmartSearchFacetsParams({
      query: 'beach',
      filters: { ...baseFilters, personIds: ['space-person-1'] },
      spaceId: 'space-1',
      withSharedSpaces: true,
    });

    expect(result).toMatchObject({ spaceId: 'space-1', spacePersonIds: ['space-person-1'] });
    expect(result.personIds).toBeUndefined();
    expect(result.withSharedSpaces).toBeUndefined();
  });

  it('uses the same key for sort-only changes', () => {
    const relevanceKey = buildSmartSearchFacetKey({
      query: 'beach',
      filters: { ...baseFilters, sortOrder: 'relevance' },
      withSharedSpaces: true,
    });
    const ascendingKey = buildSmartSearchFacetKey({
      query: 'beach',
      filters: { ...baseFilters, sortOrder: 'asc' },
      withSharedSpaces: true,
    });

    expect(ascendingKey).toBe(relevanceKey);
  });

  it('changes the key for facet-affecting filters', () => {
    const baseKey = buildSmartSearchFacetKey({ query: 'beach', filters: baseFilters, withSharedSpaces: true });
    const countryKey = buildSmartSearchFacetKey({
      query: 'beach',
      filters: { ...baseFilters, country: 'Germany' },
      withSharedSpaces: true,
    });

    expect(countryKey).not.toBe(baseKey);
  });

  it('changes the key when language changes', () => {
    const englishKey = buildSmartSearchFacetKey({
      query: 'beach',
      filters: baseFilters,
      withSharedSpaces: true,
      language: 'en',
    });
    const germanKey = buildSmartSearchFacetKey({
      query: 'beach',
      filters: baseFilters,
      withSharedSpaces: true,
      language: 'de',
    });

    expect(germanKey).not.toBe(englishKey);
  });
});

describe('mapSmartSearchFacetsToFilterSuggestions', () => {
  it('maps SDK facet response to FilterPanel suggestions and thumbnail URLs', () => {
    const result = mapSmartSearchFacetsToFilterSuggestions(
      {
        total: 2,
        timeBuckets: [{ timeBucket: '2024-01-01', count: 2 }],
        countries: ['Germany'],
        cities: ['Berlin'],
        cameraMakes: ['Sony'],
        cameraModels: ['A7'],
        tags: [{ id: 'tag-1', value: 'Travel' }],
        people: [{ id: 'person-1', name: 'Ada' }],
        ratings: [4],
        mediaTypes: [AssetTypeEnum.Image],
        hasUnnamedPeople: true,
      },
      { spaceId: 'space-1' },
    );

    expect(result).toEqual({
      countries: ['Germany'],
      cities: ['Berlin'],
      cameraMakes: ['Sony'],
      cameraModels: ['A7'],
      tags: [{ id: 'tag-1', name: 'Travel' }],
      people: [
        {
          id: 'person-1',
          name: 'Ada',
          thumbnailUrl: '/api/shared-spaces/space-1/people/person-1/thumbnail',
        },
      ],
      ratings: [4],
      mediaTypes: [AssetTypeEnum.Image],
      hasUnnamedPeople: true,
    });
  });
});

describe('SEARCH_FILTER_DEBOUNCE_MS', () => {
  it('is 250ms', () => {
    expect(SEARCH_FILTER_DEBOUNCE_MS).toBe(250);
  });
});

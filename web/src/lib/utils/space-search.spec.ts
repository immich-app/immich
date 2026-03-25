import { createFilterState } from '$lib/components/filter-panel/filter-panel';
import { buildSmartSearchParams, SEARCH_FILTER_DEBOUNCE_MS } from '$lib/utils/space-search';
import { AssetTypeEnum } from '@immich/sdk';

describe('buildSmartSearchParams', () => {
  it('should include query and spaceId', () => {
    const result = buildSmartSearchParams('sunset', 'space-1', createFilterState());
    expect(result.query).toBe('sunset');
    expect(result.spaceId).toBe('space-1');
  });

  it('should map personIds to spacePersonIds', () => {
    const filters = { ...createFilterState(), personIds: ['person-1', 'person-2'] };
    const result = buildSmartSearchParams('test', 'space-1', filters);
    expect(result.spacePersonIds).toEqual(['person-1', 'person-2']);
    expect(result).not.toHaveProperty('personIds');
  });

  it('should not include spacePersonIds when no people selected', () => {
    const result = buildSmartSearchParams('test', 'space-1', createFilterState());
    expect(result.spacePersonIds).toBeUndefined();
  });

  it('should map city filter', () => {
    const filters = { ...createFilterState(), city: 'Paris' };
    const result = buildSmartSearchParams('test', 'space-1', filters);
    expect(result.city).toBe('Paris');
  });

  it('should map country filter', () => {
    const filters = { ...createFilterState(), country: 'France' };
    const result = buildSmartSearchParams('test', 'space-1', filters);
    expect(result.country).toBe('France');
  });

  it('should map camera make filter', () => {
    const filters = { ...createFilterState(), make: 'Canon' };
    const result = buildSmartSearchParams('test', 'space-1', filters);
    expect(result.make).toBe('Canon');
  });

  it('should map camera model filter', () => {
    const filters = { ...createFilterState(), model: 'EOS R5' };
    const result = buildSmartSearchParams('test', 'space-1', filters);
    expect(result.model).toBe('EOS R5');
  });

  it('should map tagIds filter', () => {
    const filters = { ...createFilterState(), tagIds: ['tag-1', 'tag-2'] };
    const result = buildSmartSearchParams('test', 'space-1', filters);
    expect(result.tagIds).toEqual(['tag-1', 'tag-2']);
  });

  it('should not include tagIds when empty', () => {
    const result = buildSmartSearchParams('test', 'space-1', createFilterState());
    expect(result.tagIds).toBeUndefined();
  });

  it('should map rating filter', () => {
    const filters = { ...createFilterState(), rating: 4 };
    const result = buildSmartSearchParams('test', 'space-1', filters);
    expect(result.rating).toBe(4);
  });

  it('should not include rating when undefined', () => {
    const result = buildSmartSearchParams('test', 'space-1', createFilterState());
    expect(result.rating).toBeUndefined();
  });

  it('should map image mediaType to AssetTypeEnum.Image', () => {
    const filters = { ...createFilterState(), mediaType: 'image' as const };
    const result = buildSmartSearchParams('test', 'space-1', filters);
    expect(result.type).toBe(AssetTypeEnum.Image);
  });

  it('should map video mediaType to AssetTypeEnum.Video', () => {
    const filters = { ...createFilterState(), mediaType: 'video' as const };
    const result = buildSmartSearchParams('test', 'space-1', filters);
    expect(result.type).toBe(AssetTypeEnum.Video);
  });

  it('should not set type when mediaType is all', () => {
    const result = buildSmartSearchParams('test', 'space-1', createFilterState());
    expect(result.type).toBeUndefined();
  });

  it('should set date range for year + month', () => {
    const filters = { ...createFilterState(), selectedYear: 2024, selectedMonth: 6 };
    const result = buildSmartSearchParams('test', 'space-1', filters);
    expect(result.takenAfter).toBe(new Date(2024, 5, 1).toISOString());
    expect(result.takenBefore).toBe(new Date(2024, 6, 0, 23, 59, 59, 999).toISOString());
  });

  it('should set date range for year only', () => {
    const filters = { ...createFilterState(), selectedYear: 2024 };
    const result = buildSmartSearchParams('test', 'space-1', filters);
    expect(result.takenAfter).toBe(new Date(2024, 0, 1).toISOString());
    expect(result.takenBefore).toBe(new Date(2024, 11, 31, 23, 59, 59, 999).toISOString());
  });

  it('should not set dates when no temporal filter', () => {
    const result = buildSmartSearchParams('test', 'space-1', createFilterState());
    expect(result.takenAfter).toBeUndefined();
    expect(result.takenBefore).toBeUndefined();
  });

  it('should ignore month when year is not set', () => {
    const filters = { ...createFilterState(), selectedMonth: 6 };
    const result = buildSmartSearchParams('test', 'space-1', filters);
    expect(result.takenAfter).toBeUndefined();
    expect(result.takenBefore).toBeUndefined();
  });

  it('should handle all filters active simultaneously', () => {
    const filters = {
      ...createFilterState(),
      personIds: ['p-1'],
      city: 'Tokyo',
      country: 'Japan',
      make: 'Sony',
      model: 'A7IV',
      tagIds: ['t-1', 't-2'],
      rating: 5,
      mediaType: 'video' as const,
      selectedYear: 2025,
      selectedMonth: 3,
    };
    const result = buildSmartSearchParams('cherry blossoms', 'space-1', filters);
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
  });

  it('should not include empty string fields', () => {
    const filters = { ...createFilterState(), city: '', country: '', make: '', model: '' };
    const result = buildSmartSearchParams('test', 'space-1', filters);
    expect(result.city).toBeUndefined();
    expect(result.country).toBeUndefined();
    expect(result.make).toBeUndefined();
    expect(result.model).toBeUndefined();
  });
});

describe('SEARCH_FILTER_DEBOUNCE_MS', () => {
  it('should be 250ms', () => {
    expect(SEARCH_FILTER_DEBOUNCE_MS).toBe(250);
  });
});

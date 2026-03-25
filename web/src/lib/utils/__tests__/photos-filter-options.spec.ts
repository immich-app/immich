import { createFilterState } from '$lib/components/filter-panel/filter-panel';
import { buildPhotosTimelineOptions, handlePhotosRemoveFilter } from '$lib/utils/photos-filter-options';
import { AssetOrder, AssetTypeEnum, AssetVisibility } from '@immich/sdk';
import { describe, expect, it } from 'vitest';

describe('buildPhotosTimelineOptions', () => {
  it('should return base options with no filters', () => {
    const options = buildPhotosTimelineOptions(createFilterState());
    expect(options).toEqual({
      visibility: AssetVisibility.Timeline,
      withStacked: true,
      withPartners: true,
      withSharedSpaces: true,
      order: AssetOrder.Desc,
    });
  });

  it('should use personIds (not spacePersonIds) for people filter', () => {
    const filters = { ...createFilterState(), personIds: ['person-1', 'person-2'] };
    const options = buildPhotosTimelineOptions(filters);
    expect(options.personIds).toEqual(['person-1', 'person-2']);
    expect(options).not.toHaveProperty('spacePersonIds');
  });

  it('should include city and country for location filter', () => {
    const filters = { ...createFilterState(), country: 'Germany', city: 'Berlin' };
    const options = buildPhotosTimelineOptions(filters);
    expect(options.country).toBe('Germany');
    expect(options.city).toBe('Berlin');
  });

  it('should include make and model for camera filter', () => {
    const filters = { ...createFilterState(), make: 'Sony', model: 'A7III' };
    const options = buildPhotosTimelineOptions(filters);
    expect(options.make).toBe('Sony');
    expect(options.model).toBe('A7III');
  });

  it('should include tagIds for tags filter', () => {
    const filters = { ...createFilterState(), tagIds: ['tag-1'] };
    const options = buildPhotosTimelineOptions(filters);
    expect(options.tagIds).toEqual(['tag-1']);
  });

  it('should include rating for rating filter', () => {
    const filters = { ...createFilterState(), rating: 4 };
    const options = buildPhotosTimelineOptions(filters);
    expect(options.rating).toBe(4);
  });

  it('should map mediaType image to AssetTypeEnum.Image', () => {
    const filters = { ...createFilterState(), mediaType: 'image' as const };
    const options = buildPhotosTimelineOptions(filters);
    expect(options.$type).toBe(AssetTypeEnum.Image);
  });

  it('should map mediaType video to AssetTypeEnum.Video', () => {
    const filters = { ...createFilterState(), mediaType: 'video' as const };
    const options = buildPhotosTimelineOptions(filters);
    expect(options.$type).toBe(AssetTypeEnum.Video);
  });

  it('should not include $type when mediaType is all', () => {
    const options = buildPhotosTimelineOptions(createFilterState());
    expect(options).not.toHaveProperty('$type');
  });

  it('should set ascending order', () => {
    const filters = { ...createFilterState(), sortOrder: 'asc' as const };
    const options = buildPhotosTimelineOptions(filters);
    expect(options.order).toBe(AssetOrder.Asc);
  });

  it('should set year-only date range using UTC (consistent with buildFilterContext)', () => {
    const filters = { ...createFilterState(), selectedYear: 2023 };
    const options = buildPhotosTimelineOptions(filters);
    expect(options.takenAfter).toBe('2023-01-01T00:00:00.000Z');
    expect(options.takenBefore).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should set year+month date range using UTC (consistent with buildFilterContext)', () => {
    const filters = { ...createFilterState(), selectedYear: 2023, selectedMonth: 8 };
    const options = buildPhotosTimelineOptions(filters);
    expect(options.takenAfter).toBe('2023-08-01T00:00:00.000Z');
    expect(options.takenBefore).toBe('2023-09-01T00:00:00.000Z');
  });

  it('should preserve withPartners and withSharedSpaces when filters are active', () => {
    const filters = { ...createFilterState(), country: 'Japan', rating: 5 };
    const options = buildPhotosTimelineOptions(filters);
    expect(options.withPartners).toBe(true);
    expect(options.withSharedSpaces).toBe(true);
  });

  it('should handle multiple simultaneous filters', () => {
    const filters = {
      ...createFilterState(),
      personIds: ['p1'],
      country: 'Germany',
      city: 'Berlin',
      make: 'Sony',
      tagIds: ['t1', 't2'],
      rating: 3,
      mediaType: 'image' as const,
      sortOrder: 'asc' as const,
      selectedYear: 2023,
    };
    const options = buildPhotosTimelineOptions(filters);
    expect(options.personIds).toEqual(['p1']);
    expect(options.country).toBe('Germany');
    expect(options.city).toBe('Berlin');
    expect(options.make).toBe('Sony');
    expect(options.tagIds).toEqual(['t1', 't2']);
    expect(options.rating).toBe(3);
    expect(options.$type).toBe(AssetTypeEnum.Image);
    expect(options.order).toBe(AssetOrder.Asc);
    expect(options.takenAfter).toBeDefined();
  });

  it('should not include empty personIds array', () => {
    const options = buildPhotosTimelineOptions(createFilterState());
    expect(options).not.toHaveProperty('personIds');
  });

  it('should not include empty tagIds array', () => {
    const options = buildPhotosTimelineOptions(createFilterState());
    expect(options).not.toHaveProperty('tagIds');
  });

  it('should not include undefined optional fields', () => {
    const options = buildPhotosTimelineOptions(createFilterState());
    expect(options).not.toHaveProperty('city');
    expect(options).not.toHaveProperty('country');
    expect(options).not.toHaveProperty('make');
    expect(options).not.toHaveProperty('model');
    expect(options).not.toHaveProperty('rating');
    expect(options).not.toHaveProperty('takenAfter');
    expect(options).not.toHaveProperty('takenBefore');
  });
});

describe('handlePhotosRemoveFilter', () => {
  it('should remove a specific person from personIds', () => {
    const filters = { ...createFilterState(), personIds: ['p1', 'p2', 'p3'] };
    const result = handlePhotosRemoveFilter(filters, 'person', 'p2');
    expect(result.personIds).toEqual(['p1', 'p3']);
  });

  it('should clear location (both country and city)', () => {
    const filters = { ...createFilterState(), country: 'Germany', city: 'Berlin' };
    const result = handlePhotosRemoveFilter(filters, 'location');
    expect(result.country).toBeUndefined();
    expect(result.city).toBeUndefined();
  });

  it('should clear camera (both make and model)', () => {
    const filters = { ...createFilterState(), make: 'Sony', model: 'A7III' };
    const result = handlePhotosRemoveFilter(filters, 'camera');
    expect(result.make).toBeUndefined();
    expect(result.model).toBeUndefined();
  });

  it('should remove a specific tag from tagIds', () => {
    const filters = { ...createFilterState(), tagIds: ['t1', 't2'] };
    const result = handlePhotosRemoveFilter(filters, 'tag', 't1');
    expect(result.tagIds).toEqual(['t2']);
  });

  it('should clear rating', () => {
    const filters = { ...createFilterState(), rating: 4 };
    const result = handlePhotosRemoveFilter(filters, 'rating');
    expect(result.rating).toBeUndefined();
  });

  it('should reset mediaType to all', () => {
    const filters = { ...createFilterState(), mediaType: 'video' as const };
    const result = handlePhotosRemoveFilter(filters, 'media');
    expect(result.mediaType).toBe('all');
  });

  it('should handle mediaType alias', () => {
    const filters = { ...createFilterState(), mediaType: 'image' as const };
    const result = handlePhotosRemoveFilter(filters, 'mediaType');
    expect(result.mediaType).toBe('all');
  });

  it('should preserve sortOrder when removing filters', () => {
    const filters = { ...createFilterState(), sortOrder: 'asc' as const, rating: 5 };
    const result = handlePhotosRemoveFilter(filters, 'rating');
    expect(result.sortOrder).toBe('asc');
    expect(result.rating).toBeUndefined();
  });

  it('should preserve other filters when removing one', () => {
    const filters = { ...createFilterState(), country: 'Germany', rating: 4, personIds: ['p1'] };
    const result = handlePhotosRemoveFilter(filters, 'rating');
    expect(result.country).toBe('Germany');
    expect(result.personIds).toEqual(['p1']);
    expect(result.rating).toBeUndefined();
  });
});

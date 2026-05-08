import { createFilterState } from '$lib/components/filter-panel/filter-panel';
import { buildSpaceTimelineOptions, handleSpaceRemoveFilter } from '$lib/utils/space-filter-options';
import { AssetOrder, AssetTypeEnum } from '@immich/sdk';
import { describe, expect, it } from 'vitest';

describe('buildSpaceTimelineOptions', () => {
  it('maps custom dates and people for spaces timeline options', () => {
    const filters = {
      ...createFilterState(),
      personIds: ['space-person-1'],
      dateAfter: '2024-01-01',
      dateBefore: '2024-12-31',
    };

    expect(buildSpaceTimelineOptions('space-1', filters)).toEqual(
      expect.objectContaining({
        spaceId: 'space-1',
        withStacked: true,
        spacePersonIds: ['space-person-1'],
        takenAfter: '2024-01-01T00:00:00.000Z',
        takenBefore: '2025-01-01T00:00:00.000Z',
      }),
    );
  });

  it('prefers custom dates over selected year and month', () => {
    const filters = {
      ...createFilterState(),
      selectedYear: 2023,
      selectedMonth: 8,
      dateBefore: '2024-12-31',
    };

    const result = buildSpaceTimelineOptions('space-1', filters);
    expect(result.takenAfter).toBeUndefined();
    expect(result.takenBefore).toBe('2025-01-01T00:00:00.000Z');
  });

  it('maps media type and sort order for spaces timeline options', () => {
    const filters = { ...createFilterState(), mediaType: 'video' as const, sortOrder: 'asc' as const };

    expect(buildSpaceTimelineOptions('space-1', filters)).toEqual(
      expect.objectContaining({
        $type: AssetTypeEnum.Video,
        order: AssetOrder.Asc,
      }),
    );
  });

  it('preserves location, camera, rating, and tags in spaces timeline options', () => {
    const filters = {
      ...createFilterState(),
      city: 'Berlin',
      country: 'Germany',
      make: 'Sony',
      model: 'A7C',
      rating: 4,
      tagIds: ['tag-1'],
    };

    expect(buildSpaceTimelineOptions('space-1', filters)).toEqual(
      expect.objectContaining({
        city: 'Berlin',
        country: 'Germany',
        make: 'Sony',
        model: 'A7C',
        rating: 4,
        tagIds: ['tag-1'],
      }),
    );
  });

  it('preserves favorites in spaces timeline options', () => {
    const filters = { ...createFilterState(), isFavorite: true };

    expect(buildSpaceTimelineOptions('space-1', filters)).toEqual(
      expect.objectContaining({
        spaceId: 'space-1',
        isFavorite: true,
      }),
    );
  });

  it('preserves has-no-album in spaces timeline options', () => {
    const filters = { ...createFilterState(), isNotInAlbum: true };

    expect(buildSpaceTimelineOptions('space-1', filters)).toEqual(
      expect.objectContaining({
        spaceId: 'space-1',
        isNotInAlbum: true,
      }),
    );
  });

  it('omits has-no-album when it is false', () => {
    const filters = { ...createFilterState(), isNotInAlbum: false };

    expect(buildSpaceTimelineOptions('space-1', filters)).not.toHaveProperty('isNotInAlbum');
  });
});

describe('handleSpaceRemoveFilter', () => {
  it('clears both temporal modes when removing timeline filter', () => {
    const filters = {
      ...createFilterState(),
      dateAfter: '2024-01-01',
      dateBefore: '2024-12-31',
      selectedYear: 2023,
      selectedMonth: 8,
    };

    const result = handleSpaceRemoveFilter(filters, 'timeline');
    expect(result.dateAfter).toBeUndefined();
    expect(result.dateBefore).toBeUndefined();
    expect(result.selectedYear).toBeUndefined();
    expect(result.selectedMonth).toBeUndefined();
  });

  it('clears favorites when removing favorites filter', () => {
    const filters = { ...createFilterState(), isFavorite: true };

    expect(handleSpaceRemoveFilter(filters, 'favorites').isFavorite).toBeUndefined();
    expect(handleSpaceRemoveFilter(filters, 'isFavorite').isFavorite).toBeUndefined();
  });

  it('clears has-no-album when removing albums filter', () => {
    const filters = { ...createFilterState(), isNotInAlbum: true };

    expect(handleSpaceRemoveFilter(filters, 'albums').isNotInAlbum).toBeUndefined();
    expect(handleSpaceRemoveFilter(filters, 'isNotInAlbum').isNotInAlbum).toBeUndefined();
  });
});

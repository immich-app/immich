import { createFilterState } from '$lib/components/filter-panel/filter-panel';
import { buildAlbumAssetPickerOptions, buildAlbumTimelineOptions } from '$lib/utils/album-filter-options';
import { AssetOrder, AssetTypeEnum, AssetVisibility } from '@immich/sdk';
import { describe, expect, it } from 'vitest';

describe('buildAlbumTimelineOptions', () => {
  it('maps all supported filters without changing the passed album order', () => {
    const filters = {
      ...createFilterState(),
      personIds: ['person-1'],
      country: 'Germany',
      city: 'Berlin',
      make: 'Sony',
      model: 'A7C',
      tagIds: ['tag-1'],
      rating: 4,
      mediaType: 'image' as const,
      selectedYear: 2024,
      selectedMonth: 2,
      sortOrder: 'desc' as const,
    };

    expect(buildAlbumTimelineOptions('album-1', AssetOrder.Asc, filters)).toEqual({
      albumId: 'album-1',
      order: AssetOrder.Asc,
      personIds: ['person-1'],
      country: 'Germany',
      city: 'Berlin',
      make: 'Sony',
      model: 'A7C',
      tagIds: ['tag-1'],
      rating: 4,
      $type: AssetTypeEnum.Image,
      takenAfter: '2024-02-01T00:00:00.000Z',
      takenBefore: '2024-03-01T00:00:00.000Z',
    });
  });

  it('maps custom dates for album timeline options', () => {
    const filters = { ...createFilterState(), dateAfter: '2024-01-01', dateBefore: '2024-12-31' };

    expect(buildAlbumTimelineOptions('album-1', AssetOrder.Desc, filters)).toEqual(
      expect.objectContaining({
        takenAfter: '2024-01-01T00:00:00.000Z',
        takenBefore: '2025-01-01T00:00:00.000Z',
      }),
    );
  });
});

describe('buildAlbumAssetPickerOptions', () => {
  it('keeps picker base options and does not add album scope', () => {
    const filters = {
      ...createFilterState(),
      personIds: ['person-1'],
      tagIds: ['tag-1'],
      mediaType: 'video' as const,
      selectedYear: 2023,
    };

    expect(buildAlbumAssetPickerOptions('album-1', filters)).toEqual({
      visibility: AssetVisibility.Timeline,
      withPartners: true,
      timelineAlbumId: 'album-1',
      personIds: ['person-1'],
      tagIds: ['tag-1'],
      $type: AssetTypeEnum.Video,
      takenAfter: '2023-01-01T00:00:00.000Z',
      takenBefore: '2024-01-01T00:00:00.000Z',
    });
  });

  it('maps custom dates for album asset picker options', () => {
    const filters = { ...createFilterState(), dateAfter: '2024-01-01' };

    expect(buildAlbumAssetPickerOptions('album-1', filters)).toEqual(
      expect.objectContaining({ takenAfter: '2024-01-01T00:00:00.000Z' }),
    );
  });
});

import { createFilterState } from '$lib/components/filter-panel/filter-panel';
import {
  buildMapMarkerOptions,
  buildMapTimeBucketOptions,
  buildMapTimelineOptions,
} from '$lib/utils/map-filter-options';
import { AssetTypeEnum, AssetVisibility } from '@immich/sdk';

describe('buildMapMarkerOptions', () => {
  it('includes custom dates in map marker options', () => {
    const filters = { ...createFilterState(), dateAfter: '2024-01-01', dateBefore: '2024-12-31' };

    expect(buildMapMarkerOptions(filters)).toEqual(
      expect.objectContaining({
        takenAfter: '2024-01-01T00:00:00.000Z',
        takenBefore: '2025-01-01T00:00:00.000Z',
      }),
    );
  });
});

describe('buildMapTimeBucketOptions', () => {
  it('includes active global map filters in time bucket requests', () => {
    const filters = {
      ...createFilterState(),
      personIds: ['person-1'],
      make: 'Canon',
      model: 'EOS R6',
      tagIds: ['tag-1'],
      rating: 4,
      mediaType: 'video' as const,
      isFavorite: true,
      selectedYear: 2015,
      selectedMonth: 3,
    };

    expect(buildMapTimeBucketOptions(filters)).toEqual({
      visibility: AssetVisibility.Timeline,
      withSharedSpaces: true,
      personIds: ['person-1'],
      make: 'Canon',
      model: 'EOS R6',
      tagIds: ['tag-1'],
      rating: 4,
      isFavorite: true,
      $type: AssetTypeEnum.Video,
      takenAfter: '2015-03-01T00:00:00.000Z',
      takenBefore: '2015-04-01T00:00:00.000Z',
    });
  });

  it('uses the current space instead of global timeline visibility when spaceId is present', () => {
    const filters = {
      ...createFilterState(),
      country: 'Australia',
      mediaType: 'image' as const,
    };

    expect(buildMapTimeBucketOptions(filters, 'space-123')).toEqual({
      spaceId: 'space-123',
      country: 'Australia',
      $type: AssetTypeEnum.Image,
    });
  });

  it('includes custom dates in map time bucket options', () => {
    const filters = { ...createFilterState(), dateBefore: '2024-12-31' };

    expect(buildMapTimeBucketOptions(filters)).toEqual(
      expect.objectContaining({ takenBefore: '2025-01-01T00:00:00.000Z' }),
    );
  });
});

describe('buildMapTimelineOptions', () => {
  it('includes shared spaces for global map cluster timelines', () => {
    const filters = {
      ...createFilterState(),
      personIds: ['person-1'],
      tagIds: ['tag-1'],
      rating: 4,
      mediaType: 'image' as const,
      selectedYear: 2024,
      selectedMonth: 7,
    };
    const selectedClusterIds = new Set(['asset-1', 'asset-2']);

    expect(buildMapTimelineOptions(filters, '1,2,3,4', selectedClusterIds)).toEqual({
      bbox: '1,2,3,4',
      visibility: AssetVisibility.Timeline,
      withSharedSpaces: true,
      assetFilter: selectedClusterIds,
      personIds: ['person-1'],
      tagIds: ['tag-1'],
      rating: 4,
      $type: AssetTypeEnum.Image,
      takenAfter: '2024-07-01T00:00:00.000Z',
      takenBefore: '2024-08-01T00:00:00.000Z',
    });
  });

  it('uses space-scoped person filters for space map cluster timelines', () => {
    const filters = {
      ...createFilterState(),
      personIds: ['space-person-1'],
    };
    const selectedClusterIds = new Set(['asset-1']);

    expect(buildMapTimelineOptions(filters, '1,2,3,4', selectedClusterIds, 'space-1')).toEqual({
      bbox: '1,2,3,4',
      spaceId: 'space-1',
      assetFilter: selectedClusterIds,
      spacePersonIds: ['space-person-1'],
    });
  });
});

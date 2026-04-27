import { createFilterState } from '$lib/components/filter-panel/filter-panel';
import { buildAlbumAssetPickerFilterConfig, buildAlbumDetailFilterConfig } from '$lib/utils/album-filter-config';
import { AssetTypeEnum, getFilterSuggestions, getSearchSuggestions } from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@immich/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@immich/sdk')>();
  return {
    ...actual,
    getFilterSuggestions: vi.fn().mockResolvedValue({
      countries: ['Germany'],
      cameraMakes: ['Sony'],
      tags: [{ id: 'tag-1', value: 'Vacation' }],
      people: [{ id: 'person-1', name: 'Alice' }],
      ratings: [5],
      mediaTypes: ['IMAGE'],
      hasUnnamedPeople: false,
    }),
    getSearchSuggestions: vi.fn().mockResolvedValue(['Berlin']),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('buildAlbumDetailFilterConfig', () => {
  it('keeps the album filter sections in plan order', () => {
    const config = buildAlbumDetailFilterConfig('album-1');
    expect(config.sections).toEqual([
      'timeline',
      'people',
      'location',
      'camera',
      'tags',
      'rating',
      'media',
      'favorites',
    ]);
  });

  it('passes albumId to filter suggestions, maps suggestions, and scopes dependent providers', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValueOnce({
      countries: ['Germany'],
      cameraMakes: ['Sony'],
      tags: [{ id: 'tag-1', value: 'Vacation' }],
      people: [{ id: 'person-1', name: 'Alice' }],
      ratings: [5],
      mediaTypes: ['IMAGE'],
      hasUnnamedPeople: true,
    } as never);

    const config = buildAlbumDetailFilterConfig('album-1');
    const filters = {
      ...createFilterState(),
      personIds: ['person-1'],
      tagIds: ['tag-1'],
      mediaType: 'image' as const,
    };

    const result = await config.suggestionsProvider!(filters);
    await config.providers!.cities!('Germany', { takenAfter: '2024-01-01T00:00:00.000Z' });
    await config.providers!.cameraModels!('Sony', { takenBefore: '2024-12-31T00:00:00.000Z' });

    expect(result.tags).toEqual([{ id: 'tag-1', name: 'Vacation' }]);
    expect(result.people).toEqual([
      expect.objectContaining({
        id: 'person-1',
        name: 'Alice',
        thumbnailUrl: expect.stringContaining('/people/person-1/thumbnail'),
      }),
    ]);
    expect(result.hasUnnamedPeople).toBe(true);

    expect(getFilterSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({
        albumId: 'album-1',
        personIds: ['person-1'],
        tagIds: ['tag-1'],
        mediaType: AssetTypeEnum.Image,
      }),
    );
    expect(getSearchSuggestions).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ albumId: 'album-1', country: 'Germany' }),
    );
    expect(getSearchSuggestions).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ albumId: 'album-1', make: 'Sony' }),
    );
  });

  it('passes custom dates to album detail filter suggestions', async () => {
    const config = buildAlbumDetailFilterConfig('album-1');
    await config.suggestionsProvider!({
      ...createFilterState(),
      dateAfter: '2024-01-01',
      dateBefore: '2024-12-31',
    });

    expect(getFilterSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({
        albumId: 'album-1',
        takenAfter: '2024-01-01T00:00:00.000Z',
        takenBefore: '2025-01-01T00:00:00.000Z',
      }),
    );
  });

  it('passes isFavorite to album detail filter suggestions', async () => {
    const config = buildAlbumDetailFilterConfig('album-1');
    await config.suggestionsProvider!({ ...createFilterState(), isFavorite: true });

    expect(getFilterSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ albumId: 'album-1', isFavorite: true }),
    );
  });
});

describe('buildAlbumAssetPickerFilterConfig', () => {
  it('keeps the picker filter sections in plan order', () => {
    const config = buildAlbumAssetPickerFilterConfig();
    expect(config.sections).toEqual([
      'timeline',
      'people',
      'location',
      'camera',
      'tags',
      'rating',
      'media',
      'favorites',
    ]);
  });

  it('does not send albumId or withSharedSpaces', async () => {
    const config = buildAlbumAssetPickerFilterConfig();

    await config.suggestionsProvider!(createFilterState());
    await config.providers!.cities!('Germany');

    const filterRequest = vi.mocked(getFilterSuggestions).mock.calls[0][0];
    const cityRequest = vi.mocked(getSearchSuggestions).mock.calls[0][0];

    expect(filterRequest).not.toHaveProperty('albumId');
    expect(filterRequest).not.toHaveProperty('withSharedSpaces');
    expect(cityRequest).not.toHaveProperty('albumId');
    expect(cityRequest).not.toHaveProperty('withSharedSpaces');
  });

  it('passes custom dates to album asset picker filter suggestions', async () => {
    const config = buildAlbumAssetPickerFilterConfig();
    await config.suggestionsProvider!({
      ...createFilterState(),
      dateBefore: '2024-12-31',
    });

    expect(getFilterSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({
        takenBefore: '2025-01-01T00:00:00.000Z',
      }),
    );
  });

  it('passes isFavorite to album asset picker filter suggestions', async () => {
    const config = buildAlbumAssetPickerFilterConfig();
    await config.suggestionsProvider!({ ...createFilterState(), isFavorite: true });

    expect(getFilterSuggestions).toHaveBeenCalledWith(expect.objectContaining({ isFavorite: true }));
  });
});

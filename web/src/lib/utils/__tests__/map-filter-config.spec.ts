import { buildMapFilterConfig } from '$lib/utils/map-filter-config';
import { getFilterSuggestions, getSearchSuggestions, Type } from '@immich/sdk';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@immich/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@immich/sdk')>();
  return {
    ...actual,
    getFilterSuggestions: vi.fn().mockResolvedValue({
      countries: [],
      cameraMakes: [],
      tags: [],
      people: [],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    }),
    getSearchSuggestions: vi.fn().mockResolvedValue([]),
  };
});

describe('buildMapFilterConfig', () => {
  it('should include location in sections', () => {
    const config = buildMapFilterConfig();
    expect(config.sections).toContain('location');
  });

  it('should include all expected sections', () => {
    const config = buildMapFilterConfig();
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

  it('should have suggestionsProvider', () => {
    const config = buildMapFilterConfig();
    expect(config.suggestionsProvider).toBeDefined();
  });

  it('should have cameraModels fallback provider', () => {
    const config = buildMapFilterConfig();
    expect(config.providers!.cameraModels).toBeDefined();
  });

  it('should have cities provider', () => {
    const config = buildMapFilterConfig();
    expect(config.providers!.cities).toBeDefined();
  });

  describe('suggestionsProvider', () => {
    const emptyFilters = {
      personIds: [],
      country: undefined,
      city: undefined,
      make: undefined,
      model: undefined,
      tagIds: [],
      rating: undefined,
      mediaType: 'all' as const,
      isFavorite: undefined,
      selectedYear: undefined,
      selectedMonth: undefined,
      sortOrder: 'desc' as const,
    };

    it('should pass withSharedSpaces when no spaceId', async () => {
      const config = buildMapFilterConfig();
      await config.suggestionsProvider!(emptyFilters);

      expect(getFilterSuggestions).toHaveBeenCalledWith(expect.objectContaining({ withSharedSpaces: true }));
    });

    it('should pass spaceId when provided', async () => {
      const config = buildMapFilterConfig('space-123');
      await config.suggestionsProvider!(emptyFilters);

      expect(getFilterSuggestions).toHaveBeenCalledWith(expect.objectContaining({ spaceId: 'space-123' }));
    });

    it('should map people with thumbnail URLs', async () => {
      vi.mocked(getFilterSuggestions).mockResolvedValueOnce({
        countries: [],
        cameraMakes: [],
        tags: [],
        people: [{ id: '1', name: 'Alice' }],
        ratings: [],
        mediaTypes: [],
        hasUnnamedPeople: false,
      } as never);

      const config = buildMapFilterConfig();
      const result = await config.suggestionsProvider!(emptyFilters);

      expect(result.people).toHaveLength(1);
      expect(result.people[0].name).toBe('Alice');
      expect(result.people[0].thumbnailUrl).toContain('/people/1/thumbnail');
    });

    it('should map global shared-space primary people to shared-space thumbnails', async () => {
      vi.mocked(getFilterSuggestions).mockResolvedValueOnce({
        countries: [],
        cameraMakes: [],
        tags: [],
        people: [
          {
            id: 'space-person:space-person-1',
            name: 'Alice',
            primaryProfile: { type: Type.SpacePerson, id: 'space-person-1', spaceId: 'space-1' },
          },
        ],
        ratings: [],
        mediaTypes: [],
        hasUnnamedPeople: false,
      } as never);

      const config = buildMapFilterConfig();
      const result = await config.suggestionsProvider!(emptyFilters);

      expect(result.people[0]).toEqual({
        id: 'space-person:space-person-1',
        name: 'Alice',
        thumbnailUrl: '/api/shared-spaces/space-1/people/space-person-1/thumbnail',
      });
    });

    it('should map space-scoped people to shared-space thumbnails', async () => {
      vi.mocked(getFilterSuggestions).mockResolvedValueOnce({
        countries: [],
        cameraMakes: [],
        tags: [],
        people: [{ id: 'space-person-1', name: 'Alice' }],
        ratings: [],
        mediaTypes: [],
        hasUnnamedPeople: false,
      } as never);

      const config = buildMapFilterConfig('space-1');
      const result = await config.suggestionsProvider!(emptyFilters);

      expect(result.people[0]).toEqual({
        id: 'space-person-1',
        name: 'Alice',
        thumbnailUrl: '/api/shared-spaces/space-1/people/space-person-1/thumbnail',
      });
    });

    it('should map tags correctly', async () => {
      vi.mocked(getFilterSuggestions).mockResolvedValueOnce({
        countries: [],
        cameraMakes: [],
        tags: [{ id: 'tag-1', value: 'Nature' }],
        people: [],
        ratings: [],
        mediaTypes: [],
        hasUnnamedPeople: false,
      } as never);

      const config = buildMapFilterConfig();
      const result = await config.suggestionsProvider!(emptyFilters);

      expect(result.tags).toHaveLength(1);
      expect(result.tags[0]).toEqual({ id: 'tag-1', name: 'Nature' });
    });
  });

  it('should pass withSharedSpaces to cameraModels provider when no spaceId', async () => {
    vi.mocked(getSearchSuggestions).mockResolvedValue(['D850'] as never);

    const config = buildMapFilterConfig();
    await config.providers!.cameraModels!('Nikon');

    expect(getSearchSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ withSharedSpaces: true, make: 'Nikon' }),
    );
  });

  it('should pass spaceId to cameraModels provider when spaceId given', async () => {
    vi.mocked(getSearchSuggestions).mockResolvedValue(['D850'] as never);

    const config = buildMapFilterConfig('space-123');
    await config.providers!.cameraModels!('Nikon');

    expect(getSearchSuggestions).toHaveBeenCalledWith(expect.objectContaining({ spaceId: 'space-123', make: 'Nikon' }));
  });

  it('should pass withSharedSpaces to cities provider when no spaceId', async () => {
    vi.mocked(getSearchSuggestions).mockResolvedValue(['Paris'] as never);

    const config = buildMapFilterConfig();
    await config.providers!.cities!('France');

    expect(getSearchSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ country: 'France', withSharedSpaces: true }),
    );
  });

  it('should pass spaceId to cities provider when spaceId given', async () => {
    vi.mocked(getSearchSuggestions).mockResolvedValue(['Berlin'] as never);

    const config = buildMapFilterConfig('space-123');
    await config.providers!.cities!('Germany');

    expect(getSearchSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ country: 'Germany', spaceId: 'space-123' }),
    );
  });
});

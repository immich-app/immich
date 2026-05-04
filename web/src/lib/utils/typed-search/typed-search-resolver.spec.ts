import {
  AssetTypeEnum,
  getFilterSuggestions,
  getSearchSuggestions,
  searchPerson,
  SearchSuggestionType,
} from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseTypedSearch } from './typed-search-parser';
import { resolveTypedSearchFilters } from './typed-search-resolver';

vi.mock('@immich/sdk', async () => ({
  ...(await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk')),
  searchPerson: vi.fn(),
  getFilterSuggestions: vi.fn(),
  getSearchSuggestions: vi.fn(),
}));

describe('resolveTypedSearchFilters', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: [],
      cameraMakes: [],
      tags: [],
      ratings: [],
      mediaTypes: [AssetTypeEnum.Image, AssetTypeEnum.Video],
      hasUnnamedPeople: false,
    });
    vi.mocked(getSearchSuggestions).mockResolvedValue([]);
  });

  it('resolves a single person, tag, and camera make', async () => {
    vi.mocked(searchPerson).mockResolvedValue([{ id: 'person-1', name: 'Anna' } as never]);
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: [],
      cameraMakes: ['Nikon'],
      tags: [{ id: 'tag-1', value: 'Travel' }],
      ratings: [4],
      mediaTypes: [AssetTypeEnum.Image],
      hasUnnamedPeople: false,
    });

    const result = await resolveTypedSearchFilters(parseTypedSearch('beach person:anna tag:travel camera:nikon'), {});

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.queryText).toBe('beach');
      expect(result.filters.personIds).toEqual(['person-1']);
      expect(result.filters.tagIds).toEqual(['tag-1']);
      expect(result.filters.make).toBe('Nikon');
      expect(result.personNames.get('person-1')).toBe('Anna');
      expect(result.tagNames.get('tag-1')).toBe('Travel');
    }
  });

  it('canonicalizes city filters with case-insensitive suggestions', async () => {
    vi.mocked(getSearchSuggestions).mockResolvedValue(['Munich']);

    const result = await resolveTypedSearchFilters(parseTypedSearch('city:munich'), {});

    expect(getSearchSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ $type: SearchSuggestionType.City, withSharedSpaces: true }),
      { signal: undefined },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.filters.city).toBe('Munich');
    }
  });

  it('canonicalizes country filters before resolving city casing', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: ['Germany'],
      cameraMakes: [],
      tags: [],
      ratings: [],
      mediaTypes: [AssetTypeEnum.Image],
      hasUnnamedPeople: false,
    });
    vi.mocked(getSearchSuggestions).mockResolvedValue(['Munich']);

    const result = await resolveTypedSearchFilters(parseTypedSearch('country:germany city:munich'), {});

    expect(getFilterSuggestions).toHaveBeenCalledWith(expect.objectContaining({ withSharedSpaces: true }), {
      signal: undefined,
    });
    expect(getSearchSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ $type: SearchSuggestionType.City, country: 'Germany', withSharedSpaces: true }),
      { signal: undefined },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.filters.country).toBe('Germany');
      expect(result.filters.city).toBe('Munich');
    }
  });

  it('blocks when person resolution has no match', async () => {
    vi.mocked(searchPerson).mockResolvedValue([]);

    const result = await resolveTypedSearchFilters(parseTypedSearch('person:anna'), {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toMatchObject({ code: 'no-match', key: 'person', value: 'anna' });
    }
  });

  it('blocks when person resolution is ambiguous', async () => {
    vi.mocked(searchPerson).mockResolvedValue([
      { id: 'person-1', name: 'Anna' },
      { id: 'person-2', name: 'Anna Maria' },
    ] as never);

    const result = await resolveTypedSearchFilters(parseTypedSearch('person:anna'), {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toMatchObject({ code: 'ambiguous', key: 'person', value: 'anna' });
      expect(result.choices).toHaveLength(2);
    }
  });

  it('uses a selected ambiguity choice without calling SDK resolution again for that token', async () => {
    const selectedChoices = new Map([
      [
        'person:anna',
        { tokenRaw: 'person:anna', key: 'person' as const, id: 'person-2', label: 'Anna Maria', value: 'anna' },
      ],
    ]);

    const result = await resolveTypedSearchFilters(parseTypedSearch('person:anna'), { selectedChoices });

    expect(searchPerson).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.filters.personIds).toEqual(['person-2']);
      expect(result.personNames.get('person-2')).toBe('Anna Maria');
    }
  });

  it('accumulates repeated people and tags in input order', async () => {
    vi.mocked(searchPerson)
      .mockResolvedValueOnce([{ id: 'person-1', name: 'Anna' } as never])
      .mockResolvedValueOnce([{ id: 'person-2', name: 'Bob' } as never]);
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: [],
      cameraMakes: [],
      tags: [
        { id: 'tag-1', value: 'Travel' },
        { id: 'tag-2', value: 'Family' },
      ],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    });

    const result = await resolveTypedSearchFilters(
      parseTypedSearch('person:anna person:bob tag:travel tag:family'),
      {},
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.filters.personIds).toEqual(['person-1', 'person-2']);
      expect(result.filters.tagIds).toEqual(['tag-1', 'tag-2']);
    }
  });

  it('blocks when tag has no match', async () => {
    const result = await resolveTypedSearchFilters(parseTypedSearch('tag:vacation'), {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toMatchObject({ code: 'no-match', key: 'tag', value: 'vacation' });
    }
  });

  it('blocks when tag resolution is ambiguous', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: [],
      cameraMakes: [],
      tags: [
        { id: 'tag-1', value: 'Travel' },
        { id: 'tag-2', value: 'Travel 2025' },
      ],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    });

    const result = await resolveTypedSearchFilters(parseTypedSearch('tag:trav'), {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toMatchObject({ code: 'ambiguous', key: 'tag', value: 'trav' });
      expect(result.choices).toHaveLength(2);
    }
  });

  it('passes spaceId to suggestion-backed resolution', async () => {
    vi.mocked(searchPerson).mockResolvedValue([{ id: 'space-person-1', name: 'Anna' } as never]);

    await resolveTypedSearchFilters(parseTypedSearch('person:anna camera:nikon'), { spaceId: 'space-1' });

    expect(getFilterSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ spaceId: 'space-1' }),
      expect.anything(),
    );
  });

  it('uses space-scoped people from filter suggestions when resolving people inside a space', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [{ id: 'space-person-1', name: 'Anna' }],
      countries: [],
      cameraMakes: [],
      tags: [],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    });

    const result = await resolveTypedSearchFilters(parseTypedSearch('person:anna'), { spaceId: 'space-1' });

    expect(searchPerson).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.filters.personIds).toEqual(['space-person-1']);
      expect(result.personNames.get('space-person-1')).toBe('Anna');
    }
  });

  it('blocks when camera matches both make and model', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: [],
      cameraMakes: ['Nikon'],
      tags: [],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    });
    vi.mocked(getSearchSuggestions).mockResolvedValue(['Nikon']);

    const result = await resolveTypedSearchFilters(parseTypedSearch('camera:nikon'), {});

    expect(getSearchSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ $type: SearchSuggestionType.CameraModel }),
      expect.anything(),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toMatchObject({ code: 'ambiguous', key: 'camera', value: 'nikon' });
    }
  });

  it('blocks when camera has no match', async () => {
    const result = await resolveTypedSearchFilters(parseTypedSearch('camera:nikon'), {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toMatchObject({ code: 'no-match', key: 'camera', value: 'nikon' });
    }
  });

  it('returns a resolver-error issue for SDK failures', async () => {
    vi.mocked(searchPerson).mockRejectedValue(new Error('network down'));

    const result = await resolveTypedSearchFilters(parseTypedSearch('person:anna'), {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toMatchObject({ code: 'resolver-error', message: 'network down' });
    }
  });
});

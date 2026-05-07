import {
  getAllPeople,
  getFilterSuggestions,
  getSearchSuggestions,
  searchPerson,
  SearchSuggestionType,
} from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveLiveTypedSearchSuggestions } from './typed-search-live-suggestions';
import { parseTypedSearch } from './typed-search-parser';

vi.mock('@immich/sdk', async () => ({
  ...(await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk')),
  getAllPeople: vi.fn(),
  getFilterSuggestions: vi.fn(),
  getSearchSuggestions: vi.fn(),
  searchPerson: vi.fn(),
}));

describe('resolveLiveTypedSearchSuggestions foundation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns idle for unsupported typed tokens', async () => {
    const parsed = parseTypedSearch('camera:nik', { mode: 'draft' });

    await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
      status: 'idle',
    });
  });

  it('searches people by active person token value with stable choice spans', async () => {
    vi.mocked(searchPerson).mockResolvedValue([
      { id: 'person-1', name: 'Anna Maria' },
      { id: 'person-2', name: 'Annika' },
    ] as never);
    const parsed = parseTypedSearch('beach person:ann', { mode: 'draft' });

    const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] });

    expect(searchPerson).toHaveBeenCalledWith(
      { name: 'ann', withHidden: false, withSharedSpaces: true },
      expect.anything(),
    );
    expect(result).toEqual({
      status: 'ok',
      key: 'person',
      total: 2,
      items: [
        expect.objectContaining({
          id: 'person:6:16:person-1',
          key: 'person',
          label: 'Anna Maria',
          value: 'Anna Maria',
          tokenStart: 6,
          tokenEnd: 16,
          entityId: 'person-1',
        }),
        expect.objectContaining({ key: 'person', label: 'Annika', value: 'Annika', entityId: 'person-2' }),
      ],
    });
  });

  it('loads initial named people suggestions for empty person token without UUID fallbacks', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [
        { id: 'person:person-1', name: 'Zoe' },
        { id: '6bdf1ca5-a47d-4a3b-b3cc-ed81e9e98ce8', name: '' },
      ],
      countries: [],
      cameraMakes: [],
      tags: [],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: true,
    } as never);
    const parsed = parseTypedSearch('person:', { mode: 'draft' });

    const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] });

    expect(getAllPeople).not.toHaveBeenCalled();
    expect(getFilterSuggestions).toHaveBeenCalledWith({ withSharedSpaces: true }, expect.anything());
    expect(result).toMatchObject({ status: 'ok', key: 'person', total: 1 });
    if (result.status === 'ok') {
      expect(result.items).toEqual([
        expect.objectContaining({
          label: 'Zoe',
          value: 'Zoe',
          entityId: 'person:person-1',
        }),
      ]);
      expect(result.items.map((item) => item.label)).not.toContain('6bdf1ca5-a47d-4a3b-b3cc-ed81e9e98ce8');
    }
  });

  it('uses scoped person filter tokens for global searched people', async () => {
    vi.mocked(searchPerson).mockResolvedValue([
      {
        id: 'identity-group-1',
        filterId: 'person:person-1',
        name: 'Anna',
        primaryProfile: { type: 'user-person', id: 'person-1' },
      },
    ] as never);
    const parsed = parseTypedSearch('person:ann', { mode: 'draft' });

    const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] });

    expect(result).toMatchObject({ status: 'ok', key: 'person', total: 1 });
    if (result.status === 'ok') {
      expect(result.items[0]).toMatchObject({
        label: 'Anna',
        value: 'Anna',
        entityId: 'person:person-1',
      });
      expect(result.items[0].entityId).not.toBe('identity-group-1');
    }
  });

  it('uses space-scoped people suggestions when spaceId is present', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [
        { id: 'space-person-1', name: 'Anna Space' },
        { id: 'space-person-2', name: 'Beth Space' },
      ],
      countries: [],
      cameraMakes: [],
      tags: [],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    } as never);
    const parsed = parseTypedSearch('person:ann', { mode: 'draft' });

    const result = await resolveLiveTypedSearchSuggestions({
      parsed,
      activeToken: parsed.tokens[0],
      spaceId: 'space-1',
    });

    expect(getFilterSuggestions).toHaveBeenCalledWith({ spaceId: 'space-1' }, expect.anything());
    expect(result).toMatchObject({ status: 'ok', key: 'person', total: 1 });
    if (result.status === 'ok') {
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ entityId: 'space-person-1', label: 'Anna Space' });
    }
  });

  it('returns empty when no people match', async () => {
    vi.mocked(searchPerson).mockResolvedValue([]);
    const parsed = parseTypedSearch('person:zzzz', { mode: 'draft' });

    await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
      status: 'empty',
      key: 'person',
    });
  });

  it('returns a quiet live error when person suggestions fail', async () => {
    vi.mocked(searchPerson).mockRejectedValue(new Error('network down'));
    const parsed = parseTypedSearch('person:ann', { mode: 'draft' });

    await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
      status: 'error',
      key: 'person',
      message: 'network down',
    });
  });

  it('rethrows AbortError from person suggestions', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    vi.mocked(searchPerson).mockRejectedValue(abortError);
    const parsed = parseTypedSearch('person:ann', { mode: 'draft' });

    await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).rejects.toBe(abortError);
  });

  it('loads initial tag suggestions for an empty tag token', async () => {
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
    } as never);
    const parsed = parseTypedSearch('tag:', { mode: 'draft' });

    const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] });

    expect(getFilterSuggestions).toHaveBeenCalledWith({ withSharedSpaces: true }, expect.anything());
    expect(result).toEqual({
      status: 'ok',
      key: 'tag',
      total: 2,
      items: [
        expect.objectContaining({ key: 'tag', label: 'Travel', value: 'Travel', entityId: 'tag-1' }),
        expect.objectContaining({ key: 'tag', label: 'Family', value: 'Family', entityId: 'tag-2' }),
      ],
    });
  });

  it('narrows tag suggestions by the active tag token value', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: [],
      cameraMakes: [],
      tags: [
        { id: 'tag-1', value: 'Travel' },
        { id: 'tag-2', value: 'Work' },
        { id: 'tag-3', value: 'Family/Travel' },
      ],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    } as never);
    const parsed = parseTypedSearch('beach tag:trav', { mode: 'draft' });

    const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] });

    expect(result).toMatchObject({ status: 'ok', key: 'tag', total: 2 });
    if (result.status === 'ok') {
      expect(result.items.map((item) => item.label)).toEqual(['Travel', 'Family/Travel']);
    }
  });

  it('uses space-scoped tag suggestions when spaceId is present', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: [],
      cameraMakes: [],
      tags: [{ id: 'space-tag-1', value: 'Shared Travel' }],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    } as never);
    const parsed = parseTypedSearch('tag:travel', { mode: 'draft' });

    const result = await resolveLiveTypedSearchSuggestions({
      parsed,
      activeToken: parsed.tokens[0],
      spaceId: 'space-1',
    });

    expect(getFilterSuggestions).toHaveBeenCalledWith({ spaceId: 'space-1' }, expect.anything());
    expect(result).toMatchObject({ status: 'ok', key: 'tag' });
  });

  it('returns empty when no tags match the active token', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: [],
      cameraMakes: [],
      tags: [{ id: 'tag-1', value: 'Travel' }],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    } as never);
    const parsed = parseTypedSearch('tag:zzzz', { mode: 'draft' });

    await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
      status: 'empty',
      key: 'tag',
    });
  });

  it('returns a quiet live error when tag suggestions fail', async () => {
    vi.mocked(getFilterSuggestions).mockRejectedValue(new Error('network down'));
    const parsed = parseTypedSearch('tag:travel', { mode: 'draft' });

    await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
      status: 'error',
      key: 'tag',
      message: 'network down',
    });
  });

  it('loads initial country suggestions for an empty country token', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: ['Germany', 'France', 'United States'],
      cameraMakes: [],
      tags: [],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    } as never);
    const parsed = parseTypedSearch('country:', { mode: 'draft' });

    const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] });

    expect(getFilterSuggestions).toHaveBeenCalledWith({ withSharedSpaces: true }, expect.anything());
    expect(result).toEqual({
      status: 'ok',
      key: 'country',
      total: 3,
      items: [
        expect.objectContaining({ key: 'country', label: 'Germany', value: 'Germany' }),
        expect.objectContaining({ key: 'country', label: 'France', value: 'France' }),
        expect.objectContaining({ key: 'country', label: 'United States', value: 'United States' }),
      ],
    });
  });

  it('narrows country suggestions by the active country token value', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: ['Germany', 'Georgia', 'France'],
      cameraMakes: [],
      tags: [],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    } as never);
    const parsed = parseTypedSearch('country:ge', { mode: 'draft' });

    const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] });

    expect(result).toMatchObject({ status: 'ok', key: 'country', total: 2 });
    if (result.status === 'ok') {
      expect(result.items.map((item) => item.value)).toEqual(['Germany', 'Georgia']);
    }
  });

  it('returns empty when country suggestions have no matches', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: ['Germany'],
      cameraMakes: [],
      tags: [],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    } as never);
    const parsed = parseTypedSearch('country:zzzz', { mode: 'draft' });

    await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
      status: 'empty',
      key: 'country',
    });
  });

  it('returns a quiet live error when country suggestions fail', async () => {
    vi.mocked(getFilterSuggestions).mockRejectedValue(new Error('network down'));
    const parsed = parseTypedSearch('country:ge', { mode: 'draft' });

    await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
      status: 'error',
      key: 'country',
      message: 'network down',
    });
  });

  it('loads city suggestions for an empty city token', async () => {
    vi.mocked(getSearchSuggestions).mockResolvedValue(['Paris', 'Berlin'] as never);
    const parsed = parseTypedSearch('city:', { mode: 'draft' });

    const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] });

    expect(getSearchSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ $type: SearchSuggestionType.City, withSharedSpaces: true }),
      expect.anything(),
    );
    expect(result).toEqual({
      status: 'ok',
      key: 'city',
      total: 2,
      items: [
        expect.objectContaining({ key: 'city', label: 'Paris', value: 'Paris' }),
        expect.objectContaining({ key: 'city', label: 'Berlin', value: 'Berlin' }),
      ],
    });
  });

  it('loads city suggestions for a non-empty city token without adding a country', async () => {
    vi.mocked(getSearchSuggestions).mockResolvedValue(['Paris', 'Parikia'] as never);
    const parsed = parseTypedSearch('city:par', { mode: 'draft' });

    const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] });

    expect(getSearchSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ $type: SearchSuggestionType.City, withSharedSpaces: true }),
      expect.anything(),
    );
    expect(result).toEqual({
      status: 'ok',
      key: 'city',
      total: 2,
      items: [
        expect.objectContaining({ key: 'city', label: 'Paris', value: 'Paris' }),
        expect.objectContaining({ key: 'city', label: 'Parikia', value: 'Parikia' }),
      ],
    });
  });

  it('scopes city suggestions to an existing country token with canonical country casing', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: ['Germany'],
      cameraMakes: [],
      tags: [],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    } as never);
    vi.mocked(getSearchSuggestions).mockResolvedValue(['Berlin'] as never);
    const parsed = parseTypedSearch('country:germany city:ber', { mode: 'draft' });

    const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[1] });

    expect(getSearchSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ $type: SearchSuggestionType.City, country: 'Germany', withSharedSpaces: true }),
      expect.anything(),
    );
    expect(result).toMatchObject({ status: 'ok', key: 'city' });
    if (result.status === 'ok') {
      expect(result.items[0]).toMatchObject({ key: 'city', label: 'Berlin', value: 'Berlin' });
    }
  });

  it('returns empty when no cities match', async () => {
    vi.mocked(getSearchSuggestions).mockResolvedValue([] as never);
    const parsed = parseTypedSearch('city:zzzz', { mode: 'draft' });

    await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
      status: 'empty',
      key: 'city',
    });
  });

  it('returns a quiet live error when city suggestions fail', async () => {
    vi.mocked(getSearchSuggestions).mockRejectedValue(new Error('network down'));
    const parsed = parseTypedSearch('city:par', { mode: 'draft' });

    await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
      status: 'error',
      key: 'city',
      message: 'network down',
    });
  });
});

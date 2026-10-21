import { AssetTypeEnum, AssetVisibility } from '@immich/sdk';
import { goto } from '$app/navigation';
import { searchManager } from '$lib/managers/search-manager.svelte';
import { Route } from '$lib/route';
import type { SearchQuery } from '$lib/types';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

describe('SearchManager', () => {
  beforeEach(() => {
    localStorage.clear();
    searchManager.reset();
  });

  it('defaults to smart search', () => {
    expect(searchManager.filter.queryType).toBe('smart');
  });

  it('remembers the selected query type', () => {
    searchManager.setQueryType('metadata');
    expect(searchManager.filter.queryType).toBe('metadata');

    searchManager.reset();
    expect(searchManager.filter.queryType).toBe('metadata');
  });

  it('overrides a previously stored query type', () => {
    localStorage.setItem('searchQueryType', 'metadata');
    searchManager.reset();

    searchManager.setQueryType('smart');
    searchManager.reset();
    expect(searchManager.filter.queryType).toBe('smart');
  });

  it('ignores an invalid stored query type', () => {
    localStorage.setItem('searchQueryType', 'invalid');
    searchManager.reset();
    expect(searchManager.filter.queryType).toBe('smart');
  });

  it('round-trips a smart search query through the form state', async () => {
    const query: SearchQuery = {
      query: 'beach',
      filter: {
        country: { eq: 'Germany' },
        city: { eq: null },
        lensModel: { eq: 'EF 50mm' },
        visibility: { eq: AssetVisibility.Archive },
        isFavorite: { eq: true },
        hasAlbums: { eq: false },
        personIds: { all: ['person-1'] },
        hasTags: { eq: false },
        type: { eq: AssetTypeEnum.Video },
        rating: { eq: null },
      },
    };

    searchManager.setQuery(query);
    await searchManager.submit();

    expect(goto).toHaveBeenCalledWith(Route.search(query));
  });

  it('maps the query text by query type', async () => {
    searchManager.setQuery({ filter: { originalPath: { like: '/2024/' } } });
    expect(searchManager.filter.queryType).toBe('fullPath');

    searchManager.setQueryType('description');
    await searchManager.submit();

    expect(goto).toHaveBeenCalledWith(Route.search({ filter: { description: { like: '/2024/' } } }));
  });

  it('submits without a filter when nothing is set', async () => {
    await searchManager.submit();

    expect(goto).toHaveBeenCalledWith('/search');
  });
});

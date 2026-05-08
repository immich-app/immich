import { createFilterState } from '$lib/components/filter-panel/filter-panel';
import {
  buildSearchablePageUrl,
  clearSearchablePageFilterParams,
  getSearchablePageFilterState,
  getSearchablePageState,
  preserveTransientTemporalFilters,
} from '$lib/utils/searchable-page-search';
import { describe, expect, it } from 'vitest';

describe('searchable page URL state', () => {
  it('detects photos as a searchable page', () => {
    const state = getSearchablePageState(new URL('https://gallery.test/photos?q=beach'));

    expect(state).toMatchObject({
      basePath: '/photos',
      isSearchable: true,
      query: 'beach',
      sortOrder: 'relevance',
    });
  });

  it('detects spaces and space photos as searchable pages', () => {
    expect(getSearchablePageState(new URL('https://gallery.test/spaces/space-1')).basePath).toBe('/spaces/space-1');
    expect(getSearchablePageState(new URL('https://gallery.test/spaces/space-1/photos')).basePath).toBe(
      '/spaces/space-1/photos',
    );
  });

  it('builds the existing query-only URL without filters', () => {
    const url = new URL('https://gallery.test/photos?view=timeline');

    expect(buildSearchablePageUrl(url, 'beach')).toBe('/photos?view=timeline&q=beach');
  });

  it('preserves existing typed filter params when no replacement filter state is supplied', () => {
    const url = new URL('https://gallery.test/photos?q=beach&people=person-1&city=Berlin&view=timeline');

    expect(buildSearchablePageUrl(url, 'sunset', 'asc')).toBe(
      '/photos?q=sunset&people=person-1&city=Berlin&view=timeline&sort=asc',
    );
  });
});

describe('typed filter URL state', () => {
  it('serializes typed filters into photos URLs while preserving query and sort', () => {
    const url = new URL('https://gallery.test/photos?view=timeline');
    const filters = {
      ...createFilterState(),
      personIds: ['person-1', 'person-2'],
      tagIds: ['tag-1'],
      city: 'Berlin',
      country: 'Germany',
      make: 'Nikon',
      model: 'Z8',
      mediaType: 'image' as const,
      isFavorite: true,
      isNotInAlbum: true,
      rating: 4,
      dateAfter: '2025-01-01',
      dateBefore: '2026-12-31',
      sortOrder: 'asc' as const,
    };

    const result = buildSearchablePageUrl(url, 'beach', 'asc', filters);

    expect(result).toBe(
      '/photos?view=timeline&q=beach&sort=asc&people=person-1%2Cperson-2&tags=tag-1&city=Berlin&country=Germany&make=Nikon&model=Z8&type=image&favorite=true&album=none&rating=4&from=2025-01-01&to=2026-12-31',
    );
  });

  it('omits has-no-album from URLs when false', () => {
    const url = new URL('https://gallery.test/photos');
    const filters = { ...createFilterState(), isNotInAlbum: false };

    expect(buildSearchablePageUrl(url, '', 'desc', filters)).toBe('/photos?sort=desc');
  });

  it('serializes typed filters into space URLs', () => {
    const url = new URL('https://gallery.test/spaces/space-1/photos?panel=closed');
    const filters = {
      ...createFilterState(),
      city: 'Berlin',
      mediaType: 'video' as const,
      sortOrder: 'relevance' as const,
    };

    const result = buildSearchablePageUrl(url, 'beach', 'relevance', filters);

    expect(result).toBe('/spaces/space-1/photos?panel=closed&q=beach&city=Berlin&type=video');
  });

  it('hydrates typed filter params into FilterState', () => {
    const url = new URL(
      'https://gallery.test/photos?q=beach&people=person-1%2Cperson-2&tags=tag-1&type=video&favorite=false&album=none&rating=5&from=2025-01-01&to=2026-12-31',
    );

    expect(getSearchablePageFilterState(url)).toEqual({
      personIds: ['person-1', 'person-2'],
      tagIds: ['tag-1'],
      mediaType: 'video',
      isFavorite: false,
      isNotInAlbum: true,
      rating: 5,
      dateAfter: '2025-01-01',
      dateBefore: '2026-12-31',
    });
  });

  it('drops invalid typed filter URL params without crashing', () => {
    const url = new URL(
      'https://gallery.test/photos?type=gif&favorite=maybe&album=all&rating=9&from=soon&to=2026-99-01',
    );

    expect(getSearchablePageFilterState(url)).toEqual({});
  });

  it('preserves transient selected year and month while hydrating URL-backed filters', () => {
    const urlFilters = getSearchablePageFilterState(new URL('https://gallery.test/photos?city=Berlin'));

    expect(preserveTransientTemporalFilters(urlFilters, { selectedYear: 2023, selectedMonth: 6 })).toEqual({
      city: 'Berlin',
      selectedYear: 2023,
      selectedMonth: 6,
    });
  });

  it('does not preserve transient year selection over an explicit custom date range', () => {
    const urlFilters = getSearchablePageFilterState(new URL('https://gallery.test/photos?from=2024-01-01'));

    expect(preserveTransientTemporalFilters(urlFilters, { selectedYear: 2023, selectedMonth: 6 })).toEqual({
      dateAfter: '2024-01-01',
    });
  });

  it('clears only typed filter params', () => {
    const params = new URLSearchParams('q=beach&sort=desc&people=p1&city=Berlin&album=none&view=timeline');

    clearSearchablePageFilterParams(params);

    expect(params.toString()).toBe('q=beach&sort=desc&view=timeline');
  });
});

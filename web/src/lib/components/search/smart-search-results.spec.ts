import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import type { FilterState } from '$lib/components/filter-panel/filter-panel';
import SmartSearchResults from '$lib/components/search/smart-search-results.svelte';
import { SEARCH_FILTER_DEBOUNCE_MS } from '$lib/utils/space-search';
import { AssetOrder } from '@immich/sdk';
import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const searchSmartMock = vi.fn();
vi.mock('@immich/sdk', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, searchSmart: (...args: unknown[]) => searchSmartMock(...args) };
});

const baseFilters: FilterState = {
  personIds: [],
  tagIds: [],
  mediaType: 'all',
  sortOrder: 'relevance',
};

const baseProps = {
  searchQuery: 'beach',
  filters: baseFilters,
  isShared: false,
  withSharedSpaces: true,
  language: 'en',
};

const mockEmptyResult = { assets: { items: [], nextPage: null } };

describe('SmartSearchResults', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    searchSmartMock.mockReset();
    searchSmartMock.mockResolvedValue(mockEmptyResult);
  });

  // Test 38
  it('schedules exactly one fetch on mount with non-empty query', async () => {
    render(SmartSearchResults, { props: baseProps });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);
    expect(searchSmartMock).toHaveBeenCalledTimes(1);
  });

  // Test 39
  it('does not fetch on mount with empty query', async () => {
    render(SmartSearchResults, { props: { ...baseProps, searchQuery: '' } });
    await vi.advanceTimersByTimeAsync(500);
    expect(searchSmartMock).not.toHaveBeenCalled();
  });

  // Test 40
  it('triggers a new fetch when searchQuery changes, aborting the previous', async () => {
    const { rerender } = render(SmartSearchResults, { props: baseProps });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);
    expect(searchSmartMock).toHaveBeenCalledTimes(1);

    await rerender({ ...baseProps, searchQuery: 'mountain' });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);
    expect(searchSmartMock).toHaveBeenCalledTimes(2);
    // Verify the second call had the new query
    expect(searchSmartMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ smartSearchDto: expect.objectContaining({ query: 'mountain' }) }),
    );
  });

  // Test 41
  it('triggers a debounced re-fetch when filters change', async () => {
    const { rerender } = render(SmartSearchResults, { props: baseProps });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);
    expect(searchSmartMock).toHaveBeenCalledTimes(1);

    await rerender({ ...baseProps, filters: { ...baseFilters, city: 'Berlin' } });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);
    expect(searchSmartMock).toHaveBeenCalledTimes(2);
    expect(searchSmartMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ smartSearchDto: expect.objectContaining({ city: 'Berlin' }) }),
    );
  });

  it('forwards language and refetches when language changes', async () => {
    const { rerender } = render(SmartSearchResults, { props: baseProps });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);

    expect(searchSmartMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ smartSearchDto: expect.objectContaining({ language: 'en' }) }),
    );

    await rerender({ ...baseProps, language: 'de' });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);

    expect(searchSmartMock).toHaveBeenCalledTimes(2);
    expect(searchSmartMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ smartSearchDto: expect.objectContaining({ language: 'de' }) }),
    );
  });

  it('triggers re-fetch when custom date range changes', async () => {
    const { rerender } = render(SmartSearchResults, { props: baseProps });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);
    expect(searchSmartMock).toHaveBeenCalledTimes(1);

    await rerender({ ...baseProps, filters: { ...baseFilters, dateAfter: '2024-01-01' } });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);

    expect(searchSmartMock).toHaveBeenCalledTimes(2);
    expect(searchSmartMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        smartSearchDto: expect.objectContaining({ takenAfter: '2024-01-01T00:00:00.000Z' }),
      }),
    );
  });

  // Test 42
  it('debounces multiple consecutive filter changes within the window into a single fetch', async () => {
    const { rerender } = render(SmartSearchResults, { props: baseProps });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);
    expect(searchSmartMock).toHaveBeenCalledTimes(1);

    // 5 rapid filter changes within the debounce window
    for (let i = 0; i < 5; i++) {
      await rerender({ ...baseProps, filters: { ...baseFilters, rating: i + 1 } });
      await vi.advanceTimersByTimeAsync(50); // < debounce window
    }
    // Final advance past the debounce window
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);

    // Initial mount (1) + one debounced fetch (1) = 2 total
    expect(searchSmartMock).toHaveBeenCalledTimes(2);
  });

  // Test 43
  it('debounce boundary: 249ms does not fire, 250ms does', async () => {
    const { rerender } = render(SmartSearchResults, { props: baseProps });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);
    expect(searchSmartMock).toHaveBeenCalledTimes(1);

    await rerender({ ...baseProps, filters: { ...baseFilters, city: 'Berlin' } });
    await vi.advanceTimersByTimeAsync(249);
    expect(searchSmartMock).toHaveBeenCalledTimes(1); // not yet
    await vi.advanceTimersByTimeAsync(1);
    expect(searchSmartMock).toHaveBeenCalledTimes(2); // now
  });

  // Test 44
  it('does not fetch when filters change while searchQuery is empty', async () => {
    const { rerender } = render(SmartSearchResults, { props: { ...baseProps, searchQuery: '' } });
    await rerender({ ...baseProps, searchQuery: '', filters: { ...baseFilters, city: 'Berlin' } });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);
    expect(searchSmartMock).not.toHaveBeenCalled();
  });

  // Test 45
  it('triggers re-fetch with order=Asc when sortOrder changes from relevance to asc', async () => {
    const { rerender } = render(SmartSearchResults, { props: baseProps });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);

    await rerender({ ...baseProps, filters: { ...baseFilters, sortOrder: 'asc' } });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);

    expect(searchSmartMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ smartSearchDto: expect.objectContaining({ order: AssetOrder.Asc }) }),
    );
  });

  // Test 46
  it('triggers re-fetch with order omitted when sortOrder changes from asc to relevance', async () => {
    const { rerender } = render(SmartSearchResults, {
      props: { ...baseProps, filters: { ...baseFilters, sortOrder: 'asc' } },
    });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);

    await rerender({ ...baseProps, filters: { ...baseFilters, sortOrder: 'relevance' } });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);

    const lastCall = searchSmartMock.mock.lastCall;
    expect(lastCall).toBeDefined();
    expect(lastCall![0].smartSearchDto.order).toBeUndefined();
  });

  // Test 47 — loadMore (requires triggering the dumb grid's IntersectionObserver or direct invocation)
  // The exact mechanism depends on whether onLoadMore is exposed; you may need to grab the prop
  // off the rendered SpaceSearchResults via a test export, or simulate the IntersectionObserver
  // entry firing. See the existing space-search-results.spec.ts for patterns.
  it.todo('loadMore fetches the next page and appends results');

  // Test 48
  it.todo('loadMore does nothing when hasMore is false');

  // Test 49
  it.todo('loadMore while another loadMore is in flight: abort first, second wins');

  // Test 50
  it.todo('concurrent submit: query A in flight, query B submitted, B wins');

  // Test 51
  it.todo('submit while loadMore in flight: loadMore aborted, restart from page 1');

  // Test 52 — cooperative abort on unmount, NOT SDK signal propagation.
  // The wrapper uses cooperative abort (checks `controller.signal.aborted` *after*
  // the await and discards stale results). A meaningful assertion would need to
  // observe that `searchResults`/`isLoading` don't change after unmount, but
  // Svelte 5's runtime tolerates writes to unmounted state and there's no
  // observable signal via testing-library to catch a silent write. Covered
  // indirectly by the E2E abort behavior. Left as todo until we can spy on
  // an observable side effect.
  it.todo('discards results from in-flight request after wrapper unmounts');

  // Test 53
  it('catches backend errors and surfaces empty results without crashing', async () => {
    searchSmartMock.mockRejectedValueOnce(new Error('Smart search is not enabled'));
    render(SmartSearchResults, { props: baseProps });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);
    // No exception thrown, component still rendered
    expect(searchSmartMock).toHaveBeenCalledTimes(1);
  });

  // Test 54
  it('handles empty results (0 items) without crashing', async () => {
    searchSmartMock.mockResolvedValue(mockEmptyResult);
    render(SmartSearchResults, { props: baseProps });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);
    // Should render the dumb grid with 0 results
  });

  // Test 55
  it('forwards spaceId to buildSmartSearchParams when set', async () => {
    render(SmartSearchResults, { props: { ...baseProps, spaceId: 'space-1', withSharedSpaces: undefined } });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);
    expect(searchSmartMock).toHaveBeenCalledWith(
      expect.objectContaining({ smartSearchDto: expect.objectContaining({ spaceId: 'space-1' }) }),
    );
  });

  // Test 56
  it('forwards withSharedSpaces to buildSmartSearchParams when spaceId is undefined', async () => {
    render(SmartSearchResults, { props: { ...baseProps, withSharedSpaces: true } });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);
    expect(searchSmartMock).toHaveBeenCalledWith(
      expect.objectContaining({ smartSearchDto: expect.objectContaining({ withSharedSpaces: true }) }),
    );
  });

  it('forwards route-provided exact total to the result grid', async () => {
    searchSmartMock.mockResolvedValueOnce({
      assets: {
        items: [{ id: 'asset-1', originalFileName: 'photo.jpg' }],
        nextPage: '2',
      },
    });

    const { getByTestId } = render(SmartSearchResults, { props: { ...baseProps, total: 42 } });
    await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);

    expect(getByTestId('result-count')).toHaveTextContent('42 results');
  });

  // Test 57 — render assertion for isShared on the dumb grid
  it.todo('forwards isShared prop to the dumb grid render');

  // Test 57b — bindable isLoading
  it.todo('isLoading $bindable propagates to parent before/after fetch');
});

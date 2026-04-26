import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { FilterContext, FilterPanelConfig, FilterSuggestionsResponse } from '../filter-panel';
import FilterPanel from '../filter-panel.svelte';

function createConfig(overrides: Partial<NonNullable<FilterPanelConfig['providers']>> = {}): FilterPanelConfig {
  return {
    sections: ['timeline', 'people', 'location', 'camera', 'tags'],
    providers: {
      people: vi.fn().mockResolvedValue([
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ]),
      locations: vi.fn().mockResolvedValue([
        { value: 'Germany', type: 'country' as const },
        { value: 'France', type: 'country' as const },
      ]),
      cameras: vi.fn().mockResolvedValue([
        { value: 'Canon', type: 'make' as const },
        { value: 'Sony', type: 'make' as const },
      ]),
      tags: vi.fn().mockResolvedValue([
        { id: 't1', name: 'Vacation' },
        { id: 't2', name: 'Family' },
      ]),
      ...overrides,
    },
  };
}

const timeBuckets = [
  { timeBucket: '2023-06-01', count: 100 },
  { timeBucket: '2023-08-01', count: 200 },
  { timeBucket: '2024-03-01', count: 50 },
];

const defaultSuggestions: FilterSuggestionsResponse = {
  countries: ['Germany', 'France'],
  cameraMakes: ['Canon', 'Sony'],
  tags: [
    { id: 't1', name: 'Vacation' },
    { id: 't2', name: 'Family' },
  ],
  people: [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
  ],
  ratings: [3, 4, 5],
  mediaTypes: ['IMAGE', 'VIDEO'],
  hasUnnamedPeople: false,
};

describe('Contextual re-fetch on temporal change', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should re-fetch providers with temporal context when a year is selected', async () => {
    const config = createConfig();
    render(FilterPanel, {
      props: { config, timeBuckets },
    });

    await vi.advanceTimersByTimeAsync(0);

    expect(config.providers!.people).toHaveBeenCalledTimes(1);
    expect(config.providers!.locations).toHaveBeenCalledTimes(1);
    expect(config.providers!.cameras).toHaveBeenCalledTimes(1);

    // Click year to select 2023
    await fireEvent.click(screen.getByTestId('year-btn-2023'));

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(250);

    const expectedContext: FilterContext = {
      takenAfter: '2023-01-01T00:00:00.000Z',
      takenBefore: '2024-01-01T00:00:00.000Z',
    };

    await waitFor(() => {
      expect(config.providers!.people).toHaveBeenCalledTimes(2);
      expect(config.providers!.people).toHaveBeenLastCalledWith(expectedContext);
      expect(config.providers!.locations).toHaveBeenLastCalledWith(expectedContext);
      expect(config.providers!.cameras).toHaveBeenLastCalledWith(expectedContext);
      expect(config.providers!.tags).toHaveBeenCalledTimes(2);
      expect(config.providers!.tags).toHaveBeenLastCalledWith(expectedContext);
    });
  });

  it('should re-fetch tags with temporal context when a year is selected', async () => {
    const config = createConfig();
    render(FilterPanel, {
      props: { config, timeBuckets },
    });

    await vi.advanceTimersByTimeAsync(0);

    expect(config.providers!.tags).toHaveBeenCalledTimes(1);

    // Click year to select 2023
    await fireEvent.click(screen.getByTestId('year-btn-2023'));

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(250);

    const expectedContext: FilterContext = {
      takenAfter: '2023-01-01T00:00:00.000Z',
      takenBefore: '2024-01-01T00:00:00.000Z',
    };

    await waitFor(() => {
      expect(config.providers!.tags).toHaveBeenCalledTimes(2);
      expect(config.providers!.tags).toHaveBeenLastCalledWith(expectedContext);
    });
  });

  it('should re-fetch with full-year bounds when only year is selected', async () => {
    const config = createConfig();
    render(FilterPanel, {
      props: { config, timeBuckets },
    });

    await vi.advanceTimersByTimeAsync(0);

    await fireEvent.click(screen.getByTestId('year-btn-2024'));
    await vi.advanceTimersByTimeAsync(250);

    await waitFor(() => {
      expect(config.providers!.people).toHaveBeenLastCalledWith({
        takenAfter: '2024-01-01T00:00:00.000Z',
        takenBefore: '2025-01-01T00:00:00.000Z',
      });
    });
  });

  it('should debounce rapid temporal changes — year then quickly month yields limited calls', async () => {
    const config = createConfig();
    render(FilterPanel, {
      props: { config, timeBuckets },
    });

    await vi.advanceTimersByTimeAsync(0);

    const initialCalls = (config.providers!.people as ReturnType<typeof vi.fn>).mock.calls.length;

    // Click year — this triggers a 200ms debounce for the year context
    await fireEvent.click(screen.getByTestId('year-btn-2023'));

    // Wait for the year debounce to fire
    await vi.advanceTimersByTimeAsync(250);

    // Now click month (month grid is visible after year selection)
    await fireEvent.click(screen.getByTestId('month-btn-6'));

    // Wait for month debounce
    await vi.advanceTimersByTimeAsync(250);

    await waitFor(() => {
      const finalCalls = (config.providers!.people as ReturnType<typeof vi.fn>).mock.calls.length;
      // Year triggers 1 re-fetch, month triggers another → exactly 2 extra
      expect(finalCalls - initialCalls).toBe(2);
    });
  });

  it('should NOT trigger re-fetch when non-temporal filters change', async () => {
    const config = createConfig();
    render(FilterPanel, {
      props: {
        config: { ...config, sections: ['people', 'rating', 'media'] },
        timeBuckets: [],
      },
    });

    await vi.advanceTimersByTimeAsync(0);

    const initialCalls = (config.providers!.people as ReturnType<typeof vi.fn>).mock.calls.length;

    // Advance time — no temporal change happens, so no re-fetch
    await vi.advanceTimersByTimeAsync(500);

    expect((config.providers!.people as ReturnType<typeof vi.fn>).mock.calls.length).toBe(initialCalls);
  });

  it('should bypass debounce on clear (immediate re-fetch with no context)', async () => {
    const config = createConfig();
    render(FilterPanel, {
      props: { config, timeBuckets },
    });

    await vi.advanceTimersByTimeAsync(0);

    // Select year first
    await fireEvent.click(screen.getByTestId('year-btn-2023'));
    await vi.advanceTimersByTimeAsync(250);

    const callsAfterYear = (config.providers!.people as ReturnType<typeof vi.fn>).mock.calls.length;

    // Click "All" breadcrumb to clear temporal filter
    await fireEvent.click(screen.getByTestId('temporal-breadcrumb-all'));

    // Advance just 1ms — clear should fire immediately (delay=0)
    await vi.advanceTimersByTimeAsync(1);

    await waitFor(() => {
      const finalCalls = (config.providers!.people as ReturnType<typeof vi.fn>).mock.calls.length;
      expect(finalCalls).toBeGreaterThan(callsAfterYear);
      expect(config.providers!.people).toHaveBeenLastCalledWith(undefined);
    });
  });

  it('should keep stale data on fetch error', async () => {
    const peopleFn = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'p1', name: 'Alice' }])
      .mockRejectedValueOnce(new Error('Network error'));

    const config = createConfig({ people: peopleFn });
    render(FilterPanel, {
      props: { config, timeBuckets },
    });

    await vi.advanceTimersByTimeAsync(0);

    await waitFor(() => {
      expect(screen.getByTestId('people-item-p1')).toBeTruthy();
    });

    // Select year to trigger re-fetch (which will fail)
    await fireEvent.click(screen.getByTestId('year-btn-2023'));
    await vi.advanceTimersByTimeAsync(250);

    // Allow promise rejection to settle
    await vi.advanceTimersByTimeAsync(0);

    // Stale data should still be visible
    expect(screen.getByTestId('people-item-p1')).toBeTruthy();
  });

  it('should produce correct UTC ISO strings for month temporal ranges', async () => {
    const config = createConfig();
    render(FilterPanel, {
      props: { config, timeBuckets },
    });

    await vi.advanceTimersByTimeAsync(0);

    // Select year first
    await fireEvent.click(screen.getByTestId('year-btn-2023'));
    await vi.advanceTimersByTimeAsync(250);

    // Now select month (August — month 8)
    await fireEvent.click(screen.getByTestId('month-btn-8'));
    await vi.advanceTimersByTimeAsync(250);

    await waitFor(() => {
      expect(config.providers!.people).toHaveBeenLastCalledWith({
        takenAfter: '2023-08-01T00:00:00.000Z',
        takenBefore: '2023-09-01T00:00:00.000Z',
      });
    });
  });

  it('should re-fetch unified suggestions when custom from date changes and narrow people and tags', async () => {
    const secondSuggestions: FilterSuggestionsResponse = {
      ...defaultSuggestions,
      people: [{ id: 'p1', name: 'Alice' }],
      tags: [{ id: 't1', name: 'Vacation' }],
    };
    const suggestionsProvider = vi
      .fn()
      .mockResolvedValueOnce(defaultSuggestions)
      .mockResolvedValueOnce(secondSuggestions);
    const config: FilterPanelConfig = {
      sections: ['timeline', 'people', 'tags'],
      suggestionsProvider,
    };

    render(FilterPanel, {
      props: { config, timeBuckets },
    });

    await vi.advanceTimersByTimeAsync(0);
    await waitFor(() => {
      expect(screen.getByTestId('people-item-p2')).toBeTruthy();
      expect(screen.getByTestId('tags-item-t2')).toBeTruthy();
    });

    await fireEvent.input(screen.getByTestId('custom-date-from-input'), { target: { value: '2024-01-01' } });
    await vi.advanceTimersByTimeAsync(200);

    await waitFor(() => {
      expect(suggestionsProvider).toHaveBeenCalledTimes(2);
      expect(suggestionsProvider).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dateAfter: '2024-01-01',
          dateBefore: undefined,
          selectedYear: undefined,
          selectedMonth: undefined,
        }),
      );
      expect(screen.getByTestId('people-item-p1')).toBeTruthy();
      expect(screen.queryByTestId('people-item-p2')).toBeNull();
      expect(screen.getByTestId('tags-item-t1')).toBeTruthy();
      expect(screen.queryByTestId('tags-item-t2')).toBeNull();
    });
  });

  it('should clear selected year when custom from date changes', async () => {
    const config = createConfig();
    render(FilterPanel, {
      props: { config, timeBuckets },
    });

    await vi.advanceTimersByTimeAsync(0);
    await fireEvent.click(screen.getByTestId('year-btn-2023'));
    await vi.advanceTimersByTimeAsync(250);
    expect(screen.getByTestId('month-grid')).toBeTruthy();

    await fireEvent.input(screen.getByTestId('custom-date-from-input'), { target: { value: '2024-01-01' } });
    await vi.advanceTimersByTimeAsync(250);

    await waitFor(() => {
      expect(screen.queryByTestId('month-grid')).toBeNull();
      expect(screen.getByTestId('year-grid')).toBeTruthy();
      expect(config.providers!.people).toHaveBeenLastCalledWith({
        takenAfter: '2024-01-01T00:00:00.000Z',
      });
    });
  });

  it('should clear selected year and month when custom to date changes', async () => {
    const config = createConfig();
    render(FilterPanel, {
      props: { config, timeBuckets },
    });

    await vi.advanceTimersByTimeAsync(0);
    await fireEvent.click(screen.getByTestId('year-btn-2023'));
    await vi.advanceTimersByTimeAsync(250);
    await fireEvent.click(screen.getByTestId('month-btn-8'));
    await vi.advanceTimersByTimeAsync(250);
    expect(screen.getByTestId('month-grid')).toBeTruthy();

    await fireEvent.input(screen.getByTestId('custom-date-to-input'), { target: { value: '2024-12-31' } });
    await vi.advanceTimersByTimeAsync(250);

    await waitFor(() => {
      expect(screen.queryByTestId('month-grid')).toBeNull();
      expect(screen.getByTestId('year-grid')).toBeTruthy();
      expect(config.providers!.people).toHaveBeenLastCalledWith({
        takenBefore: '2025-01-01T00:00:00.000Z',
      });
    });
  });

  it('should clear custom dates when selecting a year', async () => {
    const config = createConfig();
    render(FilterPanel, {
      props: { config, timeBuckets },
    });

    await vi.advanceTimersByTimeAsync(0);
    await fireEvent.input(screen.getByTestId('custom-date-from-input'), { target: { value: '2024-01-01' } });
    await fireEvent.input(screen.getByTestId('custom-date-to-input'), { target: { value: '2024-12-31' } });
    await vi.advanceTimersByTimeAsync(250);

    await fireEvent.click(screen.getByTestId('year-btn-2023'));
    await vi.advanceTimersByTimeAsync(250);

    await waitFor(() => {
      expect(screen.getByTestId('custom-date-from-input')).toHaveValue('');
      expect(screen.getByTestId('custom-date-to-input')).toHaveValue('');
      expect(config.providers!.people).toHaveBeenLastCalledWith({
        takenAfter: '2023-01-01T00:00:00.000Z',
        takenBefore: '2024-01-01T00:00:00.000Z',
      });
    });
  });

  it('should clear custom dates when selecting a month', async () => {
    const config = createConfig();
    render(FilterPanel, {
      props: {
        config,
        timeBuckets,
        filters: {
          personIds: [],
          tagIds: [],
          mediaType: 'all',
          sortOrder: 'desc',
          dateAfter: '2024-01-01',
          dateBefore: '2024-12-31',
          selectedYear: 2023,
        },
      },
    });

    await vi.advanceTimersByTimeAsync(0);
    await fireEvent.click(screen.getByTestId('month-btn-8'));
    await vi.advanceTimersByTimeAsync(250);

    await waitFor(() => {
      expect(screen.getByTestId('custom-date-from-input')).toHaveValue('');
      expect(screen.getByTestId('custom-date-to-input')).toHaveValue('');
      expect(config.providers!.people).toHaveBeenLastCalledWith({
        takenAfter: '2023-08-01T00:00:00.000Z',
        takenBefore: '2023-09-01T00:00:00.000Z',
      });
    });
  });

  it('should pass custom from date context to dependent city and camera model providers', async () => {
    const cities = vi.fn().mockResolvedValue(['Berlin']);
    const cameraModels = vi.fn().mockResolvedValue(['EOS R5']);
    const config = createConfig({ cities, cameraModels });
    render(FilterPanel, {
      props: { config, timeBuckets },
    });

    await vi.advanceTimersByTimeAsync(0);
    await fireEvent.input(screen.getByTestId('custom-date-from-input'), { target: { value: '2024-01-01' } });
    await vi.advanceTimersByTimeAsync(250);

    await fireEvent.click(screen.getByTestId('location-country-Germany'));
    await fireEvent.click(screen.getByTestId('camera-make-Canon'));

    await waitFor(() => {
      expect(cities).toHaveBeenLastCalledWith('Germany', {
        takenAfter: '2024-01-01T00:00:00.000Z',
      });
      expect(cameraModels).toHaveBeenLastCalledWith('Canon', {
        takenAfter: '2024-01-01T00:00:00.000Z',
      });
    });
  });

  it('should keep rating and media controls stable after custom date changes', async () => {
    const secondSuggestions: FilterSuggestionsResponse = {
      ...defaultSuggestions,
      ratings: [5],
      mediaTypes: ['IMAGE'],
    };
    const suggestionsProvider = vi
      .fn()
      .mockResolvedValueOnce(defaultSuggestions)
      .mockResolvedValueOnce(secondSuggestions);
    const config: FilterPanelConfig = {
      sections: ['timeline', 'rating', 'media'],
      suggestionsProvider,
    };

    render(FilterPanel, {
      props: { config, timeBuckets },
    });

    await vi.advanceTimersByTimeAsync(0);
    await waitFor(() => {
      expect(screen.getByTestId('rating-star-1')).toBeTruthy();
      expect(screen.getByTestId('media-type-video')).toBeTruthy();
    });

    await fireEvent.input(screen.getByTestId('custom-date-from-input'), { target: { value: '2024-01-01' } });
    await vi.advanceTimersByTimeAsync(200);

    await waitFor(() => {
      expect(suggestionsProvider).toHaveBeenCalledTimes(2);
      for (const star of [1, 2, 3, 4, 5]) {
        expect(screen.getByTestId(`rating-star-${star}`)).toBeTruthy();
      }
      expect(screen.getByTestId('media-type-image')).toBeTruthy();
      expect(screen.getByTestId('media-type-video')).toBeTruthy();
    });
  });
});

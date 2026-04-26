import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { FilterPanelConfig, FilterSuggestionsResponse } from '../filter-panel';
import FilterPanel from '../filter-panel.svelte';

const defaultResponse: FilterSuggestionsResponse = {
  countries: ['Germany', 'France'],
  cameraMakes: ['Canon', 'Sony'],
  tags: [
    { id: 't1', name: 'Vacation' },
    { id: 't2', name: 'Family' },
  ],
  people: [
    { id: 'p1', name: 'Alice', thumbnailUrl: '/people/p1/thumbnail' },
    { id: 'p2', name: 'Bob', thumbnailUrl: '/people/p2/thumbnail' },
  ],
  ratings: [3, 4, 5],
  mediaTypes: ['IMAGE', 'VIDEO'],
  hasUnnamedPeople: false,
};

const timeBuckets = [
  { timeBucket: '2023-06-01', count: 100 },
  { timeBucket: '2024-03-01', count: 50 },
];

function createUnifiedConfig(overrides: Partial<FilterPanelConfig> = {}): FilterPanelConfig {
  return {
    sections: ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media'],
    suggestionsProvider: vi.fn().mockResolvedValue(defaultResponse),
    ...overrides,
  };
}

describe('Unified suggestionsProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fire suggestionsProvider on initial mount with default state', async () => {
    const config = createUnifiedConfig();
    render(FilterPanel, { props: { config, timeBuckets } });

    await vi.advanceTimersByTimeAsync(0);

    await waitFor(() => {
      expect(config.suggestionsProvider).toHaveBeenCalledTimes(1);
      expect(config.suggestionsProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          personIds: [],
          tagIds: [],
          mediaType: 'all',
          sortOrder: 'desc',
        }),
      );
    });
  });

  it('should update suggestions in DOM after response', async () => {
    const config = createUnifiedConfig();
    render(FilterPanel, { props: { config, timeBuckets } });

    await vi.advanceTimersByTimeAsync(0);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('Germany')).toBeTruthy();
    });
  });

  it('should debounce discrete filter changes at 50ms', async () => {
    const config = createUnifiedConfig();
    render(FilterPanel, { props: { config, timeBuckets } });

    await vi.advanceTimersByTimeAsync(0);
    expect(config.suggestionsProvider).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(screen.getByText('Alice')).toBeTruthy());
    await fireEvent.click(screen.getByText('Alice'));

    expect(config.suggestionsProvider).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(50);

    await waitFor(() => {
      expect(config.suggestionsProvider).toHaveBeenCalledTimes(2);
    });
  });

  it('should debounce temporal changes at 200ms', async () => {
    const config = createUnifiedConfig();
    render(FilterPanel, { props: { config, timeBuckets } });

    await vi.advanceTimersByTimeAsync(0);

    await fireEvent.click(screen.getByTestId('year-btn-2023'));

    await vi.advanceTimersByTimeAsync(50);
    expect(config.suggestionsProvider).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(150);

    await waitFor(() => {
      expect(config.suggestionsProvider).toHaveBeenCalledTimes(2);
    });
  });

  it('should always show all 5 rating stars even when availableRatings is limited', async () => {
    const config = createUnifiedConfig({
      suggestionsProvider: vi.fn().mockResolvedValue({
        ...defaultResponse,
        ratings: [4, 5],
      }),
    });
    render(FilterPanel, { props: { config, timeBuckets } });

    await vi.advanceTimersByTimeAsync(0);

    await waitFor(() => {
      for (const star of [1, 2, 3, 4, 5]) {
        expect(screen.getByTestId(`rating-star-${star}`)).toBeTruthy();
      }
    });
  });

  it('should show all ratings when availableRatings is undefined (backward compat)', async () => {
    const config: FilterPanelConfig = {
      sections: ['rating'],
      providers: {},
    };
    render(FilterPanel, { props: { config, timeBuckets } });

    await vi.advanceTimersByTimeAsync(0);

    for (const star of [1, 2, 3, 4, 5]) {
      expect(screen.getByTestId(`rating-star-${star}`)).toBeTruthy();
    }
  });

  it('should fall back to providers-based behavior when suggestionsProvider is not set', async () => {
    const peopleProvider = vi.fn().mockResolvedValue([{ id: 'p1', name: 'Alice' }]);
    const config: FilterPanelConfig = {
      sections: ['people'],
      providers: {
        people: peopleProvider,
      },
    };
    render(FilterPanel, { props: { config, timeBuckets } });

    await vi.advanceTimersByTimeAsync(0);

    await waitFor(() => {
      expect(peopleProvider).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Alice')).toBeTruthy();
    });
  });

  it('should work with suggestionsProvider and no providers', async () => {
    const config: FilterPanelConfig = {
      sections: ['people', 'location'],
      suggestionsProvider: vi.fn().mockResolvedValue(defaultResponse),
    };
    render(FilterPanel, { props: { config, timeBuckets } });

    await vi.advanceTimersByTimeAsync(0);

    await waitFor(() => {
      expect(screen.getByText('Germany')).toBeTruthy();
    });
  });

  it('should pass active filters when fetching dependent cities', async () => {
    const citiesProvider = vi.fn().mockResolvedValue(['Berlin']);
    const config = createUnifiedConfig({
      providers: {
        cities: citiesProvider,
      },
    });
    render(FilterPanel, { props: { config, timeBuckets } });

    await vi.advanceTimersByTimeAsync(0);
    await waitFor(() => expect(screen.getByText('Alice')).toBeTruthy());

    await fireEvent.click(screen.getByTestId('people-item-p1'));
    await vi.advanceTimersByTimeAsync(50);
    await waitFor(() => expect(config.suggestionsProvider).toHaveBeenCalledTimes(2));

    await fireEvent.click(screen.getByTestId('location-country-Germany'));

    await waitFor(() => {
      expect(citiesProvider).toHaveBeenCalledWith(
        'Germany',
        expect.objectContaining({
          personIds: ['p1'],
        }),
      );
    });
  });
});

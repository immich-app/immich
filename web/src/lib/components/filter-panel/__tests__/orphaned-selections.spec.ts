import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { FilterPanelConfig } from '../filter-panel';
import { createFilterState } from '../filter-panel';
import FilterPanel from '../filter-panel.svelte';

describe('Orphaned selections', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.removeItem('gallery-filter-visible-sections');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show orphaned person at top of list with opacity-50 and aria-pressed', async () => {
    // Person p3 is selected but NOT in the people results
    const filters = createFilterState();
    filters.personIds = ['p3'];

    const config: FilterPanelConfig = {
      sections: ['people'],
      providers: {
        people: vi.fn().mockResolvedValue([
          { id: 'p1', name: 'Alice' },
          { id: 'p2', name: 'Bob' },
        ]),
      },
    };

    render(FilterPanel, {
      props: { config, timeBuckets: [], filters },
    });

    await vi.advanceTimersByTimeAsync(0);

    await waitFor(() => {
      expect(screen.getByTestId('people-item-p1')).toBeTruthy();
    });

    // p3 should be rendered as orphaned
    const orphanedItem = screen.getByTestId('people-item-p3');
    expect(orphanedItem).toBeTruthy();
    expect(orphanedItem.getAttribute('aria-pressed')).toBe('true');
    expect(orphanedItem.className).toContain('opacity-50');
  });

  it('should preserve orphaned selection in filter state when clicked', async () => {
    const filters = createFilterState();
    filters.personIds = ['p3', 'p1'];

    const config: FilterPanelConfig = {
      sections: ['people'],
      providers: {
        people: vi.fn().mockResolvedValue([
          { id: 'p1', name: 'Alice' },
          { id: 'p2', name: 'Bob' },
        ]),
      },
    };

    render(FilterPanel, {
      props: { config, timeBuckets: [], filters },
    });

    await vi.advanceTimersByTimeAsync(0);

    await waitFor(() => {
      expect(screen.getByTestId('people-item-p3')).toBeTruthy();
    });

    // Clicking orphaned item should deselect it
    await fireEvent.click(screen.getByTestId('people-item-p3'));

    // After deselection, orphaned item should disappear
    await waitFor(() => {
      expect(screen.queryByTestId('people-item-p3')).toBeNull();
    });
  });

  it('should show orphaned country at top of location list with opacity-50', async () => {
    const filters = createFilterState();
    filters.country = 'Japan';

    const config: FilterPanelConfig = {
      sections: ['location'],
      providers: {
        locations: vi.fn().mockResolvedValue([
          { value: 'Germany', type: 'country' as const },
          { value: 'France', type: 'country' as const },
        ]),
      },
    };

    render(FilterPanel, {
      props: { config, timeBuckets: [], filters },
    });

    await vi.advanceTimersByTimeAsync(0);

    await waitFor(() => {
      expect(screen.getByTestId('location-country-Germany')).toBeTruthy();
    });

    // Japan should be rendered as orphaned
    const orphanedItem = screen.getByTestId('location-country-Japan');
    expect(orphanedItem).toBeTruthy();
    expect(orphanedItem.getAttribute('aria-pressed')).toBe('true');
    expect(orphanedItem.className).toContain('opacity-50');
  });

  it('should show orphaned camera make at top of camera list with opacity-50', async () => {
    const filters = createFilterState();
    filters.make = 'Nikon';

    const config: FilterPanelConfig = {
      sections: ['camera'],
      providers: {
        cameras: vi.fn().mockResolvedValue([
          { value: 'Canon', type: 'make' as const },
          { value: 'Sony', type: 'make' as const },
        ]),
      },
    };

    render(FilterPanel, {
      props: { config, timeBuckets: [], filters },
    });

    await vi.advanceTimersByTimeAsync(0);

    await waitFor(() => {
      expect(screen.getByTestId('camera-make-Canon')).toBeTruthy();
    });

    // Nikon should be rendered as orphaned
    const orphanedItem = screen.getByTestId('camera-make-Nikon');
    expect(orphanedItem).toBeTruthy();
    expect(orphanedItem.getAttribute('aria-pressed')).toBe('true');
    expect(orphanedItem.className).toContain('opacity-50');
  });
});

describe('Empty section collapse', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.removeItem('gallery-filter-visible-sections');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show (0) text and collapse content when section has no items', async () => {
    const config: FilterPanelConfig = {
      sections: ['timeline', 'people'],
      providers: {
        people: vi.fn().mockResolvedValue([]),
      },
    };

    // Empty section collapse only activates when a temporal filter is applied
    const filters = {
      ...createFilterState(),
      selectedYear: 2024,
    };

    render(FilterPanel, {
      props: { config, timeBuckets: [{ timeBucket: '2024-06-01', count: 10 }], filters },
    });

    await vi.advanceTimersByTimeAsync(250);

    await waitFor(() => {
      const section = screen.getByTestId('filter-section-people');
      expect(section).toBeTruthy();
      // Should show "(0)" in the section header
      expect(section.textContent).toContain('(0)');
    });
  });

  it('should show section content when items exist after re-fetch', async () => {
    // Start empty, then temporal re-fetch returns data
    const peopleFn = vi
      .fn()
      .mockResolvedValueOnce([]) // initial load (no temporal)
      .mockResolvedValueOnce([]) // first re-fetch (temporal applied, still empty)
      .mockResolvedValueOnce([{ id: 'p1', name: 'Alice' }]); // second re-fetch (temporal cleared, has data)

    const config: FilterPanelConfig = {
      sections: ['timeline', 'people'],
      providers: {
        people: peopleFn,
      },
    };

    // Start with temporal filter so count is passed
    const filters = {
      ...createFilterState(),
      selectedYear: 2023,
    };

    render(FilterPanel, {
      props: {
        config,
        timeBuckets: [{ timeBucket: '2023-06-01', count: 100 }],
        filters,
      },
    });

    await vi.advanceTimersByTimeAsync(250);

    await waitFor(() => {
      const section = screen.getByTestId('filter-section-people');
      expect(section.textContent).toContain('(0)');
    });
  });

  it('should collapse section when it goes from populated to empty', async () => {
    const peopleFn = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'p1', name: 'Alice' }]) // initially populated
      .mockResolvedValueOnce([]); // after re-fetch, empty

    const config: FilterPanelConfig = {
      sections: ['timeline', 'people'],
      providers: {
        people: peopleFn,
      },
    };

    render(FilterPanel, {
      props: {
        config,
        timeBuckets: [{ timeBucket: '2023-06-01', count: 100 }],
      },
    });

    await vi.advanceTimersByTimeAsync(0);

    await waitFor(() => {
      expect(screen.getByTestId('people-item-p1')).toBeTruthy();
    });

    // Trigger re-fetch
    await fireEvent.click(screen.getByTestId('year-btn-2023'));
    await vi.advanceTimersByTimeAsync(250);

    await waitFor(() => {
      const section = screen.getByTestId('filter-section-people');
      expect(section.textContent).toContain('(0)');
    });
  });
});

describe('Cascade child auto-clear', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.removeItem('gallery-filter-visible-sections');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should auto-clear camera model when model disappears from re-fetched results', async () => {
    const modelsFn = vi
      .fn()
      .mockResolvedValueOnce(['X-T5', 'X-H2']) // initial models
      .mockResolvedValueOnce(['X-T5']); // after re-fetch, X-H2 is gone

    const filters = createFilterState();
    filters.make = 'Fujifilm';
    filters.model = 'X-H2';

    const config: FilterPanelConfig = {
      sections: ['camera'],
      providers: {
        cameras: vi.fn().mockResolvedValue([{ value: 'Fujifilm', type: 'make' as const }]),
        cameraModels: modelsFn,
      },
    };

    render(FilterPanel, {
      props: { config, timeBuckets: [], filters },
    });

    await vi.advanceTimersByTimeAsync(0);

    // Wait for initial camera load and expand
    await waitFor(() => {
      expect(screen.getByTestId('camera-make-Fujifilm')).toBeTruthy();
    });

    // Click make to expand and trigger model fetch
    await fireEvent.click(screen.getByTestId('camera-make-Fujifilm'));

    await waitFor(() => {
      // modelsFn should have been called — first returns X-T5 and X-H2
      expect(modelsFn).toHaveBeenCalled();
    });
  });

  it('should auto-clear city when city disappears from re-fetched results', async () => {
    const citiesFn = vi
      .fn()
      .mockResolvedValueOnce(['Berlin', 'Munich']) // initial cities
      .mockResolvedValueOnce(['Berlin']); // after re-fetch, Munich is gone

    const filters = createFilterState();
    filters.country = 'Germany';
    filters.city = 'Munich';

    const config: FilterPanelConfig = {
      sections: ['location'],
      providers: {
        locations: vi.fn().mockResolvedValue([{ value: 'Germany', type: 'country' as const }]),
        cities: citiesFn,
      },
    };

    render(FilterPanel, {
      props: { config, timeBuckets: [], filters },
    });

    await vi.advanceTimersByTimeAsync(0);

    await waitFor(() => {
      expect(screen.getByTestId('location-country-Germany')).toBeTruthy();
    });

    // Click country to expand and trigger city fetch
    await fireEvent.click(screen.getByTestId('location-country-Germany'));

    await waitFor(() => {
      expect(citiesFn).toHaveBeenCalled();
    });
  });
});

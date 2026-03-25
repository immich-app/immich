import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { FilterContext, FilterPanelConfig } from '../filter-panel';
import FilterPanel from '../filter-panel.svelte';

function createConfig(overrides: Partial<FilterPanelConfig['providers']> = {}): FilterPanelConfig {
  return {
    sections: ['timeline', 'people', 'location', 'camera'],
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
      ...overrides,
    },
  };
}

const timeBuckets = [
  { timeBucket: '2023-06-01', count: 100 },
  { timeBucket: '2023-08-01', count: 200 },
  { timeBucket: '2024-03-01', count: 50 },
];

describe('Contextual re-fetch on temporal change', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.removeItem('gallery-filter-visible-sections');
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

    expect(config.providers.people).toHaveBeenCalledTimes(1);
    expect(config.providers.locations).toHaveBeenCalledTimes(1);
    expect(config.providers.cameras).toHaveBeenCalledTimes(1);

    // Click year to select 2023
    await fireEvent.click(screen.getByTestId('year-btn-2023'));

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(250);

    const expectedContext: FilterContext = {
      takenAfter: '2023-01-01T00:00:00.000Z',
      takenBefore: '2024-01-01T00:00:00.000Z',
    };

    await waitFor(() => {
      expect(config.providers.people).toHaveBeenCalledTimes(2);
      expect(config.providers.people).toHaveBeenLastCalledWith(expectedContext);
      expect(config.providers.locations).toHaveBeenLastCalledWith(expectedContext);
      expect(config.providers.cameras).toHaveBeenLastCalledWith(expectedContext);
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
      expect(config.providers.people).toHaveBeenLastCalledWith({
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

    const initialCalls = (config.providers.people as ReturnType<typeof vi.fn>).mock.calls.length;

    // Click year — this triggers a 200ms debounce for the year context
    await fireEvent.click(screen.getByTestId('year-btn-2023'));

    // Wait for the year debounce to fire
    await vi.advanceTimersByTimeAsync(250);

    // Now click month (month grid is visible after year selection)
    await fireEvent.click(screen.getByTestId('month-btn-6'));

    // Wait for month debounce
    await vi.advanceTimersByTimeAsync(250);

    await waitFor(() => {
      const finalCalls = (config.providers.people as ReturnType<typeof vi.fn>).mock.calls.length;
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

    const initialCalls = (config.providers.people as ReturnType<typeof vi.fn>).mock.calls.length;

    // Advance time — no temporal change happens, so no re-fetch
    await vi.advanceTimersByTimeAsync(500);

    expect((config.providers.people as ReturnType<typeof vi.fn>).mock.calls.length).toBe(initialCalls);
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

    const callsAfterYear = (config.providers.people as ReturnType<typeof vi.fn>).mock.calls.length;

    // Click "All" breadcrumb to clear temporal filter
    await fireEvent.click(screen.getByTestId('temporal-breadcrumb-all'));

    // Advance just 1ms — clear should fire immediately (delay=0)
    await vi.advanceTimersByTimeAsync(1);

    await waitFor(() => {
      const finalCalls = (config.providers.people as ReturnType<typeof vi.fn>).mock.calls.length;
      expect(finalCalls).toBeGreaterThan(callsAfterYear);
      expect(config.providers.people).toHaveBeenLastCalledWith(undefined);
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
      expect(config.providers.people).toHaveBeenLastCalledWith({
        takenAfter: '2023-08-01T00:00:00.000Z',
        takenBefore: '2023-09-01T00:00:00.000Z',
      });
    });
  });
});

import ActiveFiltersBar from '$lib/components/filter-panel/active-filters-bar.svelte';
import { createFilterState } from '$lib/components/filter-panel/filter-panel';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

describe('ActiveFiltersBar search chip', () => {
  it('should render search chip when searchQuery is set', () => {
    render(ActiveFiltersBar, {
      props: {
        filters: createFilterState(),
        onRemoveFilter: vi.fn(),
        onClearAll: vi.fn(),
        searchQuery: 'sunset',
        onClearSearch: vi.fn(),
      },
    });
    expect(screen.getByTestId('search-chip')).toHaveTextContent('sunset');
  });

  it('should call onClearSearch when search chip is removed', async () => {
    const onClearSearch = vi.fn();
    render(ActiveFiltersBar, {
      props: {
        filters: createFilterState(),
        onRemoveFilter: vi.fn(),
        onClearAll: vi.fn(),
        searchQuery: 'sunset',
        onClearSearch,
      },
    });
    await userEvent.click(screen.getByTestId('search-chip-close'));
    expect(onClearSearch).toHaveBeenCalled();
  });

  it('should be visible when only search query is active (no structured filters)', () => {
    render(ActiveFiltersBar, {
      props: {
        filters: createFilterState(),
        onRemoveFilter: vi.fn(),
        onClearAll: vi.fn(),
        searchQuery: 'sunset',
        onClearSearch: vi.fn(),
      },
    });
    expect(screen.getByTestId('active-filters-bar')).toBeInTheDocument();
  });

  it('should not render search chip when searchQuery is empty', () => {
    render(ActiveFiltersBar, {
      props: {
        filters: createFilterState(),
        onRemoveFilter: vi.fn(),
        onClearAll: vi.fn(),
        searchQuery: '',
        onClearSearch: vi.fn(),
      },
    });
    expect(screen.queryByTestId('search-chip')).not.toBeInTheDocument();
  });
});

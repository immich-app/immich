import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SearchSortDropdown from '../search-sort-dropdown.svelte';

describe('SearchSortDropdown', () => {
  it('should render with current sort mode label', () => {
    render(SearchSortDropdown, {
      props: { sortOrder: 'relevance', onSelect: vi.fn() },
    });
    expect(screen.getByTestId('search-sort-btn')).toHaveTextContent('Relevance');
  });

  it('should show Newest first label for desc', () => {
    render(SearchSortDropdown, {
      props: { sortOrder: 'desc', onSelect: vi.fn() },
    });
    expect(screen.getByTestId('search-sort-btn')).toHaveTextContent('Newest first');
  });

  it('should show Oldest first label for asc', () => {
    render(SearchSortDropdown, {
      props: { sortOrder: 'asc', onSelect: vi.fn() },
    });
    expect(screen.getByTestId('search-sort-btn')).toHaveTextContent('Oldest first');
  });

  it('should open dropdown and show all options on click', async () => {
    render(SearchSortDropdown, {
      props: { sortOrder: 'relevance', onSelect: vi.fn() },
    });
    await userEvent.click(screen.getByTestId('search-sort-btn'));
    // 'Relevance' appears in both button and dropdown
    expect(screen.getAllByText('Relevance')).toHaveLength(2);
    expect(screen.getByText('Newest first')).toBeInTheDocument();
    expect(screen.getByText('Oldest first')).toBeInTheDocument();
  });

  it('should call onSelect with correct value', async () => {
    const onSelect = vi.fn();
    render(SearchSortDropdown, {
      props: { sortOrder: 'relevance', onSelect },
    });
    await userEvent.click(screen.getByTestId('search-sort-btn'));
    await userEvent.click(screen.getByText('Newest first'));
    expect(onSelect).toHaveBeenCalledWith('desc');
  });

  it('should omit the relevance option when showRelevance is false', async () => {
    render(SearchSortDropdown, {
      props: { sortOrder: 'desc', onSelect: vi.fn(), showRelevance: false },
    });
    await userEvent.click(screen.getByTestId('search-sort-btn'));
    expect(screen.queryByText('Relevance')).not.toBeInTheDocument();
    expect(screen.getAllByText('Newest first')).toHaveLength(2);
    expect(screen.getByText('Oldest first')).toBeInTheDocument();
  });

  it('should expose the current option as an aria-label in compact mode', () => {
    render(SearchSortDropdown, {
      props: { sortOrder: 'asc', onSelect: vi.fn(), compact: true },
    });
    expect(screen.getByTestId('search-sort-btn')).toHaveAttribute('aria-label', 'Oldest first');
  });
});

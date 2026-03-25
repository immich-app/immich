import SpaceSearchResults from '$lib/components/spaces/space-search-results.svelte';
import type { AssetResponseDto } from '@immich/sdk';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

const mockAssets = [
  { id: 'asset-1', originalFileName: 'photo1.jpg' },
  { id: 'asset-2', originalFileName: 'photo2.jpg' },
  { id: 'asset-3', originalFileName: 'photo3.jpg' },
] as AssetResponseDto[];

describe('SpaceSearchResults', () => {
  it('should render thumbnail grid from search results', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,

        isLoading: false,
        hasMore: false,
        totalLoaded: 3,
        onLoadMore: vi.fn(),
      },
    });
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
  });

  it('should show result count with + when more pages exist', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,

        isLoading: false,
        hasMore: true,
        totalLoaded: 100,
        onLoadMore: vi.fn(),
      },
    });
    expect(screen.getByTestId('result-count')).toHaveTextContent('100+');
  });

  it('should show exact count when no more pages', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,

        isLoading: false,
        hasMore: false,
        totalLoaded: 3,
        onLoadMore: vi.fn(),
      },
    });
    expect(screen.getByTestId('result-count')).toHaveTextContent('3');
    expect(screen.getByTestId('result-count').textContent).not.toContain('+');
  });

  it('should show load more button when hasMore is true', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,

        isLoading: false,
        hasMore: true,
        totalLoaded: 100,
        onLoadMore: vi.fn(),
      },
    });
    expect(screen.getByTestId('load-more-btn')).toBeInTheDocument();
  });

  it('should not show load more button when hasMore is false', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,

        isLoading: false,
        hasMore: false,
        totalLoaded: 3,
        onLoadMore: vi.fn(),
      },
    });
    expect(screen.queryByTestId('load-more-btn')).not.toBeInTheDocument();
  });

  it('should disable load more button when loading', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,

        isLoading: true,
        hasMore: true,
        totalLoaded: 100,
        onLoadMore: vi.fn(),
      },
    });
    expect(screen.getByTestId('load-more-btn')).toBeDisabled();
  });

  it('should call onLoadMore when button clicked', async () => {
    const onLoadMore = vi.fn();
    render(SpaceSearchResults, {
      props: { results: mockAssets, spaceId: 'space-1', isLoading: false, hasMore: true, totalLoaded: 100, onLoadMore },
    });
    await userEvent.click(screen.getByTestId('load-more-btn'));
    expect(onLoadMore).toHaveBeenCalled();
  });

  it('should show loading spinner when loading', () => {
    render(SpaceSearchResults, {
      props: { results: [], spaceId: 'space-1', isLoading: true, hasMore: false, totalLoaded: 0, onLoadMore: vi.fn() },
    });
    expect(screen.getByTestId('search-loading')).toBeInTheDocument();
  });

  it('should show empty state when no results and not loading', () => {
    render(SpaceSearchResults, {
      props: {
        results: [],

        isLoading: false,
        hasMore: false,
        totalLoaded: 0,
        onLoadMore: vi.fn(),
      },
    });
    expect(screen.getByTestId('search-empty')).toBeInTheDocument();
  });
});

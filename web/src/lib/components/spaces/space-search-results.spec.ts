import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import SpaceSearchResults from '$lib/components/spaces/space-search-results.svelte';
import type { AssetResponseDto } from '@immich/sdk';
import { fireEvent, render, screen } from '@testing-library/svelte';

const getAssetInfoMock = vi.fn();
vi.mock('@immich/sdk', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, getAssetInfo: (...args: unknown[]) => getAssetInfoMock(...args) };
});

// Spy on the props forwarded to AssetViewer. The component dynamic-imports asset-viewer.svelte,
// so we mock the module and record each invocation's props on this array. Tests assert against it.
const assetViewerPropsCalls: Array<Record<string, unknown>> = [];
vi.mock('$lib/components/asset-viewer/asset-viewer.svelte', () => {
  return {
    default: function MockAssetViewer(_node: unknown, props: Record<string, unknown>) {
      assetViewerPropsCalls.push(props);
      return { destroy: () => {} };
    },
  };
});

const mockAssets = [
  { id: 'asset-1', originalFileName: 'photo1.jpg' },
  { id: 'asset-2', originalFileName: 'photo2.jpg' },
  { id: 'asset-3', originalFileName: 'photo3.jpg' },
] as AssetResponseDto[];

const mockAssetsWithDates = [
  { id: 'a1', originalFileName: 'p1.jpg', fileCreatedAt: '2024-06-15T10:00:00.000Z' },
  { id: 'a2', originalFileName: 'p2.jpg', fileCreatedAt: '2024-06-10T10:00:00.000Z' },
  { id: 'a3', originalFileName: 'p3.jpg', fileCreatedAt: '2024-03-01T10:00:00.000Z' },
] as AssetResponseDto[];

describe('SpaceSearchResults', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    getAssetInfoMock.mockReset();
    getAssetInfoMock.mockResolvedValue({ id: 'asset-1', originalFileName: 'photo1.jpg' } as AssetResponseDto);
    assetViewerPropsCalls.length = 0;
  });

  it('should render thumbnail grid from search results', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,
        isLoading: false,
        hasMore: false,
        totalLoaded: 3,
        onLoadMore: vi.fn(),
        sortMode: 'relevance',
      },
    });
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
  });

  it('should show result count with + for relevance mode when more pages exist', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,
        isLoading: false,
        hasMore: true,
        totalLoaded: 100,
        onLoadMore: vi.fn(),
        sortMode: 'relevance',
      },
    });
    expect(screen.getByTestId('result-count')).toHaveTextContent('100+');
  });

  it('should show route-provided exact total without plus when available', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,
        isLoading: false,
        hasMore: true,
        totalLoaded: 3,
        total: 42,
        onLoadMore: vi.fn(),
        sortMode: 'relevance',
      },
    });
    expect(screen.getByTestId('result-count')).toHaveTextContent('42 results');
    expect(screen.getByTestId('result-count').textContent).not.toContain('+');
  });

  it('should show exact count when no more pages', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,
        isLoading: false,
        hasMore: false,
        totalLoaded: 3,
        onLoadMore: vi.fn(),
        sortMode: 'relevance',
      },
    });
    expect(screen.getByTestId('result-count')).toHaveTextContent('3');
    expect(screen.getByTestId('result-count').textContent).not.toContain('+');
  });

  it('should render scroll sentinel when hasMore is true', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,
        isLoading: false,
        hasMore: true,
        totalLoaded: 100,
        onLoadMore: vi.fn(),
        sortMode: 'relevance',
      },
    });
    expect(screen.getByTestId('scroll-sentinel')).toBeInTheDocument();
  });

  it('should not render scroll sentinel when hasMore is false', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,
        isLoading: false,
        hasMore: false,
        totalLoaded: 3,
        onLoadMore: vi.fn(),
        sortMode: 'relevance',
      },
    });
    expect(screen.queryByTestId('scroll-sentinel')).not.toBeInTheDocument();
  });

  it('should show loading spinner when loading', () => {
    render(SpaceSearchResults, {
      props: {
        results: [],
        spaceId: 'space-1',
        isLoading: true,
        hasMore: false,
        totalLoaded: 0,
        onLoadMore: vi.fn(),
        sortMode: 'relevance',
      },
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
        sortMode: 'relevance',
      },
    });
    expect(screen.getByTestId('search-empty')).toBeInTheDocument();
  });

  it('should show date headers when sortMode is desc', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssetsWithDates,
        isLoading: false,
        hasMore: false,
        totalLoaded: 3,
        onLoadMore: vi.fn(),
        sortMode: 'desc',
      },
    });
    expect(screen.getByTestId('date-group-header-0')).toHaveTextContent('June 2024');
    expect(screen.getByTestId('date-group-header-1')).toHaveTextContent('March 2024');
  });

  it('should not show date headers when sortMode is relevance', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssetsWithDates,
        isLoading: false,
        hasMore: false,
        totalLoaded: 3,
        onLoadMore: vi.fn(),
        sortMode: 'relevance',
      },
    });
    expect(screen.queryByTestId('date-group-header-0')).not.toBeInTheDocument();
  });

  it('should show contextual result count for date-sorted mode', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssetsWithDates,
        isLoading: false,
        hasMore: true,
        totalLoaded: 100,
        onLoadMore: vi.fn(),
        sortMode: 'desc',
      },
    });
    expect(screen.getByTestId('result-count')).toHaveTextContent('100 of up to 500');
  });

  it('should show date headers when sortMode is asc', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssetsWithDates,
        isLoading: false,
        hasMore: false,
        totalLoaded: 3,
        onLoadMore: vi.fn(),
        sortMode: 'asc',
      },
    });
    expect(screen.getByTestId('date-group-header-0')).toBeInTheDocument();
    expect(screen.getByTestId('date-group-header-1')).toBeInTheDocument();
  });

  it('should merge assets with same month into one group', () => {
    const assetsWithSameMonth = [
      { id: 'b1', originalFileName: 'q1.jpg', fileCreatedAt: '2024-06-20T10:00:00.000Z' },
      { id: 'b2', originalFileName: 'q2.jpg', fileCreatedAt: '2024-03-15T10:00:00.000Z' },
      { id: 'b3', originalFileName: 'q3.jpg', fileCreatedAt: '2024-06-05T10:00:00.000Z' },
    ] as AssetResponseDto[];

    render(SpaceSearchResults, {
      props: {
        results: assetsWithSameMonth,
        isLoading: false,
        hasMore: false,
        totalLoaded: 3,
        onLoadMore: vi.fn(),
        sortMode: 'desc',
      },
    });
    // June 2024 appears twice in the data but should merge into one group
    expect(screen.getByTestId('date-group-header-0')).toHaveTextContent('June 2024');
    expect(screen.getByTestId('date-group-header-1')).toHaveTextContent('March 2024');
    expect(screen.queryByTestId('date-group-header-2')).not.toBeInTheDocument();
  });

  it('should show contextual result count for asc mode', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssetsWithDates,
        isLoading: false,
        hasMore: true,
        totalLoaded: 50,
        onLoadMore: vi.fn(),
        sortMode: 'asc',
      },
    });
    expect(screen.getByTestId('result-count')).toHaveTextContent('50 of up to 500');
  });

  it('should show exact count in date mode when all loaded', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssetsWithDates,
        isLoading: false,
        hasMore: false,
        totalLoaded: 35,
        onLoadMore: vi.fn(),
        sortMode: 'desc',
      },
    });
    const text = screen.getByTestId('result-count').textContent;
    expect(text).toContain('35');
    expect(text).not.toContain('of up to');
  });

  describe('isShared prop and conditional spaceId', () => {
    it('should pass isShared={true} to AssetViewer when isShared prop is true', async () => {
      render(SpaceSearchResults, {
        props: {
          results: mockAssets,
          isLoading: false,
          hasMore: false,
          totalLoaded: 3,
          onLoadMore: vi.fn(),
          sortMode: 'relevance',
          spaceId: 'space-1',
          isShared: true,
        },
      });

      const firstThumb = screen.getAllByRole('img')[0];
      await fireEvent.click(firstThumb);

      // Wait for the dynamic-imported AssetViewer mock to be invoked with props.
      await vi.waitFor(() => expect(assetViewerPropsCalls.length).toBeGreaterThan(0));

      const props = assetViewerPropsCalls.at(-1)!;
      expect(props.isShared).toBe(true);
    });

    it('should pass isShared={false} to AssetViewer when isShared prop is false', async () => {
      render(SpaceSearchResults, {
        props: {
          results: mockAssets,
          isLoading: false,
          hasMore: false,
          totalLoaded: 3,
          onLoadMore: vi.fn(),
          sortMode: 'relevance',
          isShared: false,
        },
      });

      const firstThumb = screen.getAllByRole('img')[0];
      await fireEvent.click(firstThumb);

      // This test FAILS today because the component hardcodes isShared={true} in the AssetViewer render.
      await vi.waitFor(() => expect(assetViewerPropsCalls.length).toBeGreaterThan(0));

      const props = assetViewerPropsCalls.at(-1)!;
      expect(props.isShared).toBe(false);
    });

    it('should call getAssetInfo WITH spaceId when spaceId prop is set', async () => {
      render(SpaceSearchResults, {
        props: {
          results: mockAssets,
          isLoading: false,
          hasMore: false,
          totalLoaded: 3,
          onLoadMore: vi.fn(),
          sortMode: 'relevance',
          spaceId: 'space-42',
          isShared: true,
        },
      });

      const firstThumb = screen.getAllByRole('img')[0];
      await fireEvent.click(firstThumb);

      await vi.waitFor(() => expect(getAssetInfoMock).toHaveBeenCalled());

      expect(getAssetInfoMock).toHaveBeenCalledWith(expect.objectContaining({ spaceId: 'space-42' }));
    });

    it('should call getAssetInfo WITHOUT spaceId when spaceId prop is undefined', async () => {
      render(SpaceSearchResults, {
        props: {
          results: mockAssets,
          isLoading: false,
          hasMore: false,
          totalLoaded: 3,
          onLoadMore: vi.fn(),
          sortMode: 'relevance',
          isShared: false,
        },
      });

      const firstThumb = screen.getAllByRole('img')[0];
      await fireEvent.click(firstThumb);

      await vi.waitFor(() => expect(getAssetInfoMock).toHaveBeenCalled());

      // Assert the spaceId key is ABSENT (not just undefined) from every call. The current
      // implementation passes `{ ...authManager.params, id, spaceId }` which results in the
      // key being present with an undefined value, so this test FAILS today.
      for (const call of getAssetInfoMock.mock.calls) {
        const arg = call[0] as Record<string, unknown>;
        expect(Object.prototype.hasOwnProperty.call(arg, 'spaceId')).toBe(false);
      }
      // Also assert via not.objectContaining as a secondary guardrail.
      expect(getAssetInfoMock).toHaveBeenCalledWith(expect.not.objectContaining({ spaceId: expect.anything() }));
    });
  });
});

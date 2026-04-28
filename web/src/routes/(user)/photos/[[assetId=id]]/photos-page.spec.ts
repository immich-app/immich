import TestWrapper from '$lib/components/TestWrapper.svelte';
import { buildPhotosTimelineOptions } from '$lib/utils/photos-filter-options';
import { getSearchSuggestions } from '@immich/sdk';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { Component } from 'svelte';
import PhotosPage from './+page.svelte';

const { mockPage, mockAssetMultiSelectManager, mockAuthManager, mockMemoryManager, mockRegisterSelectionContext } =
  vi.hoisted(() => ({
    mockPage: {
      url: new URL('https://gallery.test/photos?q=nature'),
      route: { id: '/(user)/photos/[[assetId=id]]' },
      params: {},
    },
    mockAssetMultiSelectManager: {
      selectionActive: false,
      assets: [],
      clear: vi.fn(),
      isAllUserOwned: true,
    },
    mockAuthManager: {
      preferences: { memories: { enabled: false } },
    },
    mockMemoryManager: {
      memories: [],
    },
    mockRegisterSelectionContext: vi.fn(),
  }));

vi.mock('$app/navigation', () => ({ goto: vi.fn().mockResolvedValue(undefined) }));
vi.mock('$app/state', () => ({ page: mockPage }));

vi.mock('$lib/components/layouts/user-page-layout.svelte', async () => {
  const { default: MockComponent } = await import('$lib/components/spaces/mock-user-page-layout.test-wrapper.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/ActionMenuItem.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/filter-panel/active-filters-bar.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/filter-panel/filter-panel.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/filter-panel-favorites.stub.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/search/smart-search-results.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/smart-search-results.stub.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/shared-components/context-menu/button-context-menu.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/shared-components/empty-placeholder.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/Timeline.svelte', async () => {
  const { default: MockComponent } =
    await import('../../albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/mock-timeline.test-wrapper.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/AssetSelectControlBar.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/actions/ArchiveAction.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/actions/ChangeDateAction.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/actions/ChangeDescriptionAction.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/actions/ChangeLocationAction.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/actions/CreateSharedLinkAction.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/actions/DeleteAssetsAction.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/actions/DownloadAction.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/actions/FavoriteAction.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/actions/LinkLivePhotoAction.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/actions/RotateAction.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/actions/SelectAllAction.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/actions/SetVisibilityAction.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/actions/StackAction.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/actions/TagAction.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/managers/asset-multi-select-manager.svelte', () => ({
  assetMultiSelectManager: mockAssetMultiSelectManager,
}));

vi.mock('$lib/managers/asset-viewer-manager.svelte', () => ({
  assetViewerManager: { isViewing: false },
}));

vi.mock('$lib/managers/auth-manager.svelte', () => ({
  authManager: mockAuthManager,
}));

vi.mock('$lib/managers/command-context-manager.svelte', () => ({
  registerSelectionContext: mockRegisterSelectionContext,
}));

vi.mock('$lib/managers/memory-manager.svelte', () => ({
  memoryManager: mockMemoryManager,
}));

vi.mock('$lib/services/asset.service', () => ({
  getAssetBulkActions: vi.fn(() => ({})),
}));

vi.mock('$lib/utils', () => ({
  createUrl: vi.fn(() => ''),
  getAssetMediaUrl: vi.fn(() => ''),
  memoryLaneTitle: vi.fn(() => 'memory'),
}));

vi.mock('$lib/utils/file-uploader', () => ({
  openFileUploadDialog: vi.fn(),
}));

vi.mock('$lib/utils/photos-filter-options', () => ({
  buildPhotosTimelineOptions: vi.fn(() => ({})),
  handlePhotosRemoveFilter: vi.fn((filters) => filters),
}));

vi.mock('$lib/utils/thumbnail-util', () => ({
  getAltText: vi.fn(() => 'alt'),
}));

vi.mock('$lib/utils/timeline-util', () => ({
  toTimelineAsset: vi.fn((asset) => asset),
}));

vi.mock('@immich/sdk', async () => {
  const actual = await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk');
  return {
    ...actual,
    getFilterSuggestions: vi.fn().mockResolvedValue({
      people: [],
      countries: [],
      cameraMakes: [],
      tags: [],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    }),
    getSearchSuggestions: vi.fn().mockResolvedValue([]),
  };
});

function renderPage() {
  return render(TestWrapper as Component<{ component: typeof PhotosPage; componentProps: Record<string, never> }>, {
    component: PhotosPage,
    componentProps: {},
  });
}

describe('Photos page search URL state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPage.url = new URL('https://gallery.test/photos?q=nature');
    mockAssetMultiSelectManager.selectionActive = false;
    mockAssetMultiSelectManager.assets = [];
    mockMemoryManager.memories = [];
  });

  it('renders search results from q without a local search input', () => {
    renderPage();

    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-search-query', 'nature');
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-sort-order', 'relevance');
    expect(screen.queryByTestId('timeline-stub')).not.toBeInTheDocument();
  });

  it('hydrates an explicit search sort from the URL', () => {
    mockPage.url = new URL('https://gallery.test/photos?q=nature&sort=asc');

    renderPage();

    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-search-query', 'nature');
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-sort-order', 'asc');
  });

  it('exposes favorites in the photos filter panel', () => {
    mockPage.url = new URL('https://gallery.test/photos');

    renderPage();

    expect(screen.getByTestId('filter-panel-stub')).toHaveAttribute(
      'data-sections',
      'timeline,people,location,camera,tags,rating,media,favorites',
    );
  });

  it('passes favorites into photos timeline options when selected', async () => {
    mockPage.url = new URL('https://gallery.test/photos');

    renderPage();
    await fireEvent.click(screen.getByTestId('select-favorites-filter'));

    await waitFor(() => {
      expect(buildPhotosTimelineOptions).toHaveBeenCalledWith(expect.objectContaining({ isFavorite: true }));
    });
  });

  it('narrows search results to favorites without shared spaces when selected', async () => {
    renderPage();

    await fireEvent.click(screen.getByTestId('select-favorites-filter'));

    await waitFor(() => {
      expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-is-favorite', 'true');
      expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-with-shared-spaces', 'false');
    });
  });

  it('narrows dependent suggestions to favorites without shared spaces when selected', async () => {
    renderPage();

    await fireEvent.click(screen.getByTestId('select-favorites-filter'));
    await fireEvent.click(screen.getByTestId('load-city-suggestions'));
    await fireEvent.click(screen.getByTestId('load-camera-model-suggestions'));

    await waitFor(() => {
      expect(getSearchSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({ country: 'Germany', isFavorite: true }),
      );
      expect(getSearchSuggestions).toHaveBeenCalledWith(expect.objectContaining({ make: 'Sony', isFavorite: true }));
    });

    for (const [request] of vi.mocked(getSearchSuggestions).mock.calls) {
      expect(request).not.toHaveProperty('withSharedSpaces');
    }
  });

  it('registers cmdk selection context with photo-page callbacks', () => {
    mockPage.url = new URL('https://gallery.test/photos');

    renderPage();

    expect(mockRegisterSelectionContext).toHaveBeenCalledOnce();
    const options = mockRegisterSelectionContext.mock.calls[0][0];
    expect(options.getAssets()).toBe(mockAssetMultiSelectManager.assets);
    expect(options.canAddToAlbum()).toBe(true);
    expect(options.canAddToSpace()).toBe(true);
    expect(options.getOnFavorite()).toEqual(expect.any(Function));
    expect(options.getOnArchive()).toEqual(expect.any(Function));
    expect(options.getOnDelete()).toEqual(expect.any(Function));
    expect(options.getOnUndoDelete()).toEqual(expect.any(Function));
  });

  it('photo-page cmdk callbacks are live functions and clearSelection delegates to the selection manager', () => {
    mockPage.url = new URL('https://gallery.test/photos');

    renderPage();
    const options = mockRegisterSelectionContext.mock.calls[0][0];

    expect(options.getOnFavorite()).toEqual(expect.any(Function));
    expect(options.getOnArchive()).toEqual(expect.any(Function));
    expect(options.getOnDelete()).toEqual(expect.any(Function));
    expect(options.getOnUndoDelete()).toEqual(expect.any(Function));
    options.clearSelection();
    expect(mockAssetMultiSelectManager.clear).toHaveBeenCalledOnce();
  });
});

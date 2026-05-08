import { goto } from '$app/navigation';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import type { FilterState } from '$lib/components/filter-panel/filter-panel';
import { lang } from '$lib/stores/preferences.store';
import { buildPhotosTimelineOptions } from '$lib/utils/photos-filter-options';
import { storeTypedSearchNames } from '$lib/utils/typed-search/typed-search-name-cache';
import { AssetTypeEnum } from '@immich/sdk';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { Component } from 'svelte';
import PhotosPage from './+page.svelte';

const {
  mockPage,
  mockAssetMultiSelectManager,
  mockAuthManager,
  mockMemoryManager,
  mockRegisterSelectionContext,
  mockRegisterSearchablePageFilters,
} = vi.hoisted(() => ({
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
    memories: [] as unknown[],
  },
  mockRegisterSelectionContext: vi.fn(),
  mockRegisterSearchablePageFilters: vi.fn(() => vi.fn()),
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
  const { default: MockComponent } = await import('@test-data/mocks/active-filters-bar-actions.stub.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/filter-panel/filter-panel.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/bindable-filter-panel.stub.svelte');
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

vi.mock('$lib/managers/global-search-manager.svelte', () => ({
  globalSearchManager: {
    registerSearchablePageFilters: mockRegisterSearchablePageFilters,
  },
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

function renderPage() {
  return render(TestWrapper as Component<{ component: typeof PhotosPage; componentProps: Record<string, never> }>, {
    component: PhotosPage,
    componentProps: {},
  });
}

describe('Photos page search URL state', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockPage.url = new URL('https://gallery.test/photos?q=nature');
    lang.set('de');
    mockAssetMultiSelectManager.selectionActive = false;
    mockAssetMultiSelectManager.assets = [];
    mockMemoryManager.memories = [];
    mockRegisterSearchablePageFilters.mockReturnValue(vi.fn());
    sessionStorage.clear();
    sdkMock.getFilterSuggestions.mockResolvedValue({
      people: [],
      countries: [],
      cameraMakes: [],
      tags: [],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    });
    sdkMock.searchSmartFacets.mockResolvedValue({
      total: 12,
      timeBuckets: [{ timeBucket: '2024-01-01', count: 12 }],
      countries: ['Germany'],
      cities: ['Berlin'],
      cameraMakes: ['Sony'],
      cameraModels: ['A7'],
      tags: [{ id: 'tag-1', value: 'Travel' }],
      people: [{ id: 'person-1', name: 'Ada' }],
      ratings: [4],
      mediaTypes: [AssetTypeEnum.Image],
      hasUnnamedPeople: false,
    });
    sdkMock.getSearchSuggestions.mockResolvedValue([]);
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

  it('hydrates typed filter URL params into the photos FilterState', () => {
    mockPage.url = new URL(
      'https://gallery.test/photos?q=beach&people=person-1&tags=tag-1&type=image&favorite=true&album=none&rating=4&from=2025-01-01&to=2025-12-31',
    );

    renderPage();

    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-search-query', 'beach');
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-person-ids', 'person-1');
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-tag-ids', 'tag-1');
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-media-type', 'image');
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-favorite', 'true');
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-not-in-album', 'true');
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-rating', '4');
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-date-after', '2025-01-01');
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-date-before', '2025-12-31');
  });

  it('clears only q when clearing the search chip', async () => {
    mockPage.url = new URL('https://gallery.test/photos?view=timeline&q=beach&people=person-1&city=Berlin');

    renderPage();
    await fireEvent.click(await screen.findByTestId('active-filters-clear-search'));

    expect(goto).toHaveBeenCalledWith('/photos?view=timeline&people=person-1&city=Berlin', {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  });

  it('syncs the URL when a location typed filter is cleared from the filter panel', async () => {
    mockPage.url = new URL('https://gallery.test/photos?city=New+York+City');

    renderPage();
    await fireEvent.click(screen.getByTestId('filter-panel-clear-location'));

    expect(goto).toHaveBeenCalledWith('/photos', {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  });

  it('clears typed filter URL params and q when clearing all active filters', async () => {
    mockPage.url = new URL('https://gallery.test/photos?view=timeline&q=beach&people=person-1&city=Berlin');

    renderPage();
    await fireEvent.click(await screen.findByTestId('active-filters-clear-all'));

    expect(goto).toHaveBeenLastCalledWith('/photos?view=timeline', {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  });

  it('exposes favorites in the photos filter panel', () => {
    mockPage.url = new URL('https://gallery.test/photos');

    renderPage();

    expect(screen.getByTestId('filter-panel-stub')).toHaveAttribute(
      'data-sections',
      'timeline,people,location,camera,tags,rating,media,favorites,albums',
    );
  });

  it('passes has-no-album into photos timeline options when hydrated from the URL', async () => {
    mockPage.url = new URL('https://gallery.test/photos?album=none');

    renderPage();

    await waitFor(() => {
      expect(buildPhotosTimelineOptions).toHaveBeenCalledWith(expect.objectContaining({ isNotInAlbum: true }));
    });
  });

  it('registers current photos filters for global sort changes', async () => {
    mockPage.url = new URL('https://gallery.test/photos');

    renderPage();
    await waitFor(() => expect(mockRegisterSearchablePageFilters).toHaveBeenCalledOnce());
    const calls = mockRegisterSearchablePageFilters.mock.calls as unknown as Array<[() => FilterState]>;
    const getFilters = calls[0][0];

    expect(getFilters().isFavorite).toBeUndefined();
    expect(getFilters().sortOrder).toBe('desc');
    await fireEvent.click(screen.getByTestId('select-favorites-filter'));

    await waitFor(() => expect(getFilters()).toMatchObject({ isFavorite: true, sortOrder: 'desc' }));
  });

  it('passes typed search names into the photos filter panel', () => {
    mockPage.url = new URL('https://gallery.test/photos?people=person-cat&tags=tag-nature');
    storeTypedSearchNames('/photos?people=person-cat&tags=tag-nature', {
      personNames: new Map([['person-cat', 'cat']]),
      tagNames: new Map([['tag-nature', 'nature']]),
    });

    renderPage();

    expect(screen.getByTestId('filter-panel-stub')).toHaveAttribute(
      'data-person-names',
      JSON.stringify([['person-cat', 'cat']]),
    );
    expect(screen.getByTestId('filter-panel-stub')).toHaveAttribute(
      'data-tag-names',
      JSON.stringify([['tag-nature', 'nature']]),
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

  it('narrows non-search dependent suggestions to favorites without shared spaces when selected', async () => {
    mockPage.url = new URL('https://gallery.test/photos');

    renderPage();
    await fireEvent.click(screen.getByTestId('select-favorites-filter'));
    await fireEvent.click(screen.getByTestId('load-city-suggestions'));
    await fireEvent.click(screen.getByTestId('load-camera-model-suggestions'));

    await waitFor(() => {
      expect(sdkMock.getSearchSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({ country: 'Germany', isFavorite: true }),
      );
      expect(sdkMock.getSearchSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({ make: 'Sony', isFavorite: true }),
      );
    });

    for (const [request] of sdkMock.getSearchSuggestions.mock.calls) {
      expect(request).not.toHaveProperty('withSharedSpaces');
    }
  });

  it('narrows photos suggestions and dependent providers to has-no-album when selected', async () => {
    mockPage.url = new URL('https://gallery.test/photos');

    renderPage();
    await fireEvent.click(screen.getByTestId('select-has-no-album-filter'));
    await fireEvent.click(screen.getByTestId('load-city-suggestions'));
    await fireEvent.click(screen.getByTestId('load-camera-model-suggestions'));

    await waitFor(() => {
      expect(sdkMock.getFilterSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({ isNotInAlbum: true, withSharedSpaces: true }),
      );
      expect(sdkMock.getSearchSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({ country: 'Germany', isNotInAlbum: true }),
      );
      expect(sdkMock.getSearchSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({ make: 'Sony', isNotInAlbum: true }),
      );
    });
  });

  it('fetches smart facets for committed photos search and passes exact total to results', async () => {
    renderPage();

    await vi.waitFor(() => {
      expect(sdkMock.searchSmartFacets).toHaveBeenCalledWith(
        {
          smartSearchFacetsDto: expect.objectContaining({
            query: 'nature',
            language: 'de',
            withSharedSpaces: true,
          }),
        },
        expect.objectContaining({ signal: expect.any(Object) }),
      );
    });
    await vi.waitFor(() => expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-total', '12'));
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-language', 'de');
  });

  it('narrows search results and smart facets to favorites without shared spaces when selected', async () => {
    renderPage();
    await vi.waitFor(() => expect(sdkMock.searchSmartFacets).toHaveBeenCalledTimes(1));

    await fireEvent.click(screen.getByTestId('select-favorites-filter'));

    await vi.waitFor(() => expect(sdkMock.searchSmartFacets).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-is-favorite', 'true');
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-with-shared-spaces', 'false');
    expect(sdkMock.searchSmartFacets.mock.calls[1][0].smartSearchFacetsDto).toMatchObject({
      query: 'nature',
      isFavorite: true,
    });
    expect(sdkMock.searchSmartFacets.mock.calls[1][0].smartSearchFacetsDto).not.toHaveProperty('withSharedSpaces');
  });

  it('uses smart facet timeBuckets in search mode', async () => {
    renderPage();

    await vi.waitFor(() => {
      expect(screen.getByTestId('filter-panel-stub')).toHaveAttribute(
        'data-time-buckets',
        JSON.stringify([{ timeBucket: '2024-01-01', count: 12 }]),
      );
    });
  });

  it('does not fetch smart facets when the committed query is empty', async () => {
    mockPage.url = new URL('https://gallery.test/photos');

    renderPage();

    expect(sdkMock.searchSmartFacets).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(sdkMock.getFilterSuggestions).toHaveBeenCalled());
  });

  it('does not fetch smart facets when the committed query is whitespace only', async () => {
    mockPage.url = new URL('https://gallery.test/photos?q=%20%20');

    renderPage();

    expect(screen.queryByTestId('smart-search-results')).not.toBeInTheDocument();
    expect(sdkMock.searchSmartFacets).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(sdkMock.getFilterSuggestions).toHaveBeenCalled());
  });

  it('does not include sort order in the smart facet payload', async () => {
    mockPage.url = new URL('https://gallery.test/photos?q=nature&sort=asc');

    renderPage();

    await vi.waitFor(() => expect(sdkMock.searchSmartFacets).toHaveBeenCalled());
    expect(sdkMock.searchSmartFacets.mock.calls[0][0].smartSearchFacetsDto).not.toHaveProperty('order');
  });

  it('does not refetch smart facets for sort-only filter changes', async () => {
    renderPage();
    await vi.waitFor(() => expect(sdkMock.searchSmartFacets).toHaveBeenCalledTimes(1));

    await fireEvent.click(screen.getByTestId('filter-panel-set-sort-asc'));

    await waitFor(() => expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-sort-order', 'asc'));
    expect(sdkMock.searchSmartFacets).toHaveBeenCalledTimes(1);
  });

  it('keeps rendering search results when smart facets fail', async () => {
    sdkMock.searchSmartFacets.mockRejectedValueOnce(new Error('facets failed'));

    renderPage();

    await vi.waitFor(() => expect(sdkMock.searchSmartFacets).toHaveBeenCalled());
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-search-query', 'nature');
  });

  it('preserves previous facet total and buckets when a later facet fetch fails', async () => {
    renderPage();
    await vi.waitFor(() => expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-total', '12'));

    sdkMock.searchSmartFacets.mockRejectedValueOnce(new Error('facets failed'));
    await fireEvent.click(screen.getByTestId('filter-panel-set-country'));

    await vi.waitFor(() => expect(sdkMock.searchSmartFacets).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-total', '12');
    expect(screen.getByTestId('filter-panel-stub')).toHaveAttribute(
      'data-time-buckets',
      JSON.stringify([{ timeBucket: '2024-01-01', count: 12 }]),
    );
  });

  it('refetches smart facets when an active filter changes', async () => {
    renderPage();
    await vi.waitFor(() => expect(sdkMock.searchSmartFacets).toHaveBeenCalledTimes(1));

    await fireEvent.click(screen.getByTestId('filter-panel-set-country'));

    await vi.waitFor(() => expect(sdkMock.searchSmartFacets).toHaveBeenCalledTimes(2));
    expect(sdkMock.searchSmartFacets.mock.calls[1][0].smartSearchFacetsDto).toMatchObject({
      query: 'nature',
      country: 'Germany',
      withSharedSpaces: true,
    });
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-country', 'Germany');
  });

  it('refetches smart facets when the search language changes', async () => {
    renderPage();
    await vi.waitFor(() => expect(sdkMock.searchSmartFacets).toHaveBeenCalledTimes(1));

    lang.set('fr');

    await vi.waitFor(() => expect(sdkMock.searchSmartFacets).toHaveBeenCalledTimes(2));
    expect(sdkMock.searchSmartFacets.mock.calls[1][0].smartSearchFacetsDto).toMatchObject({
      query: 'nature',
      language: 'fr',
      withSharedSpaces: true,
    });
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-language', 'fr');
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

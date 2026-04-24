import TestWrapper from '$lib/components/TestWrapper.svelte';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import type { Component } from 'svelte';
import PhotosPage from './+page.svelte';

const { mockPage, mockAssetMultiSelectManager, mockAuthManager, mockMemoryManager } = vi.hoisted(() => ({
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
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/filter-panel/search-sort-dropdown.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/search-sort-dropdown.stub.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/search/smart-search-results.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/smart-search-results.stub.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/elements/SearchBar.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
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
  const { default: MockComponent } = await import('@test-data/mocks/bindable-timeline.stub.svelte');
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

describe('Photos page search URL sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPage.url = new URL('https://gallery.test/photos?q=nature');
    mockAssetMultiSelectManager.selectionActive = false;
    mockAssetMultiSelectManager.assets = [];
    mockMemoryManager.memories = [];
  });

  it('hydrates q from the URL and switches search results to relevance sorting', () => {
    renderPage();

    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-search-query', 'nature');
    expect(screen.getByTestId('search-sort-dropdown')).toHaveAttribute('data-sort-order', 'relevance');
    expect(screen.queryByTestId('timeline-stub')).not.toBeInTheDocument();
  });
});

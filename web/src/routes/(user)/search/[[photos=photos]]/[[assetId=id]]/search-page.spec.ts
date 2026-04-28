import TestWrapper from '$lib/components/TestWrapper.svelte';
import { QueryParameter } from '$lib/constants';
import { AssetVisibility, type AssetResponseDto } from '@immich/sdk';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import type { Component } from 'svelte';
import SearchPage from './+page.svelte';

const {
  mockAfterNavigate,
  mockAssetMultiSelectManager,
  mockAuthManager,
  mockFeatureFlagsManager,
  mockGlobalSearchManager,
  mockPage,
  mockRegisterSelectionContext,
  mockSearchAssets,
  mockSearchSmart,
} = vi.hoisted(() => ({
  mockAfterNavigate: vi.fn(),
  mockAssetMultiSelectManager: {
    selectionActive: false,
    assets: [],
    clear: vi.fn(),
    isAllArchived: false,
    isAllFavorite: false,
    isAllUserOwned: true,
    selectAssets: vi.fn(),
  },
  mockAuthManager: {
    preferences: { tags: { enabled: true } },
  },
  mockFeatureFlagsManager: {
    value: { smartSearch: false },
  },
  mockGlobalSearchManager: {
    open: vi.fn(),
  },
  mockPage: {
    url: new URL('https://gallery.test/search'),
    route: { id: '/(user)/search/[[photos=photos]]/[[assetId=id]]' },
    params: {},
  },
  mockRegisterSelectionContext: vi.fn(),
  mockSearchAssets: vi.fn(),
  mockSearchSmart: vi.fn(),
}));

vi.mock('$app/navigation', () => ({
  afterNavigate: mockAfterNavigate,
  goto: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('$app/state', () => ({ page: mockPage }));

vi.mock('$lib/components/ActionMenuItem.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/OnEvents.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/shared-components/LoadingSpinner.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/shared-components/context-menu/button-context-menu.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/shared-components/control-app-bar.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte', async () => {
  const { default: MockComponent } = await import('./mock-gallery-viewer.test-wrapper.svelte');
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

vi.mock('$lib/components/timeline/actions/RotateAction.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/actions/SetVisibilityAction.svelte', async () => {
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

vi.mock('$lib/managers/auth-manager.svelte', () => ({ authManager: mockAuthManager }));

vi.mock('$lib/managers/command-context-manager.svelte', () => ({
  registerSelectionContext: mockRegisterSelectionContext,
}));

vi.mock('$lib/managers/feature-flags-manager.svelte', () => ({
  featureFlagsManager: mockFeatureFlagsManager,
}));

vi.mock('$lib/managers/global-search-manager.svelte', () => ({
  globalSearchManager: mockGlobalSearchManager,
}));

vi.mock('$lib/services/asset.service', () => ({
  getAssetBulkActions: vi.fn(() => ({})),
}));

vi.mock('$lib/utils/navigation', () => ({
  isAlbumsRoute: vi.fn(() => false),
  isPeopleRoute: vi.fn(() => false),
}));

vi.mock('$lib/utils/timeline-util', () => ({
  toTimelineAsset: vi.fn((asset) => asset),
}));

vi.mock('@immich/sdk', async () => {
  const actual = await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk');
  return {
    ...actual,
    getPerson: vi.fn().mockResolvedValue({ name: 'Person' }),
    getTagById: vi.fn().mockResolvedValue({ value: 'Tag' }),
    searchAssets: mockSearchAssets,
    searchSmart: mockSearchSmart,
  };
});

function makeAsset(overrides: Partial<AssetResponseDto> = {}): AssetResponseDto {
  return {
    id: 'asset-1',
    ownerId: 'user-1',
    visibility: AssetVisibility.Timeline,
    isFavorite: false,
    isTrashed: false,
    fileCreatedAt: '2026-01-01T00:00:00.000Z',
    localDateTime: '2026-01-01T00:00:00.000Z',
    type: 'IMAGE',
    ...overrides,
  } as AssetResponseDto;
}

function renderPage() {
  return render(TestWrapper as Component<{ component: typeof SearchPage; componentProps: Record<string, never> }>, {
    component: SearchPage,
    componentProps: {},
  });
}

describe('Search page cmdk selection context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssetMultiSelectManager.selectionActive = false;
    mockAssetMultiSelectManager.assets = [];
    mockFeatureFlagsManager.value.smartSearch = false;
    mockPage.url = new URL('https://gallery.test/search');
    mockSearchAssets.mockResolvedValue({
      albums: { items: [] },
      assets: { items: [makeAsset()], nextPage: null },
    });
    mockSearchSmart.mockResolvedValue({
      albums: { items: [] },
      assets: { items: [], nextPage: null },
    });
  });

  it('registers add-to-album and visible toolbar callbacks', () => {
    renderPage();

    expect(mockRegisterSelectionContext).toHaveBeenCalledOnce();
    const options = mockRegisterSelectionContext.mock.calls[0][0];
    expect(options.getAssets()).toBe(mockAssetMultiSelectManager.assets);
    expect(options.canAddToAlbum()).toBe(true);
    expect(options.getOnFavorite()).toEqual(expect.any(Function));
    expect(options.getOnArchive()).toEqual(expect.any(Function));
    expect(options.getOnDelete()).toEqual(expect.any(Function));
    expect(options.getOnUndoDelete()).toEqual(expect.any(Function));
    expect(options.getAddSelectedToCurrentSpace?.()).toBeUndefined();
  });

  it('removes archived rows when the active visibility filter excludes archived assets', async () => {
    const query = encodeURIComponent(JSON.stringify({ visibility: AssetVisibility.Timeline }));
    mockPage.url = new URL(`https://gallery.test/search?${QueryParameter.QUERY}=${query}`);

    renderPage();

    await waitFor(() => expect(screen.getByTestId('asset-row-asset-1')).toBeInTheDocument());
    const options = mockRegisterSelectionContext.mock.calls[0][0];

    options.getOnArchive()(['asset-1'], AssetVisibility.Archive);

    await waitFor(() => expect(screen.queryByTestId('asset-row-asset-1')).not.toBeInTheDocument());
  });
});

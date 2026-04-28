import TestWrapper from '$lib/components/TestWrapper.svelte';
import type { TagResponseDto } from '@immich/sdk';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import TagsPage from './+page.svelte';

const { mockAssetMultiSelectManager, mockAuthManager, mockRegisterSelectionContext } = vi.hoisted(() => ({
  mockAssetMultiSelectManager: {
    selectionActive: false,
    assets: [],
    clear: vi.fn(),
    isAllFavorite: false,
    isAllUserOwned: true,
  },
  mockAuthManager: {
    preferences: { tags: { enabled: true } },
  },
  mockRegisterSelectionContext: vi.fn(),
}));

vi.mock('$app/navigation', () => ({ goto: vi.fn().mockResolvedValue(undefined) }));

vi.mock('$lib/components/OnEvents.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/layouts/user-page-layout.svelte', async () => {
  const { default: MockComponent } = await import('$lib/components/spaces/mock-user-page-layout.test-wrapper.svelte');
  return { default: MockComponent, headerId: 'page-header' };
});

vi.mock('$lib/components/shared-components/context-menu/button-context-menu.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/shared-components/tree/breadcrumbs.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/shared-components/tree/tree-item-thumbnails.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/shared-components/tree/tree-items.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/sidebar/sidebar.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/Timeline.svelte', async () => {
  const { default: MockComponent } =
    await import('../../../albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/mock-timeline.test-wrapper.svelte');
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

vi.mock('$lib/components/timeline/actions/SelectAllAction.svelte', async () => {
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

vi.mock('$lib/services/asset.service', () => ({
  getAssetBulkActions: vi.fn(() => ({})),
}));

vi.mock('$lib/services/tag.service', () => ({
  getTagActions: vi.fn(() => ({ Create: {}, Update: {}, Delete: {} })),
}));

vi.mock('@immich/sdk', async () => {
  const actual = await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk');
  return {
    ...actual,
    getAllTags: vi.fn().mockResolvedValue([]),
  };
});

function makeTag(overrides: Partial<TagResponseDto> = {}): TagResponseDto {
  return {
    id: 'tag-1',
    value: 'Trips',
    color: 'primary',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as TagResponseDto;
}

function renderPage() {
  const props = {
    data: {
      tags: [makeTag()],
      path: 'Trips',
      meta: { title: 'Trips' },
    },
  };

  return render(TestWrapper as Component<{ component: typeof TagsPage; componentProps: typeof props }>, {
    component: TagsPage,
    componentProps: props,
  });
}

describe('Tags page cmdk selection context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssetMultiSelectManager.selectionActive = false;
    mockAssetMultiSelectManager.assets = [];
  });

  it('registers add-to-album and visible toolbar callbacks without current-space support', () => {
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
});

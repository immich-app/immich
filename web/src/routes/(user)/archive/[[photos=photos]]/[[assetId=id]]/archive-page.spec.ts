import TestWrapper from '$lib/components/TestWrapper.svelte';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import ArchivePage from './+page.svelte';

const { mockAssetMultiSelectManager, mockRegisterSelectionContext } = vi.hoisted(() => ({
  mockAssetMultiSelectManager: {
    selectionActive: false,
    assets: [],
    clear: vi.fn(),
    isAllFavorite: false,
    isAllUserOwned: true,
  },
  mockRegisterSelectionContext: vi.fn(),
}));

vi.mock('$lib/components/layouts/user-page-layout.svelte', async () => {
  const { default: MockComponent } = await import('$lib/components/spaces/mock-user-page-layout.test-wrapper.svelte');
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

vi.mock('$lib/managers/asset-multi-select-manager.svelte', () => ({
  assetMultiSelectManager: mockAssetMultiSelectManager,
}));

vi.mock('$lib/managers/command-context-manager.svelte', () => ({
  registerSelectionContext: mockRegisterSelectionContext,
}));

vi.mock('$lib/services/asset.service', () => ({
  getAssetBulkActions: vi.fn(() => ({})),
}));

function renderPage() {
  const props = {
    data: {
      meta: { title: 'Archive' },
    },
  };

  return render(TestWrapper as Component<{ component: typeof ArchivePage; componentProps: typeof props }>, {
    component: ArchivePage,
    componentProps: props,
  });
}

describe('Archive page cmdk selection context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssetMultiSelectManager.selectionActive = false;
    mockAssetMultiSelectManager.assets = [];
  });

  it('registers add-to-album, favorite, and delete without archive or undo callbacks', () => {
    renderPage();

    expect(mockRegisterSelectionContext).toHaveBeenCalledOnce();
    const options = mockRegisterSelectionContext.mock.calls[0][0];
    expect(options.getAssets()).toBe(mockAssetMultiSelectManager.assets);
    expect(options.canAddToAlbum()).toBe(true);
    expect(options.getOnFavorite()).toEqual(expect.any(Function));
    expect(options.getOnArchive?.()).toBeUndefined();
    expect(options.getOnDelete()).toEqual(expect.any(Function));
    expect(options.getOnUndoDelete?.()).toBeUndefined();
    expect(options.getAddSelectedToCurrentSpace?.()).toBeUndefined();
  });
});

import { getAnimateMock } from '#lib/__mocks__/animate.mock.ts';
import { getResizeObserverMock } from '#lib/__mocks__/resize-observer.mock.ts';
import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { SlideshowState, slideshowStore } from '#lib/stores/slideshow.store.ts';
import { factory } from '#test/unit/factories.ts';
import { renderWithTooltips } from '#test/unit/helpers.ts';
import { updateAsset } from '@immich/sdk';
import { fireEvent, waitFor } from '@testing-library/svelte';
import AssetViewer from './AssetViewer.svelte';

vi.mock('#lib/managers/feature-flags-manager.svelte.js', () => ({
  featureFlagsManager: {
    init: vi.fn(),
    loadFeatureFlags: vi.fn(),
    value: { smartSearch: true, trash: true },
  } as never,
}));

vi.mock('#lib/stores/ocr.svelte.js', () => ({
  ocrManager: {
    clear: vi.fn(),
    getAssetOcr: vi.fn(),
    hasOcrData: false,
    showOverlay: false,
  },
}));

vi.mock('@immich/sdk', async () => {
  const sdk = await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk');
  return {
    ...sdk,
    updateAsset: vi.fn(),
  };
});

describe('AssetViewer', () => {
  beforeAll(() => {
    Element.prototype.animate = getAnimateMock();
    vi.stubGlobal('ResizeObserver', getResizeObserverMock());
  });

  afterEach(() => {
    slideshowStore.slideshowState.set(SlideshowState.None);
    authManager.reset();
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it.skip('updates the top bar favorite action after pressing favorite', async () => {
    const ownerId = 'owner-id';
    const user = factory.user({ id: ownerId });
    const asset = factory.asset({ ownerId, isFavorite: false, isTrashed: false });

    authManager.setUser(user);
    authManager.setPreferences(factory.preferences({ cast: { gCastEnabled: false } }));

    vi.mocked(updateAsset).mockResolvedValue({ ...asset, isFavorite: true });

    const { getByLabelText, queryByLabelText } = renderWithTooltips(AssetViewer, {
      cursor: { current: asset },
      showNavigation: false,
    });

    // @ts-expect-error pending a type fix: https://github.com/testing-library/jest-dom/pull/742/changes
    expect(getByLabelText('to_favorite')).toBeInTheDocument();
    expect(queryByLabelText('unfavorite')).toBeNull();

    await fireEvent.click(getByLabelText('to_favorite'));

    await waitFor(() =>
      expect(updateAsset).toHaveBeenCalledWith({ id: asset.id, updateAssetDto: { isFavorite: true } }),
    );
    // @ts-expect-error pending a type fix: https://github.com/testing-library/jest-dom/pull/742/changes
    await waitFor(() => expect(getByLabelText('unfavorite')).toBeInTheDocument());
  });
});

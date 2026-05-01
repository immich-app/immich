import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getResizeObserverMock } from '$lib/__mocks__/resize-observer.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { renderWithTooltips } from '$tests/helpers';
import { assetFactory } from '@test-data/factories/asset-factory';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import AssetViewer from './asset-viewer.svelte';

vi.mock('$lib/components/asset-viewer/asset-viewer-nav-bar.svelte', async () => {
  const { default: MockAssetViewerNavBar } = await import('./asset-viewer-nav-bar.test-wrapper.svelte');
  return { default: MockAssetViewerNavBar };
});

vi.mock('$lib/managers/feature-flags-manager.svelte', () => ({
  featureFlagsManager: {
    init: vi.fn(),
    loadFeatureFlags: vi.fn(),
    value: { smartSearch: true, trash: true },
  } as never,
}));

vi.mock('$lib/stores/ocr.svelte', () => ({
  ocrManager: {
    clear: vi.fn(),
    getAssetOcr: vi.fn(),
    hasOcrData: false,
    showOverlay: false,
  },
}));

describe('AssetViewer space context', () => {
  beforeAll(() => {
    Element.prototype.animate = getAnimateMock();
    vi.stubGlobal('ResizeObserver', getResizeObserverMock());
  });

  afterEach(() => {
    authManager.reset();
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('refreshes person updates with the current spaceId', async () => {
    const ownerId = 'owner-id';
    const asset = assetFactory.build({ ownerId });
    const refreshedAsset = assetFactory.build({ id: asset.id, ownerId, people: [] });

    authManager.setUser(userAdminFactory.build({ id: ownerId }));
    authManager.setPreferences(preferencesFactory.build({ cast: { gCastEnabled: false } }));
    sdkMock.getAssetInfo.mockResolvedValue(refreshedAsset);

    renderWithTooltips(AssetViewer, {
      cursor: { current: asset },
      showNavigation: false,
      spaceId: 'space-1',
    });

    await fireEvent.click(screen.getByLabelText('set featured photo'));

    await waitFor(() => expect(sdkMock.getAssetInfo).toHaveBeenCalledWith({ id: asset.id, spaceId: 'space-1' }));
  });
});

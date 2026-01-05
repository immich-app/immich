import { preferences as preferencesStore, resetSavedUser, user as userStore } from '$lib/stores/user.store';
import { renderWithTooltips } from '$tests/helpers';
import { assetFactory } from '@test-data/factories/asset-factory';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import '@testing-library/jest-dom';
import AssetViewerNavBar from './asset-viewer-nav-bar.svelte';

describe('AssetViewerNavBar component', () => {
  const additionalProps = {
    showCopyButton: false,
    showZoomButton: false,
    showDetailButton: false,
    showDownloadButton: false,
    showMotionPlayButton: false,
    showShareButton: false,
    preAction: () => {},
    onZoomImage: () => {},
    onAction: () => {},
    onRunJob: () => {},
    onPlaySlideshow: () => {},
    onShowDetail: () => {},
    onClose: () => {},
    playOriginalVideo: false,
    setPlayOriginalVideo: () => Promise.resolve(),
  };

  beforeAll(() => {
    Element.prototype.animate = vi.fn().mockImplementation(() => ({
      cancel: () => {},
    }));
    vi.stubGlobal(
      'ResizeObserver',
      vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() })),
    );
    vi.mock(import('$lib/managers/feature-flags-manager.svelte'), () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { featureFlagsManager: { init: vi.fn(), loadFeatureFlags: vi.fn(), value: { smartSearch: true } } as any };
    });
  });

  afterEach(() => {
    resetSavedUser();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('shows back button', () => {
    const prefs = preferencesFactory.build({ cast: { gCastEnabled: false } });
    preferencesStore.set(prefs);

    const asset = assetFactory.build({ isTrashed: false });
    const { getByLabelText } = renderWithTooltips(AssetViewerNavBar, { asset, ...additionalProps });
    expect(getByLabelText('go_back')).toBeInTheDocument();
  });

  describe('if the current user owns the asset', () => {
    it('shows delete button', () => {
      const ownerId = 'id-of-the-user';
      const user = userAdminFactory.build({ id: ownerId });
      const asset = assetFactory.build({ ownerId, isTrashed: false });
      userStore.set(user);

      const prefs = preferencesFactory.build({ cast: { gCastEnabled: false } });
      preferencesStore.set(prefs);

      const { getByLabelText } = renderWithTooltips(AssetViewerNavBar, { asset, ...additionalProps });
      expect(getByLabelText('delete')).toBeInTheDocument();
    });
  });
});

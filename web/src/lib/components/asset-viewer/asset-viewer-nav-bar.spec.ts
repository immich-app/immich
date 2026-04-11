import { getResizeObserverMock } from '$lib/__mocks__/resize-observer.mock';
import { preferences as preferencesStore, resetSavedUser, user as userStore } from '$lib/stores/user.store';
import { renderWithTooltips } from '$tests/helpers';
import { AssetTypeEnum } from '@immich/sdk';
import { assetFactory } from '@test-data/factories/asset-factory';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import '@testing-library/jest-dom';
import { setSharedLink } from '$lib/utils';
import AssetViewerNavBar from './asset-viewer-nav-bar.svelte';

describe('AssetViewerNavBar component', () => {
  const additionalProps = {
    preAction: () => {},
    onAction: () => {},
    onPlaySlideshow: () => {},
    onClose: () => {},
    playOriginalVideo: false,
    setPlayOriginalVideo: () => Promise.resolve(),
  };

  beforeAll(() => {
    Element.prototype.animate = vi.fn().mockImplementation(function () {
      return {
        cancel: () => {},
      };
    });
    vi.stubGlobal('ResizeObserver', getResizeObserverMock());
    vi.mock(import('$lib/managers/feature-flags-manager.svelte'), function () {
      return {
        featureFlagsManager: {
          init: vi.fn(),
          loadFeatureFlags: vi.fn(),
          value: { smartSearch: true, trash: true },
        } as never,
      };
    });
  });

  afterEach(() => {
    resetSavedUser();
    setSharedLink(undefined);
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

  it('does not show the more menu for guest shared links when downloads are top-level actions', () => {
    const prefs = preferencesFactory.build({ cast: { gCastEnabled: false } });
    preferencesStore.set(prefs);
    setSharedLink(sharedLinkFactory.build({ allowDownload: true }));

    const asset = assetFactory.build({ isTrashed: false });
    const { queryByLabelText } = renderWithTooltips(AssetViewerNavBar, { asset, ...additionalProps });

    expect(queryByLabelText('more')).not.toBeInTheDocument();
  });

  it('shows the shared-link download button for shared link images', () => {
    const prefs = preferencesFactory.build({ cast: { gCastEnabled: false } });
    preferencesStore.set(prefs);
    setSharedLink(sharedLinkFactory.build({ allowDownload: true }));

    const asset = assetFactory.build({ isTrashed: false, type: AssetTypeEnum.Image });
    const { getByLabelText } = renderWithTooltips(AssetViewerNavBar, { asset, ...additionalProps });

    expect(getByLabelText('download')).toBeInTheDocument();
    expect(getByLabelText('download_compressed_jpeg')).toBeInTheDocument();
  });
});

import { getResizeObserverMock } from '$lib/__mocks__/resize-observer.mock';
import { preferences as preferencesStore, resetSavedUser, user as userStore } from '$lib/stores/user.store';
import { renderWithTooltips } from '$tests/helpers';
import { assetFactory } from '@test-data/factories/asset-factory';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import '@testing-library/jest-dom';
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

  it('shows edited badge when asset is edited', () => {
    const prefs = preferencesFactory.build({ cast: { gCastEnabled: false } });
    preferencesStore.set(prefs);

    const asset = assetFactory.build({ isEdited: true, isTrashed: false });
    const { getByText } = renderWithTooltips(AssetViewerNavBar, { asset, ...additionalProps });
    expect(getByText('edited')).toBeInTheDocument();
  });

  it('does not show edited badge when asset is not edited', () => {
    const prefs = preferencesFactory.build({ cast: { gCastEnabled: false } });
    preferencesStore.set(prefs);

    const asset = assetFactory.build({ isEdited: false, isTrashed: false });
    const { queryByText } = renderWithTooltips(AssetViewerNavBar, { asset, ...additionalProps });
    expect(queryByText('edited')).not.toBeInTheDocument();
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

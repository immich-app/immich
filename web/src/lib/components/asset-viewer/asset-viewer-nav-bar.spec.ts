import { resetSavedUser, user as userStore } from '$lib/stores/user.store';
import { assetFactory } from '@test-data/factories/asset-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import AssetViewerNavBar from './asset-viewer-nav-bar.svelte';

describe('AssetViewerNavBar component', () => {
  const additionalProps = {
    showCopyButton: false,
    showZoomButton: false,
    showDetailButton: false,
    showDownloadButton: false,
    showMotionPlayButton: false,
    showShareButton: false,
    onZoomImage: () => {},
    onRotateImage: () => {},
    onCopyImage: () => {},
    onAction: () => {},
    onRunJob: () => {},
    onPlaySlideshow: () => {},
    onShowDetail: () => {},
    onClose: () => {},
  };

  beforeAll(() => {
    Element.prototype.animate = vi.fn().mockImplementation(() => ({
      cancel: () => {},
    }));
    vi.stubGlobal(
      'ResizeObserver',
      vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() })),
    );
  });

  afterEach(() => {
    resetSavedUser();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('shows back button', () => {
    const asset = assetFactory.build({ isTrashed: false });
    const { getByTitle } = render(AssetViewerNavBar, { asset, ...additionalProps });
    expect(getByTitle('go_back')).toBeInTheDocument();
  });

  describe('if the current user owns the asset', () => {
    it('shows delete button', () => {
      const ownerId = 'id-of-the-user';
      const user = userAdminFactory.build({ id: ownerId });
      const asset = assetFactory.build({ ownerId, isTrashed: false });
      userStore.set(user);
      const { getByTitle } = render(AssetViewerNavBar, { asset, ...additionalProps });
      expect(getByTitle('delete')).toBeInTheDocument();
    });
  });
});

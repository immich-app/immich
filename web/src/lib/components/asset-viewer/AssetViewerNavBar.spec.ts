import { getResizeObserverMock } from '#lib/__mocks__/resize-observer.mock.ts';
import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
import { factory } from '#test/unit/factories.ts';
import { renderWithTooltips } from '#test/unit/helpers.ts';
import type { UserConfigDto } from '@immich/sdk';
import '@testing-library/jest-dom';
import AssetViewerNavBar from './AssetViewerNavBar.svelte';

vi.mock(import('#lib/managers/feature-flags-manager.svelte.js'), function () {
  return {
    featureFlagsManager: {
      init: vi.fn(),
      loadFeatureFlags: vi.fn(),
      value: { smartSearch: true, trash: true },
    } as never,
  };
});

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
  });

  afterEach(() => {
    authManager.reset();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('shows back button', () => {
    const preferences = factory.preferences({ cast: { gCastEnabled: false } });
    authManager.setPreferences(preferences);

    const asset = factory.asset({ isTrashed: false });
    const { getByLabelText } = renderWithTooltips(AssetViewerNavBar, { asset, ...additionalProps });
    // @ts-expect-error pending a type fix: https://github.com/testing-library/jest-dom/pull/742/changes
    expect(getByLabelText('go_back')).toBeInTheDocument();
  });

  describe('if the current user owns the asset', () => {
    it('shows delete button', () => {
      const ownerId = 'id-of-the-user';
      const user = factory.user({ id: ownerId });
      const asset = factory.asset({ ownerId, isTrashed: false });
      authManager.setUser(user);
      queryClient.setQueryData(getUserConfigQuery().queryKey, {
        machineLearning: {
          enabled: true,
          clip: { enabled: true },
          duplicateDetection: { enabled: true },
          facialRecognition: { enabled: true },
          ocr: { enabled: true },
        },
        trash: { enabled: true, days: 30 },
      } as UserConfigDto);

      const preferences = factory.preferences({ cast: { gCastEnabled: false } });
      authManager.setPreferences(preferences);

      const { getByLabelText } = renderWithTooltips(AssetViewerNavBar, { asset, ...additionalProps });
      // @ts-expect-error pending a type fix: https://github.com/testing-library/jest-dom/pull/742/changes
      expect(getByLabelText('delete')).toBeInTheDocument();
    });
  });
});

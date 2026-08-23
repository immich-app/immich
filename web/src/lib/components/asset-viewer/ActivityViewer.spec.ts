import { faker } from '@faker-js/faker';
import { AlbumUserRole, AssetTypeEnum, ReactionType, type ActivityResponseDto } from '@immich/sdk';
import '@testing-library/jest-dom';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getResizeObserverMock } from '$lib/__mocks__/resize-observer.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import ActivityViewer from '$lib/components/asset-viewer/ActivityViewer.svelte';
import { activityManager } from '$lib/managers/activity-manager.svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { Route } from '$lib/route';
import { renderWithTooltips } from '$tests/helpers';
import { activityFactory } from '@test-data/factories/activity-factory';
import { userAdminFactory, userFactory } from '@test-data/factories/user-factory';

describe('ActivityViewer component', () => {
  let albumId: string;
  const adder = userFactory.build();

  const assetAddedGroup = (count: number, overrides: Partial<ActivityResponseDto> = {}) =>
    activityFactory.buildList(count, {
      type: ReactionType.AssetAdded,
      assetType: AssetTypeEnum.Image,
      groupId: faker.string.uuid(),
      user: adder,
      ...overrides,
    });

  const mockActivities = (activities: ActivityResponseDto[]) => {
    sdkMock.getActivities.mockImplementation((params) => Promise.resolve(params.withAdditions ? activities : []));
  };

  const renderViewer = async () => {
    await activityManager.init(albumId);
    return renderWithTooltips(ActivityViewer, {
      albumId,
      albumUsers: [{ user: userFactory.build(), role: AlbumUserRole.Editor }],
      disabled: false,
    });
  };

  const tileLinks = (container: HTMLElement) =>
    [...container.querySelectorAll('a')].filter((link) =>
      link.getAttribute('href')?.startsWith(`/albums/${albumId}/photos/`),
    );

  const tileLink = (container: HTMLElement, assetId: string) =>
    tileLinks(container).find((link) => link.getAttribute('href') === Route.viewAlbumAsset({ albumId, assetId }));

  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');

    Element.prototype.animate = getAnimateMock();
    vi.stubGlobal('ResizeObserver', getResizeObserverMock());
    Object.defineProperties(HTMLElement.prototype, {
      offsetHeight: { configurable: true, get: () => 800 },
      clientHeight: { configurable: true, get: () => 100 },
    });
  });

  afterAll(() => {
    delete (HTMLElement.prototype as { offsetHeight?: number }).offsetHeight;
    delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight;
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    activityManager.reset();
    albumId = faker.string.uuid();
    authManager.setUser(userAdminFactory.build());

    sdkMock.getActivityStatistics.mockResolvedValue({ comments: 0, likes: 0 });
  });

  afterEach(() => {
    cleanup();
    authManager.reset();
  });

  describe('header', () => {
    it('describes an image-only group as photos', async () => {
      mockActivities(assetAddedGroup(2));

      await renderViewer();

      expect(await screen.findByText(`${adder.name} added 2 photos`)).toBeInTheDocument();
    });

    it('uses the singular form for a single asset', async () => {
      mockActivities(assetAddedGroup(1));

      await renderViewer();

      expect(await screen.findByText(`${adder.name} added a photo`)).toBeInTheDocument();
    });

    it('describes a video-only group as videos', async () => {
      mockActivities(assetAddedGroup(2, { assetType: AssetTypeEnum.Video }));

      await renderViewer();

      expect(await screen.findByText(`${adder.name} added 2 videos`)).toBeInTheDocument();
    });

    it('describes a mixed-media group as items', async () => {
      const groupId = faker.string.uuid();
      mockActivities([
        ...assetAddedGroup(1, { groupId, assetType: AssetTypeEnum.Video }),
        ...assetAddedGroup(1, { groupId }),
      ]);

      await renderViewer();

      expect(await screen.findByText(`${adder.name} added 2 items`)).toBeInTheDocument();
    });
  });

  describe('thumbnails', () => {
    it('marks only video tiles with a play icon', async () => {
      const groupId = faker.string.uuid();
      const image = assetAddedGroup(1, { groupId })[0];
      const videos = assetAddedGroup(2, { groupId, assetType: AssetTypeEnum.Video });
      mockActivities([image, ...videos]);

      const { container } = await renderViewer();

      expect(await screen.findByText(`${adder.name} added 3 items`)).toBeInTheDocument();

      for (const video of videos) {
        expect(tileLink(container, video.assetId!)?.querySelector('svg')).not.toBeNull();
      }
      expect(tileLink(container, image.assetId!)?.querySelector('svg')).toBeNull();
    });

    it('shows no play icon for an image-only group', async () => {
      mockActivities(assetAddedGroup(2));

      const { container } = await renderViewer();

      expect(await screen.findByText(`${adder.name} added 2 photos`)).toBeInTheDocument();

      const tiles = tileLinks(container);
      expect(tiles).toHaveLength(2);
      for (const tile of tiles) {
        expect(tile.querySelector('svg')).toBeNull();
      }
    });

    it('collapses a large group behind a +N tile that expands on tap', async () => {
      mockActivities(assetAddedGroup(12));

      const { container } = await renderViewer();

      expect(await screen.findByText(`${adder.name} added 12 photos`)).toBeInTheDocument();

      expect(tileLinks(container)).toHaveLength(9);
      expect(screen.getByText('+3')).toBeInTheDocument();

      await fireEvent.click(screen.getByText('+3'));

      await waitFor(() => expect(tileLinks(container)).toHaveLength(12));
      expect(screen.queryByText('+3')).toBeNull();
    });

    it('shows all thumbnails without an overlay at exactly the limit', async () => {
      mockActivities(assetAddedGroup(10));

      const { container } = await renderViewer();

      expect(await screen.findByText(`${adder.name} added 10 photos`)).toBeInTheDocument();

      expect(tileLinks(container)).toHaveLength(10);
      expect(screen.queryByText(/^\+\d+$/)).toBeNull();
    });

    it('links each thumbnail to the asset viewer', async () => {
      const activity = assetAddedGroup(1)[0];
      mockActivities([activity]);

      const { container } = await renderViewer();

      expect(await screen.findByText(`${adder.name} added a photo`)).toBeInTheDocument();

      expect(tileLink(container, activity.assetId!)).toBeDefined();
    });
  });
});

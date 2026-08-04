import { faker } from '@faker-js/faker';
import { AlbumUserRole, AssetTypeEnum, ReactionType, type ActivityResponseDto } from '@immich/sdk';
import '@testing-library/jest-dom';
import { cleanup, screen } from '@testing-library/svelte';
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

// media-type variations of the "user added ..."
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

  const renderViewer = () =>
    renderWithTooltips(ActivityViewer, {
      albumId,
      albumUsers: [{ user: userFactory.build(), role: AlbumUserRole.Editor }],
      disabled: false,
    });

  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');

    Element.prototype.animate = getAnimateMock();
    vi.stubGlobal('ResizeObserver', getResizeObserverMock());
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 800 });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 100 });
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

  it('describes a video-only group as videos', async () => {
    mockActivities(assetAddedGroup(2, { assetType: AssetTypeEnum.Video }));

    renderViewer();

    expect(await screen.findByText(`${adder.name} added 2 videos`)).toBeInTheDocument();
  });

  it('describes a mixed-media group as items', async () => {
    const groupId = faker.string.uuid();
    mockActivities([
      ...assetAddedGroup(1, { groupId, assetType: AssetTypeEnum.Video }),
      ...assetAddedGroup(1, { groupId }),
    ]);

    renderViewer();

    expect(await screen.findByText(`${adder.name} added 2 items`)).toBeInTheDocument();
  });

  it('marks video thumbnails with a play icon', async () => {
    const groupId = faker.string.uuid();
    const video = assetAddedGroup(1, { groupId, assetType: AssetTypeEnum.Video })[0];
    const image = assetAddedGroup(1, { groupId })[0];
    mockActivities([video, image]);

    const { container } = renderViewer();

    expect(await screen.findByText(`${adder.name} added 2 items`)).toBeInTheDocument();

    const videoTile = container.querySelector(
      `a[href="${Route.viewAlbumAsset({ albumId, assetId: video.assetId! })}"]`,
    );
    const imageTile = container.querySelector(
      `a[href="${Route.viewAlbumAsset({ albumId, assetId: image.assetId! })}"]`,
    );
    expect(videoTile?.querySelector('svg')).not.toBeNull();
    expect(imageTile?.querySelector('svg')).toBeNull();
  });
});

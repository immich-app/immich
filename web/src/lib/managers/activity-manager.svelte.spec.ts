import { faker } from '@faker-js/faker';
import { ReactionType, type ActivityResponseDto } from '@immich/sdk';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { activityManager } from '$lib/managers/activity-manager.svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { activityFactory } from '@test-data/factories/activity-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';

describe('ActivityManager', () => {
  let albumId: string;

  const mockActivities = (activities: ActivityResponseDto[]) => {
    sdkMock.getActivities.mockImplementation((params) => Promise.resolve(params.withAdditions ? activities : []));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    activityManager.reset();
    albumId = faker.string.uuid();
    authManager.setUser(userAdminFactory.build());

    mockActivities([]);
    sdkMock.getActivityStatistics.mockResolvedValue({ comments: 0, likes: 0 });
    sdkMock.deleteActivity.mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    authManager.reset();
  });

  describe('AlbumAddAssets event', () => {
    it('refetches the current album', async () => {
      await activityManager.init(albumId);
      const callCount = sdkMock.getActivities.mock.calls.length;

      eventManager.emit('AlbumAddAssets', { assetIds: [faker.string.uuid()], albumIds: [albumId] });

      await vi.waitFor(() => expect(sdkMock.getActivities.mock.calls.length).toBe(callCount + 2));
    });

    it('keeps the cache of other albums', async () => {
      await activityManager.init(albumId);
      const callCount = sdkMock.getActivities.mock.calls.length;

      eventManager.emit('AlbumAddAssets', { assetIds: [faker.string.uuid()], albumIds: [faker.string.uuid()] });

      await activityManager.refreshActivities(albumId);
      expect(sdkMock.getActivities.mock.calls.length).toBe(callCount);
    });
  });

  describe('deleteActivity', () => {
    it('ignores asset additions', async () => {
      const added = activityFactory.build({ type: ReactionType.AssetAdded });
      mockActivities([added]);
      sdkMock.getActivityStatistics.mockResolvedValue({ comments: 2, likes: 1 });
      await activityManager.init(albumId);

      await activityManager.deleteActivity(added);

      expect(sdkMock.deleteActivity).not.toHaveBeenCalled();
      expect(activityManager.activities).toEqual([added]);
      expect(activityManager.commentCount).toBe(2);
      expect(activityManager.likeCount).toBe(1);
    });
  });
});

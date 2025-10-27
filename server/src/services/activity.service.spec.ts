import { BadRequestException } from '@nestjs/common';
import { ReactionLevel, ReactionType } from 'src/dtos/activity.dto';
import { ActivityService } from 'src/services/activity.service';
import { factory, newUuid, newUuids } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe(ActivityService.name, () => {
  let sut: ActivityService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(ActivityService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getAll', () => {
    it('should get all', async () => {
      const [albumId, assetId, userId] = newUuids();

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([]);

      await expect(sut.getAll(factory.auth({ user: { id: userId } }), { assetId, albumId })).resolves.toEqual([]);

      expect(mocks.activity.search).toHaveBeenCalledTimes(1);
      expect(mocks.activity.search).toHaveBeenCalledWith(
        expect.objectContaining({
          assetId,
          albumId,
          isLiked: undefined,
          userId: undefined,
          includeAlbumUpdates: false,
          albumUpdateAssetLimit: 3,
        }),
      );
    });

    it('should filter by type=like', async () => {
      const [albumId, assetId, userId] = newUuids();

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([]);

      await expect(
        sut.getAll(factory.auth({ user: { id: userId } }), { assetId, albumId, type: ReactionType.LIKE }),
      ).resolves.toEqual([]);

      expect(mocks.activity.search).toHaveBeenCalledTimes(1);
      expect(mocks.activity.search).toHaveBeenCalledWith(
        expect.objectContaining({
          assetId,
          albumId,
          isLiked: true,
          userId: undefined,
          includeAlbumUpdates: false,
          albumUpdateAssetLimit: 3,
        }),
      );
    });

    it('should filter by type=comment', async () => {
      const [albumId, assetId] = newUuids();

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([]);

      await expect(sut.getAll(factory.auth(), { assetId, albumId, type: ReactionType.COMMENT })).resolves.toEqual([]);

      expect(mocks.activity.search).toHaveBeenCalledTimes(1);
      expect(mocks.activity.search).toHaveBeenCalledWith(
        expect.objectContaining({
          assetId,
          albumId,
          isLiked: false,
          userId: undefined,
          includeAlbumUpdates: false,
          albumUpdateAssetLimit: 3,
        }),
      );
    });

    it('should return album updates when type=album_update', async () => {
      const [albumId, aggregationId, assetId] = newUuids();
      const createdAt = new Date('2024-01-01T00:00:00.000Z');
      const user = factory.user();

      const activity = factory.activity({
        id: aggregationId,
        aggregationId,
        assetIds: [assetId],
        albumId,
        assetId: null,
        comment: null,
        createdAt,
        user,
        userId: user.id,
      });

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([activity]);

      const result = await sut.getAll(factory.auth(), {
        albumId,
        type: ReactionType.ALBUM_UPDATE,
        includeAlbumUpdate: true,
      });

      expect(result).toEqual([
        expect.objectContaining({
          id: aggregationId,
          type: ReactionType.ALBUM_UPDATE,
          albumUpdate: {
            aggregationId,
            totalAssets: 1,
            assetIds: [assetId],
          },
        }),
      ]);
      expect(result[0].user.id).toBe(user.id);
      expect(mocks.activity.search).toHaveBeenCalledTimes(1);
      expect(mocks.activity.search).toHaveBeenCalledWith(
        expect.objectContaining({
          albumId,
          assetId: undefined,
          includeAlbumUpdates: true,
          albumUpdateAssetLimit: 3,
          userId: undefined,
        }),
      );
    });

    it('should include album updates for album level requests', async () => {
      const [albumId, activityAssetId, aggregationId] = newUuids();
      const createdAt = new Date('2024-04-01T00:00:00.000Z');
      const user = factory.user();
      const activity = factory.activity({ albumId, assetId: activityAssetId, createdAt: new Date('2024-03-01') });

      const albumUpdate = factory.activity({
        id: aggregationId,
        aggregationId,
        assetIds: ['asset-1', 'asset-2'],
        albumId,
        assetId: null,
        comment: null,
        createdAt,
        user,
        userId: user.id,
      });

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([activity, albumUpdate]);

      const result = await sut.getAll(factory.auth(), {
        albumId,
        level: ReactionLevel.ALBUM,
        includeAlbumUpdate: true,
      });

      expect(result).toHaveLength(2);
      expect(result[0].createdAt <= result[1].createdAt).toBeTruthy();
      expect(result.find((item) => item.type === ReactionType.ALBUM_UPDATE)?.albumUpdate).toBeDefined();
      expect(mocks.activity.search).toHaveBeenCalledTimes(1);
      expect(mocks.activity.search).toHaveBeenCalledWith(
        expect.objectContaining({
          assetId: null,
          albumId,
          isLiked: undefined,
          userId: undefined,
          includeAlbumUpdates: true,
          albumUpdateAssetLimit: 3,
        }),
      );
    });
  });

  describe('getStatistics', () => {
    it('should get the comment and like count', async () => {
      const [albumId, assetId] = newUuids();

      mocks.activity.getStatistics.mockResolvedValue({ comments: 1, likes: 3 });
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));

      await expect(sut.getStatistics(factory.auth(), { assetId, albumId })).resolves.toEqual({ comments: 1, likes: 3 });
    });
  });

  describe('addComment', () => {
    it('should require access to the album', async () => {
      const [albumId, assetId] = newUuids();

      await expect(
        sut.create(factory.auth(), { albumId, assetId, type: ReactionType.COMMENT, comment: 'comment' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create a comment', async () => {
      const [albumId, assetId, userId] = newUuids();
      const activity = factory.activity({ albumId, assetId, userId });

      mocks.access.activity.checkCreateAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.create.mockResolvedValue(activity);

      await sut.create(factory.auth({ user: { id: userId } }), {
        albumId,
        assetId,
        type: ReactionType.COMMENT,
        comment: 'comment',
      });

      expect(mocks.activity.create).toHaveBeenCalledWith({
        userId: activity.userId,
        albumId: activity.albumId,
        assetId: activity.assetId,
        comment: 'comment',
        isLiked: false,
      });
    });

    it('should fail because activity is disabled for the album', async () => {
      const [albumId, assetId] = newUuids();
      const activity = factory.activity({ albumId, assetId });

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.create.mockResolvedValue(activity);

      await expect(
        sut.create(factory.auth(), { albumId, assetId, type: ReactionType.COMMENT, comment: 'comment' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create a like', async () => {
      const [albumId, assetId, userId] = newUuids();
      const activity = factory.activity({ userId, albumId, assetId, isLiked: true });

      mocks.access.activity.checkCreateAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.create.mockResolvedValue(activity);
      mocks.activity.search.mockResolvedValue([]);

      await sut.create(factory.auth({ user: { id: userId } }), { albumId, assetId, type: ReactionType.LIKE });

      expect(mocks.activity.create).toHaveBeenCalledWith({ userId: activity.userId, albumId, assetId, isLiked: true });
    });

    it('should skip if like exists', async () => {
      const [albumId, assetId] = newUuids();
      const activity = factory.activity({ albumId, assetId, isLiked: true });

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.access.activity.checkCreateAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([activity]);

      await sut.create(factory.auth(), { albumId, assetId, type: ReactionType.LIKE });

      expect(mocks.activity.create).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should require access', async () => {
      await expect(sut.delete(factory.auth(), newUuid())).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.activity.delete).not.toHaveBeenCalled();
    });

    it('should let the activity owner delete a comment', async () => {
      const activity = factory.activity();

      mocks.access.activity.checkOwnerAccess.mockResolvedValue(new Set([activity.id]));
      mocks.activity.delete.mockResolvedValue();

      await sut.delete(factory.auth(), activity.id);

      expect(mocks.activity.delete).toHaveBeenCalledWith(activity.id);
    });

    it('should let the album owner delete a comment', async () => {
      const activity = factory.activity();

      mocks.access.activity.checkAlbumOwnerAccess.mockResolvedValue(new Set([activity.id]));
      mocks.activity.delete.mockResolvedValue();

      await sut.delete(factory.auth(), activity.id);

      expect(mocks.activity.delete).toHaveBeenCalledWith(activity.id);
    });
  });
});

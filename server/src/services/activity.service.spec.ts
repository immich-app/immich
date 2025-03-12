import { BadRequestException } from '@nestjs/common';
import { ReactionType } from 'src/dtos/activity.dto';
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

      await expect(sut.getAll(factory.auth({ id: userId }), { assetId, albumId })).resolves.toEqual([]);

      expect(mocks.activity.search).toHaveBeenCalledWith({ assetId, albumId, isLiked: undefined });
    });

    it('should filter by type=like', async () => {
      const [albumId, assetId, userId] = newUuids();

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([]);

      await expect(
        sut.getAll(factory.auth({ id: userId }), { assetId, albumId, type: ReactionType.LIKE }),
      ).resolves.toEqual([]);

      expect(mocks.activity.search).toHaveBeenCalledWith({ assetId, albumId, isLiked: true });
    });

    it('should filter by type=comment', async () => {
      const [albumId, assetId] = newUuids();

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([]);

      await expect(sut.getAll(factory.auth(), { assetId, albumId, type: ReactionType.COMMENT })).resolves.toEqual([]);

      expect(mocks.activity.search).toHaveBeenCalledWith({ assetId, albumId, isLiked: false });
    });
  });

  describe('getStatistics', () => {
    it('should get the comment count', async () => {
      const [albumId, assetId] = newUuids();

      mocks.activity.getStatistics.mockResolvedValue(1);
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));

      await expect(sut.getStatistics(factory.auth(), { assetId, albumId })).resolves.toEqual({ comments: 1 });
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

      await sut.create(factory.auth({ id: userId }), {
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

      await sut.create(factory.auth({ id: userId }), { albumId, assetId, type: ReactionType.LIKE });

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

import { BadRequestException } from '@nestjs/common';
import { ReactionType } from 'src/dtos/activity.dto';
import { ActivityService } from 'src/services/activity.service';
import { ActivityFactory } from 'test/factories/activity.factory';
import { AuthFactory } from 'test/factories/auth.factory';
import { getForActivity } from 'test/mappers';
import { newUuid, newUuids } from 'test/small.factory';
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

      await expect(sut.getAll(AuthFactory.create({ id: userId }), { assetId, albumId })).resolves.toEqual([]);

      expect(mocks.activity.search).toHaveBeenCalledWith({ assetId, albumId, isLiked: undefined });
    });

    it('should filter by type=like', async () => {
      const [albumId, assetId, userId] = newUuids();

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([]);

      await expect(
        sut.getAll(AuthFactory.create({ id: userId }), { assetId, albumId, type: ReactionType.LIKE }),
      ).resolves.toEqual([]);

      expect(mocks.activity.search).toHaveBeenCalledWith({ assetId, albumId, isLiked: true });
    });

    it('should filter by type=comment', async () => {
      const [albumId, assetId] = newUuids();

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([]);

      await expect(sut.getAll(AuthFactory.create(), { assetId, albumId, type: ReactionType.COMMENT })).resolves.toEqual(
        [],
      );

      expect(mocks.activity.search).toHaveBeenCalledWith({ assetId, albumId, isLiked: false });
    });
  });

  describe('getStatistics', () => {
    it('should get the comment and like count', async () => {
      const [albumId, assetId] = newUuids();

      mocks.activity.getStatistics.mockResolvedValue({ comments: 1, likes: 3 });
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));

      await expect(sut.getStatistics(AuthFactory.create(), { assetId, albumId })).resolves.toEqual({
        comments: 1,
        likes: 3,
      });
    });
  });

  describe('addComment', () => {
    it('should require access to the album', async () => {
      const [albumId, assetId] = newUuids();

      await expect(
        sut.create(AuthFactory.create(), { albumId, assetId, type: ReactionType.COMMENT, comment: 'comment' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create a comment', async () => {
      const [albumId, assetId, userId] = newUuids();
      const activity = ActivityFactory.create({ albumId, assetId, userId });

      mocks.access.activity.checkCreateAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.create.mockResolvedValue(getForActivity(activity));

      await sut.create(AuthFactory.create({ id: userId }), {
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
      const activity = ActivityFactory.create({ albumId, assetId });

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.create.mockResolvedValue(getForActivity(activity));

      await expect(
        sut.create(AuthFactory.create(), { albumId, assetId, type: ReactionType.COMMENT, comment: 'comment' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create a like', async () => {
      const [albumId, assetId, userId] = newUuids();
      const activity = ActivityFactory.create({ userId, albumId, assetId, isLiked: true });

      mocks.access.activity.checkCreateAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.create.mockResolvedValue(getForActivity(activity));
      mocks.activity.search.mockResolvedValue([]);

      await sut.create(AuthFactory.create({ id: userId }), { albumId, assetId, type: ReactionType.LIKE });

      expect(mocks.activity.create).toHaveBeenCalledWith({ userId: activity.userId, albumId, assetId, isLiked: true });
    });

    it('should skip if like exists', async () => {
      const [albumId, assetId] = newUuids();
      const activity = ActivityFactory.create({ albumId, assetId, isLiked: true });

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.access.activity.checkCreateAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([getForActivity(activity)]);

      await sut.create(AuthFactory.create(), { albumId, assetId, type: ReactionType.LIKE });

      expect(mocks.activity.create).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should require access', async () => {
      await expect(sut.delete(AuthFactory.create(), newUuid())).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.activity.delete).not.toHaveBeenCalled();
    });

    it('should let the activity owner delete a comment', async () => {
      const activity = ActivityFactory.create();

      mocks.access.activity.checkOwnerAccess.mockResolvedValue(new Set([activity.id]));
      mocks.activity.delete.mockResolvedValue();

      await sut.delete(AuthFactory.create(), activity.id);

      expect(mocks.activity.delete).toHaveBeenCalledWith(activity.id);
    });

    it('should let the album owner delete a comment', async () => {
      const activity = ActivityFactory.create();

      mocks.access.activity.checkAlbumOwnerAccess.mockResolvedValue(new Set([activity.id]));
      mocks.activity.delete.mockResolvedValue();

      await sut.delete(AuthFactory.create(), activity.id);

      expect(mocks.activity.delete).toHaveBeenCalledWith(activity.id);
    });
  });
});

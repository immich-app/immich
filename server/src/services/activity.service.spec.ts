import { BadRequestException } from '@nestjs/common';
import { buildAssetAdditionId, ReactionType } from 'src/dtos/activity.dto';
import { AssetType } from 'src/enum';
import { ActivityService } from 'src/services/activity.service';
import { ActivityFactory } from 'test/factories/activity.factory';
import { AuthFactory } from 'test/factories/auth.factory';
import { UserFactory } from 'test/factories/user.factory';
import { getDehydrated, getForActivity } from 'test/mappers';
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

    it('should not query asset additions by default', async () => {
      const [albumId, userId] = newUuids();

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([]);

      await expect(sut.getAll(AuthFactory.create({ id: userId }), { albumId })).resolves.toEqual([]);

      expect(mocks.activity.search).toHaveBeenCalled();
      expect(mocks.activity.searchAssetAdditions).not.toHaveBeenCalled();
    });

    it('should merge reactions and asset additions sorted by createdAt when withAdditions is set', async () => {
      const [albumId, assetId1, assetId2, userId] = newUuids();
      const user = getDehydrated(UserFactory.create());
      const earlier = new Date('2026-01-01T00:00:00Z');
      const later = new Date('2026-01-03T00:00:00Z');
      const comment = ActivityFactory.create({
        albumId,
        comment: 'middle',
        createdAt: new Date('2026-01-02T00:00:00Z'),
      });

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([getForActivity(comment)]);
      mocks.activity.searchAssetAdditions.mockResolvedValue([
        { albumId, assetId: assetId1, assetType: AssetType.Image, createdAt: earlier, user },
        { albumId, assetId: assetId2, assetType: AssetType.Video, createdAt: later, user },
      ]);

      const result = await sut.getAll(AuthFactory.create({ id: userId }), { albumId, withAdditions: true });

      expect(mocks.activity.search).toHaveBeenCalledWith({ albumId, isLiked: undefined });
      expect(mocks.activity.searchAssetAdditions).toHaveBeenCalledWith({ albumId });
      expect(result).toEqual([
        expect.objectContaining({
          id: buildAssetAdditionId(albumId, assetId1),
          assetId: assetId1,
          assetType: AssetType.Image,
          comment: null,
          createdAt: earlier,
          type: ReactionType.ASSET_ADDED,
          groupId: `asset_added|${albumId}|${user.id}|${earlier.toISOString()}`,
          user: expect.objectContaining({ id: user.id }),
        }),
        expect.objectContaining({ id: comment.id, type: ReactionType.COMMENT }),
        expect.objectContaining({
          id: buildAssetAdditionId(albumId, assetId2),
          assetType: AssetType.Video,
          createdAt: later,
          groupId: `asset_added|${albumId}|${user.id}|${later.toISOString()}`,
        }),
      ]);
    });

    it('should keep a batch of additions adjacent when a reaction shares their timestamp', async () => {
      const [albumId, assetId1, assetId2, userId] = newUuids();
      const user = getDehydrated(UserFactory.create());
      const createdAt = new Date('2026-01-01T00:00:00Z');
      const comment = ActivityFactory.create({ albumId, comment: 'same instant', createdAt });

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([getForActivity(comment)]);
      mocks.activity.searchAssetAdditions.mockResolvedValue([
        { albumId, assetId: assetId1, assetType: AssetType.Image, createdAt, user },
        { albumId, assetId: assetId2, assetType: AssetType.Image, createdAt, user },
      ]);

      const result = await sut.getAll(AuthFactory.create({ id: userId }), { albumId, withAdditions: true });

      expect(result.map(({ type }) => type)).toEqual([
        ReactionType.COMMENT,
        ReactionType.ASSET_ADDED,
        ReactionType.ASSET_ADDED,
      ]);
      expect(result[1].groupId).toEqual(result[2].groupId);
    });

    it('should not query asset additions for asset-level queries', async () => {
      const [albumId, assetId] = newUuids();

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([]);

      await expect(sut.getAll(AuthFactory.create(), { albumId, assetId, withAdditions: true })).resolves.toEqual([]);

      expect(mocks.activity.searchAssetAdditions).not.toHaveBeenCalled();
    });

    it('should filter by type=asset_added', async () => {
      const [albumId, assetId, userId] = newUuids();

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.searchAssetAdditions.mockResolvedValue([]);

      await expect(
        sut.getAll(AuthFactory.create(), { albumId, assetId, userId, type: ReactionType.ASSET_ADDED }),
      ).resolves.toEqual([]);

      expect(mocks.activity.search).not.toHaveBeenCalled();
      expect(mocks.activity.searchAssetAdditions).toHaveBeenCalledWith({ albumId, assetId, userId });
    });

    it('should not query asset additions when filtering by type=like', async () => {
      const [albumId, userId] = newUuids();

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([]);

      await expect(
        sut.getAll(AuthFactory.create({ id: userId }), { albumId, type: ReactionType.LIKE, withAdditions: true }),
      ).resolves.toEqual([]);

      expect(mocks.activity.searchAssetAdditions).not.toHaveBeenCalled();
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

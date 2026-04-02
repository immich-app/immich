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

    it('should reverse paginated results to ASC order', async () => {
      const [albumId] = newUuids();
      const t1 = new Date('2024-01-01T00:00:00Z');
      const t2 = new Date('2024-01-02T00:00:00Z');
      const a1 = factory.activity({ albumId, createdAt: t1 });
      const a2 = factory.activity({ albumId, createdAt: t2 });

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search
        .mockResolvedValueOnce([a2, a1]) // main query: DESC
        .mockResolvedValueOnce([]); // boundary query

      const result = await sut.getAll(factory.auth(), { albumId, take: 2 });

      expect(result[0].id).toBe(a1.id);
      expect(result[1].id).toBe(a2.id);
    });

    it('should return empty array when paginated with no results', async () => {
      const [albumId] = newUuids();

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([]);

      const result = await sut.getAll(factory.auth(), { albumId, take: 2 });

      expect(result).toEqual([]);
      expect(mocks.activity.search).toHaveBeenCalledTimes(1);
    });

    it('should fetch boundary extras and prepend new ones', async () => {
      const [albumId] = newUuids();
      const boundaryTime = new Date('2024-01-01T00:00:00Z');
      const a1 = factory.activity({ albumId, createdAt: boundaryTime });
      const a2 = factory.activity({ albumId, createdAt: new Date('2024-01-02T00:00:00Z') });
      const extra = factory.activity({ albumId, createdAt: boundaryTime });

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search
        .mockResolvedValueOnce([a2, a1]) // main query: DESC
        .mockResolvedValueOnce([a1, extra]); // boundary query: both items at boundaryTime

      const result = await sut.getAll(factory.auth(), { albumId, take: 2 });

      // extra is prepended, a1 is not duplicated
      expect(result.map((r) => r.id)).toEqual([extra.id, a1.id, a2.id]);
    });

    it('should not duplicate items already loaded at boundary time', async () => {
      const [albumId] = newUuids();
      const boundaryTime = new Date('2024-01-01T00:00:00Z');
      const a1 = factory.activity({ albumId, createdAt: boundaryTime });
      const a2 = factory.activity({ albumId, createdAt: boundaryTime });

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search
        .mockResolvedValueOnce([a2, a1]) // main query: both at boundary
        .mockResolvedValueOnce([a1, a2]); // boundary query: same items

      const result = await sut.getAll(factory.auth(), { albumId, take: 2 });

      expect(result.map((r) => r.id)).toEqual([a1.id, a2.id]);
    });

    it('should include all boundary extras even when they exceed take', async () => {
      const [albumId] = newUuids();
      const boundaryTime = new Date('2024-01-01T00:00:00Z');
      const a1 = factory.activity({ albumId, createdAt: boundaryTime });
      const a2 = factory.activity({ albumId, createdAt: boundaryTime });
      const extra1 = factory.activity({ albumId, createdAt: boundaryTime });
      const extra2 = factory.activity({ albumId, createdAt: boundaryTime });
      const extra3 = factory.activity({ albumId, createdAt: boundaryTime });

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search
        .mockResolvedValueOnce([a2, a1]) // main query: take=2, only gets 2 of 5
        .mockResolvedValueOnce([extra3, extra2, extra1, a2, a1]); // boundary query: all 5, DESC

      const result = await sut.getAll(factory.auth(), { albumId, take: 2 });

      // all 5 returned despite take=2, extras reversed to ASC then prepended
      expect(result).toHaveLength(5);
      expect(result.map((r) => r.id)).toEqual([extra1.id, extra2.id, extra3.id, a1.id, a2.id]);
    });

    it('should pass take and before to search', async () => {
      const [albumId] = newUuids();
      const before = new Date('2024-06-01T00:00:00Z');

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search.mockResolvedValue([]);

      await sut.getAll(factory.auth(), { albumId, take: 2, before });

      expect(mocks.activity.search).toHaveBeenCalledWith(
        expect.objectContaining({ albumId, take: 2, before }),
      );
    });

    it('should query boundary with at parameter', async () => {
      const [albumId] = newUuids();
      const boundaryTime = new Date('2024-01-01T00:00:00Z');
      const a1 = factory.activity({ albumId, createdAt: boundaryTime });

      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
      mocks.activity.search
        .mockResolvedValueOnce([a1])
        .mockResolvedValueOnce([a1]);

      await sut.getAll(factory.auth(), { albumId, take: 2 });

      expect(mocks.activity.search).toHaveBeenCalledWith(
        expect.objectContaining({ at: boundaryTime }),
      );
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

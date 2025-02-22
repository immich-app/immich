import { BadRequestException } from '@nestjs/common';
import { ReactionType } from 'src/dtos/activity.dto';
import { ActivityService } from 'src/services/activity.service';
import { activityStub } from 'test/fixtures/activity.stub';
import { authStub } from 'test/fixtures/auth.stub';
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
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      mocks.activity.search.mockResolvedValue([]);

      await expect(sut.getAll(authStub.admin, { assetId: 'asset-id', albumId: 'album-id' })).resolves.toEqual([]);

      expect(mocks.activity.search).toHaveBeenCalledWith({
        assetId: 'asset-id',
        albumId: 'album-id',
        isLiked: undefined,
      });
    });

    it('should filter by type=like', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      mocks.activity.search.mockResolvedValue([]);

      await expect(
        sut.getAll(authStub.admin, { assetId: 'asset-id', albumId: 'album-id', type: ReactionType.LIKE }),
      ).resolves.toEqual([]);

      expect(mocks.activity.search).toHaveBeenCalledWith({
        assetId: 'asset-id',
        albumId: 'album-id',
        isLiked: true,
      });
    });

    it('should filter by type=comment', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      mocks.activity.search.mockResolvedValue([]);

      await expect(
        sut.getAll(authStub.admin, { assetId: 'asset-id', albumId: 'album-id', type: ReactionType.COMMENT }),
      ).resolves.toEqual([]);

      expect(mocks.activity.search).toHaveBeenCalledWith({
        assetId: 'asset-id',
        albumId: 'album-id',
        isLiked: false,
      });
    });
  });

  describe('getStatistics', () => {
    it('should get the comment count', async () => {
      mocks.activity.getStatistics.mockResolvedValue(1);
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([activityStub.oneComment.albumId]));
      await expect(
        sut.getStatistics(authStub.admin, {
          assetId: 'asset-id',
          albumId: activityStub.oneComment.albumId,
        }),
      ).resolves.toEqual({ comments: 1 });
    });
  });

  describe('addComment', () => {
    it('should require access to the album', async () => {
      await expect(
        sut.create(authStub.admin, {
          albumId: 'album-id',
          assetId: 'asset-id',
          type: ReactionType.COMMENT,
          comment: 'comment',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create a comment', async () => {
      mocks.access.activity.checkCreateAccess.mockResolvedValue(new Set(['album-id']));
      mocks.activity.create.mockResolvedValue(activityStub.oneComment);

      await sut.create(authStub.admin, {
        albumId: 'album-id',
        assetId: 'asset-id',
        type: ReactionType.COMMENT,
        comment: 'comment',
      });

      expect(mocks.activity.create).toHaveBeenCalledWith({
        userId: 'admin_id',
        albumId: 'album-id',
        assetId: 'asset-id',
        comment: 'comment',
        isLiked: false,
      });
    });

    it('should fail because activity is disabled for the album', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      mocks.activity.create.mockResolvedValue(activityStub.oneComment);

      await expect(
        sut.create(authStub.admin, {
          albumId: 'album-id',
          assetId: 'asset-id',
          type: ReactionType.COMMENT,
          comment: 'comment',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create a like', async () => {
      mocks.access.activity.checkCreateAccess.mockResolvedValue(new Set(['album-id']));
      mocks.activity.create.mockResolvedValue(activityStub.liked);
      mocks.activity.search.mockResolvedValue([]);

      await sut.create(authStub.admin, {
        albumId: 'album-id',
        assetId: 'asset-id',
        type: ReactionType.LIKE,
      });

      expect(mocks.activity.create).toHaveBeenCalledWith({
        userId: 'admin_id',
        albumId: 'album-id',
        assetId: 'asset-id',
        isLiked: true,
      });
    });

    it('should skip if like exists', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      mocks.access.activity.checkCreateAccess.mockResolvedValue(new Set(['album-id']));
      mocks.activity.search.mockResolvedValue([activityStub.liked]);

      await sut.create(authStub.admin, {
        albumId: 'album-id',
        assetId: 'asset-id',
        type: ReactionType.LIKE,
      });

      expect(mocks.activity.create).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should require access', async () => {
      await expect(sut.delete(authStub.admin, activityStub.oneComment.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.activity.delete).not.toHaveBeenCalled();
    });

    it('should let the activity owner delete a comment', async () => {
      mocks.access.activity.checkOwnerAccess.mockResolvedValue(new Set(['activity-id']));
      await sut.delete(authStub.admin, 'activity-id');
      expect(mocks.activity.delete).toHaveBeenCalledWith('activity-id');
    });

    it('should let the album owner delete a comment', async () => {
      mocks.access.activity.checkAlbumOwnerAccess.mockResolvedValue(new Set(['activity-id']));
      await sut.delete(authStub.admin, 'activity-id');
      expect(mocks.activity.delete).toHaveBeenCalledWith('activity-id');
    });
  });
});

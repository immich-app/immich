import { BadRequestException } from '@nestjs/common';
import { ReactionType } from 'src/dtos/activity.dto';
import { IActivityRepository } from 'src/interfaces/activity.interface';
import { ActivityService } from 'src/services/activity.service';
import { activityStub } from 'test/fixtures/activity.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { IAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(ActivityService.name, () => {
  let sut: ActivityService;

  let accessMock: IAccessRepositoryMock;
  let activityMock: Mocked<IActivityRepository>;

  beforeEach(() => {
    ({ sut, accessMock, activityMock } = newTestService(ActivityService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getAll', () => {
    it('should get all', async () => {
      accessMock.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      activityMock.search.mockResolvedValue([]);

      await expect(sut.getAll(authStub.admin, { assetId: 'asset-id', albumId: 'album-id' })).resolves.toEqual([]);

      expect(activityMock.search).toHaveBeenCalledWith({
        assetId: 'asset-id',
        albumId: 'album-id',
        isLiked: undefined,
      });
    });

    it('should filter by type=like', async () => {
      accessMock.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      activityMock.search.mockResolvedValue([]);

      await expect(
        sut.getAll(authStub.admin, { assetId: 'asset-id', albumId: 'album-id', type: ReactionType.LIKE }),
      ).resolves.toEqual([]);

      expect(activityMock.search).toHaveBeenCalledWith({
        assetId: 'asset-id',
        albumId: 'album-id',
        isLiked: true,
      });
    });

    it('should filter by type=comment', async () => {
      accessMock.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      activityMock.search.mockResolvedValue([]);

      await expect(
        sut.getAll(authStub.admin, { assetId: 'asset-id', albumId: 'album-id', type: ReactionType.COMMENT }),
      ).resolves.toEqual([]);

      expect(activityMock.search).toHaveBeenCalledWith({
        assetId: 'asset-id',
        albumId: 'album-id',
        isLiked: false,
      });
    });
  });

  describe('getStatistics', () => {
    it('should get the comment count', async () => {
      activityMock.getStatistics.mockResolvedValue(1);
      accessMock.album.checkOwnerAccess.mockResolvedValue(new Set([activityStub.oneComment.albumId]));
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
      accessMock.activity.checkCreateAccess.mockResolvedValue(new Set(['album-id']));
      activityMock.create.mockResolvedValue(activityStub.oneComment);

      await sut.create(authStub.admin, {
        albumId: 'album-id',
        assetId: 'asset-id',
        type: ReactionType.COMMENT,
        comment: 'comment',
      });

      expect(activityMock.create).toHaveBeenCalledWith({
        userId: 'admin_id',
        albumId: 'album-id',
        assetId: 'asset-id',
        comment: 'comment',
        isLiked: false,
      });
    });

    it('should fail because activity is disabled for the album', async () => {
      accessMock.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      activityMock.create.mockResolvedValue(activityStub.oneComment);

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
      accessMock.activity.checkCreateAccess.mockResolvedValue(new Set(['album-id']));
      activityMock.create.mockResolvedValue(activityStub.liked);
      activityMock.search.mockResolvedValue([]);

      await sut.create(authStub.admin, {
        albumId: 'album-id',
        assetId: 'asset-id',
        type: ReactionType.LIKE,
      });

      expect(activityMock.create).toHaveBeenCalledWith({
        userId: 'admin_id',
        albumId: 'album-id',
        assetId: 'asset-id',
        isLiked: true,
      });
    });

    it('should skip if like exists', async () => {
      accessMock.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      accessMock.activity.checkCreateAccess.mockResolvedValue(new Set(['album-id']));
      activityMock.search.mockResolvedValue([activityStub.liked]);

      await sut.create(authStub.admin, {
        albumId: 'album-id',
        assetId: 'asset-id',
        type: ReactionType.LIKE,
      });

      expect(activityMock.create).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should require access', async () => {
      await expect(sut.delete(authStub.admin, activityStub.oneComment.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(activityMock.delete).not.toHaveBeenCalled();
    });

    it('should let the activity owner delete a comment', async () => {
      accessMock.activity.checkOwnerAccess.mockResolvedValue(new Set(['activity-id']));
      await sut.delete(authStub.admin, 'activity-id');
      expect(activityMock.delete).toHaveBeenCalledWith('activity-id');
    });

    it('should let the album owner delete a comment', async () => {
      accessMock.activity.checkAlbumOwnerAccess.mockResolvedValue(new Set(['activity-id']));
      await sut.delete(authStub.admin, 'activity-id');
      expect(activityMock.delete).toHaveBeenCalledWith('activity-id');
    });
  });
});

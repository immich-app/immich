import { BadRequestException } from '@nestjs/common';
import { authStub, IAccessRepositoryMock, newAccessRepositoryMock } from '@test';
import { activityStub } from '@test/fixtures/activity.stub';
import { newActivityRepositoryMock } from '@test/repositories/activity.repository.mock';
import { IActivityRepository } from '../repositories';
import { ReactionType } from './activity.dto';
import { ActivityService } from './activity.service';

describe(ActivityService.name, () => {
  let sut: ActivityService;
  let accessMock: IAccessRepositoryMock;
  let activityMock: jest.Mocked<IActivityRepository>;

  beforeEach(async () => {
    accessMock = newAccessRepositoryMock();
    activityMock = newActivityRepositoryMock();

    sut = new ActivityService(accessMock, activityMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getAll', () => {
    it('should get all', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      activityMock.search.mockResolvedValue([]);

      await expect(sut.getAll(authStub.admin, { assetId: 'asset-id', albumId: 'album-id' })).resolves.toEqual([]);

      expect(activityMock.search).toHaveBeenCalledWith({
        assetId: 'asset-id',
        albumId: 'album-id',
        isLiked: undefined,
      });
    });

    it('should filter by type=like', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
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
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
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
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
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
      accessMock.album.hasOwnerAccess.mockResolvedValue(false);
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
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
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

    it('should create a like', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
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
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
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
      accessMock.activity.hasOwnerAccess.mockResolvedValue(false);
      await expect(sut.delete(authStub.admin, activityStub.oneComment.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(activityMock.delete).not.toHaveBeenCalled();
    });

    it('should let the activity owner delete a comment', async () => {
      accessMock.activity.hasOwnerAccess.mockResolvedValue(true);
      await sut.delete(authStub.admin, 'activity-id');
      expect(activityMock.delete).toHaveBeenCalledWith('activity-id');
    });

    it('should let the album owner delete a comment', async () => {
      accessMock.activity.hasAlbumOwnerAccess.mockResolvedValue(true);
      await sut.delete(authStub.admin, 'activity-id');
      expect(activityMock.delete).toHaveBeenCalledWith('activity-id');
    });
  });
});

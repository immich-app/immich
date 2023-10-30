import { BadRequestException } from '@nestjs/common';
import { authStub, IAccessRepositoryMock, newAccessRepositoryMock, newAlbumRepositoryMock } from '@test';
import { activityStub } from '@test/fixtures/activity.stub';
import { newActivityRepositoryMock } from '@test/repositories/activity.repository.mock';
import { IActivityRepository, IAlbumRepository } from '../repositories';
import { ActivityService } from './activity.service';

describe(ActivityService.name, () => {
  let sut: ActivityService;
  let accessMock: IAccessRepositoryMock;
  let activityMock: jest.Mocked<IActivityRepository>;
  let albumMock: jest.Mocked<IAlbumRepository>;

  beforeEach(async () => {
    accessMock = newAccessRepositoryMock();
    activityMock = newActivityRepositoryMock();
    albumMock = newAlbumRepositoryMock();

    sut = new ActivityService(accessMock, activityMock, albumMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getStatistics', () => {
    it('should get the comment count', async () => {
      activityMock.getById.mockResolvedValue([activityStub.oneComment]),
        activityMock.getStatistics.mockResolvedValue(1);
      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
      await expect(
        sut.getStatistics(authStub.admin, {
          assetId: 'asset-id',
          albumId: activityStub.oneComment.albumId,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(accessMock.asset.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, activityStub.oneComment.assetId);
    });
  });

  describe('getFavorite', () => {
    it('should get the favorite for an user for a specific album and asset', async () => {
      activityMock.getById.mockResolvedValue([activityStub.oneComment, activityStub.favorite]),
        activityMock.getFavorite.mockResolvedValue(activityStub.favorite);
      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
      await expect(
        sut.getLikeStatus(authStub.admin, {
          assetId: 'asset-id',
          albumId: activityStub.oneComment.albumId,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(accessMock.asset.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, activityStub.oneComment.assetId);
    });
    describe('changeFavorite', () => {
      it('should get the favorite for an user for a specific album and asset', async () => {
        activityMock.getById.mockResolvedValue([activityStub.oneComment, activityStub.favorite]),
          activityMock.getFavorite.mockResolvedValue(activityStub.favorite);
        accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
        await expect(
          sut.updateLikeStatus(authStub.admin, {
            favorite: false,
            assetId: 'asset-id',
            albumId: activityStub.oneComment.albumId,
          }),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(accessMock.asset.hasOwnerAccess).toHaveBeenCalledWith(
          authStub.admin.id,
          activityStub.oneComment.assetId,
        );
      });
    });

    describe('addComment', () => {
      it("should add a user's comment for a specific album and asset", async () => {
        accessMock.asset.hasOwnerAccess.mockResolvedValue(false);
        await expect(
          sut.addComment(authStub.admin, {
            comment: 'comment',
            assetId: 'asset-id',
            albumId: activityStub.oneComment.albumId,
          }),
        ).rejects.toBeInstanceOf(BadRequestException);
      });
    });

    describe('deleteComment', () => {
      it("should delete a user's comment for a specific album and asset", async () => {
        accessMock.asset.hasOwnerAccess.mockResolvedValue(false);
        await expect(sut.deleteComment(authStub.admin, activityStub.oneComment.id)).rejects.toBeInstanceOf(
          BadRequestException,
        );
      });
    });
  });
});

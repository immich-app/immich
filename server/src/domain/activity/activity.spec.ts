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
        sut.getStatistics(authStub.admin, activityStub.oneComment.assetId, activityStub.oneComment.albumId),
      ).resolves.toEqual({
        comments: 1,
      });
      expect(accessMock.asset.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, activityStub.oneComment.assetId);
    });
  });

  describe('getFavorite', () => {
    it('should get the favorite for an user for a specific album and asset', async () => {
      activityMock.getById.mockResolvedValue([activityStub.oneComment, activityStub.favorite]),
        activityMock.getFavorite.mockResolvedValue(activityStub.favorite);
      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
      await expect(
        sut.getFavorite(authStub.admin, activityStub.oneComment.assetId, activityStub.oneComment.albumId),
      ).resolves.toEqual({
        isFavorite: true,
        comment: null,
        createdAt: activityStub.favorite.createdAt,
        id: activityStub.favorite.id,
        user: {
          email: activityStub.favorite.user.email,
          firstName: activityStub.favorite.user.firstName,
          lastName: activityStub.favorite.user.lastName,
          id: activityStub.favorite.user.id,
          profileImagePath: activityStub.favorite.user.profileImagePath,
        },
      });
      expect(accessMock.asset.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, activityStub.oneComment.assetId);
    });
    describe('changeFavorite', () => {
      it('should get the favorite for an user for a specific album and asset', async () => {
        activityMock.getById.mockResolvedValue([activityStub.oneComment, activityStub.favorite]),
          activityMock.getFavorite.mockResolvedValue(activityStub.favorite);
        accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
        await expect(
          sut.changeFavorite(authStub.admin, {
            favorite: false,
            assetId: activityStub.oneComment.assetId,
            albumId: activityStub.oneComment.albumId,
          }),
        ).resolves.toEqual({
          id: null,
          createdAt: null,
          comment: null,
          isFavorite: false,
          user: null,
        });
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
            assetId: activityStub.oneComment.assetId,
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

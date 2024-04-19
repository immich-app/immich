import { BadRequestException } from '@nestjs/common';
import { IAssetRepository, TimeBucketSize } from 'src/interfaces/asset.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { TimelineService } from 'src/services/timeline.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { IAccessRepositoryMock, newAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newAssetRepositoryMock } from 'test/repositories/asset.repository.mock';
import { newPartnerRepositoryMock } from 'test/repositories/partner.repository.mock';
import { Mocked } from 'vitest';

describe(TimelineService.name, () => {
  let sut: TimelineService;
  let accessMock: IAccessRepositoryMock;
  let assetMock: Mocked<IAssetRepository>;
  let partnerMock: Mocked<IPartnerRepository>;
  beforeEach(() => {
    accessMock = newAccessRepositoryMock();
    assetMock = newAssetRepositoryMock();
    partnerMock = newPartnerRepositoryMock();

    sut = new TimelineService(accessMock, assetMock, partnerMock);
  });

  describe('getTimeBuckets', () => {
    it("should return buckets if userId and albumId aren't set", async () => {
      assetMock.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

      await expect(
        sut.getTimeBuckets(authStub.admin, {
          size: TimeBucketSize.DAY,
        }),
      ).resolves.toEqual(expect.arrayContaining([{ timeBucket: 'bucket', count: 1 }]));
      expect(assetMock.getTimeBuckets).toHaveBeenCalledWith({
        size: TimeBucketSize.DAY,
        userIds: [authStub.admin.user.id],
      });
    });
  });

  describe('getTimeBucket', () => {
    it('should return the assets for a album time bucket if user has album.read', async () => {
      accessMock.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      assetMock.getTimeBucket.mockResolvedValue([assetStub.image]);

      await expect(
        sut.getTimeBucket(authStub.admin, { size: TimeBucketSize.DAY, timeBucket: 'bucket', albumId: 'album-id' }),
      ).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'asset-id' })]));

      expect(accessMock.album.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['album-id']));
      expect(assetMock.getTimeBucket).toHaveBeenCalledWith('bucket', {
        size: TimeBucketSize.DAY,
        timeBucket: 'bucket',
        albumId: 'album-id',
      });
    });

    it('should return the assets for a archive time bucket if user has archive.read', async () => {
      assetMock.getTimeBucket.mockResolvedValue([assetStub.image]);

      await expect(
        sut.getTimeBucket(authStub.admin, {
          size: TimeBucketSize.DAY,
          timeBucket: 'bucket',
          isArchived: true,
          userId: authStub.admin.user.id,
        }),
      ).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'asset-id' })]));
      expect(assetMock.getTimeBucket).toHaveBeenCalledWith('bucket', {
        size: TimeBucketSize.DAY,
        timeBucket: 'bucket',
        isArchived: true,
        userIds: [authStub.admin.user.id],
      });
    });

    it('should return the assets for a library time bucket if user has library.read', async () => {
      assetMock.getTimeBucket.mockResolvedValue([assetStub.image]);

      await expect(
        sut.getTimeBucket(authStub.admin, {
          size: TimeBucketSize.DAY,
          timeBucket: 'bucket',
          userId: authStub.admin.user.id,
        }),
      ).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'asset-id' })]));
      expect(assetMock.getTimeBucket).toHaveBeenCalledWith('bucket', {
        size: TimeBucketSize.DAY,
        timeBucket: 'bucket',
        userIds: [authStub.admin.user.id],
      });
    });

    it('should throw an error if withParners is true and isArchived true or undefined', async () => {
      await expect(
        sut.getTimeBucket(authStub.admin, {
          size: TimeBucketSize.DAY,
          timeBucket: 'bucket',
          isArchived: true,
          withPartners: true,
          userId: authStub.admin.user.id,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        sut.getTimeBucket(authStub.admin, {
          size: TimeBucketSize.DAY,
          timeBucket: 'bucket',
          isArchived: undefined,
          withPartners: true,
          userId: authStub.admin.user.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error if withParners is true and isFavorite is either true or false', async () => {
      await expect(
        sut.getTimeBucket(authStub.admin, {
          size: TimeBucketSize.DAY,
          timeBucket: 'bucket',
          isFavorite: true,
          withPartners: true,
          userId: authStub.admin.user.id,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        sut.getTimeBucket(authStub.admin, {
          size: TimeBucketSize.DAY,
          timeBucket: 'bucket',
          isFavorite: false,
          withPartners: true,
          userId: authStub.admin.user.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error if withParners is true and isTrash is true', async () => {
      await expect(
        sut.getTimeBucket(authStub.admin, {
          size: TimeBucketSize.DAY,
          timeBucket: 'bucket',
          isTrashed: true,
          withPartners: true,
          userId: authStub.admin.user.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

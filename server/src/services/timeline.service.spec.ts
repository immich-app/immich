import { BadRequestException } from '@nestjs/common';
import { TimeBucketSize } from 'src/repositories/asset.repository';
import { TimelineService } from 'src/services/timeline.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { newTestService, ServiceMocks } from 'test/utils';

describe(TimelineService.name, () => {
  let sut: TimelineService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(TimelineService));
  });

  describe('getTimeBuckets', () => {
    it("should return buckets if userId and albumId aren't set", async () => {
      mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

      await expect(
        sut.getTimeBuckets(authStub.admin, {
          size: TimeBucketSize.DAY,
        }),
      ).resolves.toEqual(expect.arrayContaining([{ timeBucket: 'bucket', count: 1 }]));
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith({
        size: TimeBucketSize.DAY,
        userIds: [authStub.admin.user.id],
      });
    });
  });

  describe('getTimeBucket', () => {
    it('should return the assets for a album time bucket if user has album.read', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      mocks.asset.getTimeBucket.mockResolvedValue([assetStub.image]);

      await expect(
        sut.getTimeBucket(authStub.admin, { size: TimeBucketSize.DAY, timeBucket: 'bucket', albumId: 'album-id' }),
      ).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'asset-id' })]));

      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['album-id']));
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith('bucket', {
        size: TimeBucketSize.DAY,
        timeBucket: 'bucket',
        albumId: 'album-id',
      });
    });

    it('should return the assets for a archive time bucket if user has archive.read', async () => {
      mocks.asset.getTimeBucket.mockResolvedValue([assetStub.image]);

      await expect(
        sut.getTimeBucket(authStub.admin, {
          size: TimeBucketSize.DAY,
          timeBucket: 'bucket',
          isArchived: true,
          userId: authStub.admin.user.id,
        }),
      ).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'asset-id' })]));
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
        'bucket',
        expect.objectContaining({
          size: TimeBucketSize.DAY,
          timeBucket: 'bucket',
          isArchived: true,
          userIds: [authStub.admin.user.id],
        }),
      );
    });

    it('should include partner shared assets', async () => {
      mocks.asset.getTimeBucket.mockResolvedValue([assetStub.image]);
      mocks.partner.getAll.mockResolvedValue([]);

      await expect(
        sut.getTimeBucket(authStub.admin, {
          size: TimeBucketSize.DAY,
          timeBucket: 'bucket',
          isArchived: false,
          userId: authStub.admin.user.id,
          withPartners: true,
        }),
      ).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'asset-id' })]));
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith('bucket', {
        size: TimeBucketSize.DAY,
        timeBucket: 'bucket',
        isArchived: false,
        withPartners: true,
        userIds: [authStub.admin.user.id],
      });
    });

    it('should check permissions to read tag', async () => {
      mocks.asset.getTimeBucket.mockResolvedValue([assetStub.image]);
      mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-123']));

      await expect(
        sut.getTimeBucket(authStub.admin, {
          size: TimeBucketSize.DAY,
          timeBucket: 'bucket',
          userId: authStub.admin.user.id,
          tagId: 'tag-123',
        }),
      ).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'asset-id' })]));
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith('bucket', {
        size: TimeBucketSize.DAY,
        tagId: 'tag-123',
        timeBucket: 'bucket',
        userIds: [authStub.admin.user.id],
      });
    });

    it('should strip metadata if showExif is disabled', async () => {
      mocks.access.album.checkSharedLinkAccess.mockResolvedValue(new Set(['album-id']));
      mocks.asset.getTimeBucket.mockResolvedValue([assetStub.image]);

      const buckets = await sut.getTimeBucket(
        { ...authStub.admin, sharedLink: { ...authStub.adminSharedLink.sharedLink!, showExif: false } },
        {
          size: TimeBucketSize.DAY,
          timeBucket: 'bucket',
          isArchived: true,
          albumId: 'album-id',
        },
      );
      expect(buckets).toEqual([expect.objectContaining({ id: 'asset-id' })]);
      expect(buckets[0]).not.toHaveProperty('exif');
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith('bucket', {
        size: TimeBucketSize.DAY,
        timeBucket: 'bucket',
        isArchived: true,
        albumId: 'album-id',
      });
    });

    it('should return the assets for a library time bucket if user has library.read', async () => {
      mocks.asset.getTimeBucket.mockResolvedValue([assetStub.image]);

      await expect(
        sut.getTimeBucket(authStub.admin, {
          size: TimeBucketSize.DAY,
          timeBucket: 'bucket',
          userId: authStub.admin.user.id,
        }),
      ).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'asset-id' })]));
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
        'bucket',
        expect.objectContaining({
          size: TimeBucketSize.DAY,
          timeBucket: 'bucket',
          userIds: [authStub.admin.user.id],
        }),
      );
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

import { BadRequestException } from '@nestjs/common';
import { TimelineService } from 'src/services/timeline.service';
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

      await expect(sut.getTimeBuckets(authStub.admin, {})).resolves.toEqual(
        expect.arrayContaining([{ timeBucket: 'bucket', count: 1 }]),
      );
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith({
        userIds: [authStub.admin.user.id],
      });
    });
  });

  describe('getTimeBucket', () => {
    it('should return the assets for a album time bucket if user has album.read', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      mocks.asset.getTimeBucket.mockResolvedValue([{ id: 'asset-id' } as any]);

      await expect(sut.getTimeBucket(authStub.admin, { timeBucket: 'bucket', albumId: 'album-id' })).resolves.toEqual(
        expect.objectContaining({
          bucketAssets: expect.objectContaining({ id: expect.arrayContaining(['asset-id']) }),
        }),
      );

      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['album-id']));
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
        'bucket',
        {
          timeBucket: 'bucket',
          albumId: 'album-id',
        },
        {
          skip: 1,
          take: -1,
        },
      );
    });

    it('should return the assets for a archive time bucket if user has archive.read', async () => {
      mocks.asset.getTimeBucket.mockResolvedValue([{ id: 'asset-id' } as any]);

      await expect(
        sut.getTimeBucket(authStub.admin, {
          timeBucket: 'bucket',
          isArchived: true,
          userId: authStub.admin.user.id,
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          bucketAssets: expect.objectContaining({ id: expect.arrayContaining(['asset-id']) }),
        }),
      );
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
        'bucket',
        expect.objectContaining({
          timeBucket: 'bucket',
          isArchived: true,
          userIds: [authStub.admin.user.id],
        }),
        {
          skip: 1,
          take: -1,
        },
      );
    });

    it('should include partner shared assets', async () => {
      mocks.asset.getTimeBucket.mockResolvedValue([{ id: 'asset-id' } as any]);
      mocks.partner.getAll.mockResolvedValue([]);

      await expect(
        sut.getTimeBucket(authStub.admin, {
          timeBucket: 'bucket',
          isArchived: false,
          userId: authStub.admin.user.id,
          withPartners: true,
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          bucketAssets: expect.objectContaining({ id: expect.arrayContaining(['asset-id']) }),
        }),
      );
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
        'bucket',
        {
          timeBucket: 'bucket',
          isArchived: false,
          withPartners: true,
          userIds: [authStub.admin.user.id],
        },
        {
          skip: 1,
          take: -1,
        },
      );
    });

    it('should check permissions to read tag', async () => {
      mocks.asset.getTimeBucket.mockResolvedValue([{ id: 'asset-id' } as any]);
      mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-123']));

      await expect(
        sut.getTimeBucket(authStub.admin, {
          timeBucket: 'bucket',
          userId: authStub.admin.user.id,
          tagId: 'tag-123',
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          bucketAssets: expect.objectContaining({ id: expect.arrayContaining(['asset-id']) }),
        }),
      );
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
        'bucket',
        {
          tagId: 'tag-123',
          timeBucket: 'bucket',
          userIds: [authStub.admin.user.id],
        },
        {
          skip: 1,
          take: -1,
        },
      );
    });

    it('should return the assets for a library time bucket if user has library.read', async () => {
      mocks.asset.getTimeBucket.mockResolvedValue([{ id: 'asset-id' } as any]);

      await expect(
        sut.getTimeBucket(authStub.admin, {
          timeBucket: 'bucket',
          userId: authStub.admin.user.id,
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          bucketAssets: expect.objectContaining({ id: expect.arrayContaining(['asset-id']) }),
        }),
      );
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
        'bucket',
        expect.objectContaining({
          timeBucket: 'bucket',
          userIds: [authStub.admin.user.id],
        }),
        {
          skip: 1,
          take: -1,
        },
      );
    });

    it('should throw an error if withParners is true and isArchived true or undefined', async () => {
      await expect(
        sut.getTimeBucket(authStub.admin, {
          timeBucket: 'bucket',
          isArchived: true,
          withPartners: true,
          userId: authStub.admin.user.id,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        sut.getTimeBucket(authStub.admin, {
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
          timeBucket: 'bucket',
          isFavorite: true,
          withPartners: true,
          userId: authStub.admin.user.id,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        sut.getTimeBucket(authStub.admin, {
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
          timeBucket: 'bucket',
          isTrashed: true,
          withPartners: true,
          userId: authStub.admin.user.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

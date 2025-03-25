import { BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { AssetJobName, AssetStatsResponseDto } from 'src/dtos/asset.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { AssetStatus, AssetType, JobName, JobStatus } from 'src/enum';
import { AssetStats } from 'src/repositories/asset.repository';
import { AssetService } from 'src/services/asset.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { faceStub } from 'test/fixtures/face.stub';
import { userStub } from 'test/fixtures/user.stub';
import { factory } from 'test/small.factory';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';
import { vitest } from 'vitest';

const stats: AssetStats = {
  [AssetType.IMAGE]: 10,
  [AssetType.VIDEO]: 23,
  [AssetType.AUDIO]: 0,
  [AssetType.OTHER]: 0,
};

const statResponse: AssetStatsResponseDto = {
  images: 10,
  videos: 23,
  total: 33,
};

describe(AssetService.name, () => {
  let sut: AssetService;
  let mocks: ServiceMocks;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  const mockGetById = (assets: AssetEntity[]) => {
    mocks.asset.getById.mockImplementation((assetId) => Promise.resolve(assets.find((asset) => asset.id === assetId)));
  };

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AssetService));

    mockGetById([assetStub.livePhotoStillAsset, assetStub.livePhotoMotionAsset]);
  });

  describe('getMemoryLane', () => {
    beforeAll(() => {
      vitest.useFakeTimers();
      vitest.setSystemTime(new Date('2024-01-15'));
    });

    afterAll(() => {
      vitest.useRealTimers();
    });

    it('should group the assets correctly', async () => {
      const image1 = { ...assetStub.image, localDateTime: new Date(2023, 1, 15, 0, 0, 0) };
      const image2 = { ...assetStub.image, localDateTime: new Date(2023, 1, 15, 1, 0, 0) };
      const image3 = { ...assetStub.image, localDateTime: new Date(2015, 1, 15) };
      const image4 = { ...assetStub.image, localDateTime: new Date(2009, 1, 15) };

      mocks.partner.getAll.mockResolvedValue([]);
      mocks.asset.getByDayOfYear.mockResolvedValue([
        {
          year: 2023,
          assets: [image1, image2],
        },
        {
          year: 2015,
          assets: [image3],
        },
        {
          year: 2009,
          assets: [image4],
        },
      ] as any);

      await expect(sut.getMemoryLane(authStub.admin, { day: 15, month: 1 })).resolves.toEqual([
        { yearsAgo: 1, title: '1 year ago', assets: [mapAsset(image1), mapAsset(image2)] },
        { yearsAgo: 9, title: '9 years ago', assets: [mapAsset(image3)] },
        { yearsAgo: 15, title: '15 years ago', assets: [mapAsset(image4)] },
      ]);

      expect(mocks.asset.getByDayOfYear.mock.calls).toEqual([[[authStub.admin.user.id], { day: 15, month: 1 }]]);
    });

    it('should get memories with partners with inTimeline enabled', async () => {
      const partner = factory.partner();
      const auth = factory.auth({ id: partner.sharedWithId });

      mocks.partner.getAll.mockResolvedValue([partner]);
      mocks.asset.getByDayOfYear.mockResolvedValue([]);

      await sut.getMemoryLane(auth, { day: 15, month: 1 });

      expect(mocks.asset.getByDayOfYear.mock.calls).toEqual([
        [[auth.user.id, partner.sharedById], { day: 15, month: 1 }],
      ]);
    });
  });

  describe('getStatistics', () => {
    it('should get the statistics for a user, excluding archived assets', async () => {
      mocks.asset.getStatistics.mockResolvedValue(stats);
      await expect(sut.getStatistics(authStub.admin, { isArchived: false })).resolves.toEqual(statResponse);
      expect(mocks.asset.getStatistics).toHaveBeenCalledWith(authStub.admin.user.id, { isArchived: false });
    });

    it('should get the statistics for a user for archived assets', async () => {
      mocks.asset.getStatistics.mockResolvedValue(stats);
      await expect(sut.getStatistics(authStub.admin, { isArchived: true })).resolves.toEqual(statResponse);
      expect(mocks.asset.getStatistics).toHaveBeenCalledWith(authStub.admin.user.id, { isArchived: true });
    });

    it('should get the statistics for a user for favorite assets', async () => {
      mocks.asset.getStatistics.mockResolvedValue(stats);
      await expect(sut.getStatistics(authStub.admin, { isFavorite: true })).resolves.toEqual(statResponse);
      expect(mocks.asset.getStatistics).toHaveBeenCalledWith(authStub.admin.user.id, { isFavorite: true });
    });

    it('should get the statistics for a user for all assets', async () => {
      mocks.asset.getStatistics.mockResolvedValue(stats);
      await expect(sut.getStatistics(authStub.admin, {})).resolves.toEqual(statResponse);
      expect(mocks.asset.getStatistics).toHaveBeenCalledWith(authStub.admin.user.id, {});
    });
  });

  describe('getRandom', () => {
    it('should get own random assets', async () => {
      mocks.partner.getAll.mockResolvedValue([]);
      mocks.asset.getRandom.mockResolvedValue([assetStub.image]);

      await sut.getRandom(authStub.admin, 1);

      expect(mocks.asset.getRandom).toHaveBeenCalledWith([authStub.admin.user.id], 1);
    });

    it('should not include partner assets if not in timeline', async () => {
      const partner = factory.partner({ inTimeline: false });
      const auth = factory.auth({ id: partner.sharedWithId });

      mocks.asset.getRandom.mockResolvedValue([assetStub.image]);
      mocks.partner.getAll.mockResolvedValue([partner]);

      await sut.getRandom(auth, 1);

      expect(mocks.asset.getRandom).toHaveBeenCalledWith([auth.user.id], 1);
    });

    it('should include partner assets if in timeline', async () => {
      const partner = factory.partner({ inTimeline: true });
      const auth = factory.auth({ id: partner.sharedWithId });

      mocks.asset.getRandom.mockResolvedValue([assetStub.image]);
      mocks.partner.getAll.mockResolvedValue([partner]);

      await sut.getRandom(auth, 1);

      expect(mocks.asset.getRandom).toHaveBeenCalledWith([auth.user.id, partner.sharedById], 1);
    });
  });

  describe('get', () => {
    it('should allow owner access', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      mocks.asset.getById.mockResolvedValue(assetStub.image);

      await sut.get(authStub.admin, assetStub.image.id);

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set([assetStub.image.id]),
      );
    });

    it('should allow shared link access', async () => {
      mocks.access.asset.checkSharedLinkAccess.mockResolvedValue(new Set([assetStub.image.id]));
      mocks.asset.getById.mockResolvedValue(assetStub.image);

      await sut.get(authStub.adminSharedLink, assetStub.image.id);

      expect(mocks.access.asset.checkSharedLinkAccess).toHaveBeenCalledWith(
        authStub.adminSharedLink.sharedLink?.id,
        new Set([assetStub.image.id]),
      );
    });

    it('should strip metadata for shared link if exif is disabled', async () => {
      mocks.access.asset.checkSharedLinkAccess.mockResolvedValue(new Set([assetStub.image.id]));
      mocks.asset.getById.mockResolvedValue(assetStub.image);

      const result = await sut.get(
        { ...authStub.adminSharedLink, sharedLink: { ...authStub.adminSharedLink.sharedLink!, showExif: false } },
        assetStub.image.id,
      );

      expect(result).toEqual(expect.objectContaining({ hasMetadata: false }));
      expect(result).not.toHaveProperty('exifInfo');
      expect(mocks.access.asset.checkSharedLinkAccess).toHaveBeenCalledWith(
        authStub.adminSharedLink.sharedLink?.id,
        new Set([assetStub.image.id]),
      );
    });

    it('should allow partner sharing access', async () => {
      mocks.access.asset.checkPartnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      mocks.asset.getById.mockResolvedValue(assetStub.image);

      await sut.get(authStub.admin, assetStub.image.id);

      expect(mocks.access.asset.checkPartnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set([assetStub.image.id]),
      );
    });

    it('should allow shared album access', async () => {
      mocks.access.asset.checkAlbumAccess.mockResolvedValue(new Set([assetStub.image.id]));
      mocks.asset.getById.mockResolvedValue(assetStub.image);

      await sut.get(authStub.admin, assetStub.image.id);

      expect(mocks.access.asset.checkAlbumAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set([assetStub.image.id]),
      );
    });

    it('should throw an error for no access', async () => {
      await expect(sut.get(authStub.admin, assetStub.image.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.asset.getById).not.toHaveBeenCalled();
    });

    it('should throw an error for an invalid shared link', async () => {
      await expect(sut.get(authStub.adminSharedLink, assetStub.image.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.access.asset.checkOwnerAccess).not.toHaveBeenCalled();
      expect(mocks.asset.getById).not.toHaveBeenCalled();
    });

    it('should throw an error if the asset could not be found', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));

      await expect(sut.get(authStub.admin, assetStub.image.id)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('should require asset write access for the id', async () => {
      await expect(sut.update(authStub.admin, 'asset-1', { isArchived: false })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should update the asset', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      mocks.asset.getById.mockResolvedValue(assetStub.image);
      mocks.asset.update.mockResolvedValue(assetStub.image);

      await sut.update(authStub.admin, 'asset-1', { isFavorite: true });

      expect(mocks.asset.update).toHaveBeenCalledWith({ id: 'asset-1', isFavorite: true });
    });

    it('should update the exif description', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      mocks.asset.getById.mockResolvedValue(assetStub.image);
      mocks.asset.update.mockResolvedValue(assetStub.image);

      await sut.update(authStub.admin, 'asset-1', { description: 'Test description' });

      expect(mocks.asset.upsertExif).toHaveBeenCalledWith({ assetId: 'asset-1', description: 'Test description' });
    });

    it('should update the exif rating', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      mocks.asset.getById.mockResolvedValueOnce(assetStub.image);
      mocks.asset.update.mockResolvedValueOnce(assetStub.image);

      await sut.update(authStub.admin, 'asset-1', { rating: 3 });

      expect(mocks.asset.upsertExif).toHaveBeenCalledWith({ assetId: 'asset-1', rating: 3 });
    });

    it('should fail linking a live video if the motion part could not be found', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.livePhotoStillAsset.id]));

      await expect(
        sut.update(authStub.admin, assetStub.livePhotoStillAsset.id, {
          livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.asset.update).not.toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
      expect(mocks.asset.update).not.toHaveBeenCalledWith({ id: assetStub.livePhotoMotionAsset.id, isVisible: true });
      expect(mocks.event.emit).not.toHaveBeenCalledWith('asset.show', {
        assetId: assetStub.livePhotoMotionAsset.id,
        userId: userStub.admin.id,
      });
    });

    it('should fail linking a live video if the motion part is not a video', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.livePhotoStillAsset.id]));
      mocks.asset.getById.mockResolvedValue(assetStub.livePhotoStillAsset);

      await expect(
        sut.update(authStub.admin, assetStub.livePhotoStillAsset.id, {
          livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.asset.update).not.toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
      expect(mocks.asset.update).not.toHaveBeenCalledWith({ id: assetStub.livePhotoMotionAsset.id, isVisible: true });
      expect(mocks.event.emit).not.toHaveBeenCalledWith('asset.show', {
        assetId: assetStub.livePhotoMotionAsset.id,
        userId: userStub.admin.id,
      });
    });

    it('should fail linking a live video if the motion part has a different owner', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.livePhotoStillAsset.id]));
      mocks.asset.getById.mockResolvedValue(assetStub.livePhotoMotionAsset);

      await expect(
        sut.update(authStub.admin, assetStub.livePhotoStillAsset.id, {
          livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.asset.update).not.toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
      expect(mocks.asset.update).not.toHaveBeenCalledWith({ id: assetStub.livePhotoMotionAsset.id, isVisible: true });
      expect(mocks.event.emit).not.toHaveBeenCalledWith('asset.show', {
        assetId: assetStub.livePhotoMotionAsset.id,
        userId: userStub.admin.id,
      });
    });

    it('should link a live video', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.livePhotoStillAsset.id]));
      mocks.asset.getById.mockResolvedValueOnce({
        ...assetStub.livePhotoMotionAsset,
        ownerId: authStub.admin.user.id,
        isVisible: true,
      });
      mocks.asset.getById.mockResolvedValueOnce(assetStub.image);
      mocks.asset.update.mockResolvedValue(assetStub.image);

      await sut.update(authStub.admin, assetStub.livePhotoStillAsset.id, {
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });

      expect(mocks.asset.update).toHaveBeenCalledWith({ id: assetStub.livePhotoMotionAsset.id, isVisible: false });
      expect(mocks.event.emit).toHaveBeenCalledWith('asset.hide', {
        assetId: assetStub.livePhotoMotionAsset.id,
        userId: userStub.admin.id,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
    });

    it('should throw an error if asset could not be found after update', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      await expect(sut.update(authStub.admin, 'asset-1', { isFavorite: true })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should unlink a live video', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.livePhotoStillAsset.id]));
      mocks.asset.getById.mockResolvedValueOnce(assetStub.livePhotoStillAsset);
      mocks.asset.getById.mockResolvedValueOnce(assetStub.livePhotoMotionAsset);
      mocks.asset.update.mockResolvedValueOnce(assetStub.image);

      await sut.update(authStub.admin, assetStub.livePhotoStillAsset.id, { livePhotoVideoId: null });

      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: null,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: assetStub.livePhotoMotionAsset.id, isVisible: true });
      expect(mocks.event.emit).toHaveBeenCalledWith('asset.show', {
        assetId: assetStub.livePhotoMotionAsset.id,
        userId: userStub.admin.id,
      });
    });

    it('should fail unlinking a live video if the asset could not be found', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.livePhotoStillAsset.id]));
      // eslint-disable-next-line unicorn/no-useless-undefined
      mocks.asset.getById.mockResolvedValueOnce(undefined);

      await expect(
        sut.update(authStub.admin, assetStub.livePhotoStillAsset.id, { livePhotoVideoId: null }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.asset.update).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });
  });

  describe('updateAll', () => {
    it('should require asset write access for all ids', async () => {
      await expect(
        sut.updateAll(authStub.admin, {
          ids: ['asset-1'],
          isArchived: false,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should update all assets', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));

      await sut.updateAll(authStub.admin, { ids: ['asset-1', 'asset-2'], isArchived: true });

      expect(mocks.asset.updateAll).toHaveBeenCalledWith(['asset-1', 'asset-2'], { isArchived: true });
    });

    it('should not update Assets table if no relevant fields are provided', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.updateAll(authStub.admin, {
        ids: ['asset-1'],
        latitude: 0,
        longitude: 0,
        isArchived: undefined,
        isFavorite: undefined,
        duplicateId: undefined,
        rating: undefined,
      });
      expect(mocks.asset.updateAll).not.toHaveBeenCalled();
    });

    it('should update Assets table if isArchived field is provided', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.updateAll(authStub.admin, {
        ids: ['asset-1'],
        latitude: 0,
        longitude: 0,
        isArchived: undefined,
        isFavorite: false,
        duplicateId: undefined,
        rating: undefined,
      });
      expect(mocks.asset.updateAll).toHaveBeenCalled();
    });
  });

  describe('deleteAll', () => {
    it('should require asset delete access for all ids', async () => {
      await expect(
        sut.deleteAll(authStub.user1, {
          ids: ['asset-1'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should force delete a batch of assets', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1', 'asset2']));

      await sut.deleteAll(authStub.user1, { ids: ['asset1', 'asset2'], force: true });

      expect(mocks.event.emit).toHaveBeenCalledWith('assets.delete', {
        assetIds: ['asset1', 'asset2'],
        userId: 'user-id',
      });
    });

    it('should soft delete a batch of assets', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1', 'asset2']));

      await sut.deleteAll(authStub.user1, { ids: ['asset1', 'asset2'], force: false });

      expect(mocks.asset.updateAll).toHaveBeenCalledWith(['asset1', 'asset2'], {
        deletedAt: expect.any(Date),
        status: AssetStatus.TRASHED,
      });
      expect(mocks.job.queue.mock.calls).toEqual([]);
    });
  });

  describe('handleAssetDeletionCheck', () => {
    beforeAll(() => {
      vi.useFakeTimers();
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    it('should immediately queue assets for deletion if trash is disabled', async () => {
      const asset = factory.asset({ isOffline: false });

      mocks.asset.streamDeletedAssets.mockReturnValue(makeStream([asset]));
      mocks.systemMetadata.get.mockResolvedValue({ trash: { enabled: false } });

      await expect(sut.handleAssetDeletionCheck()).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.streamDeletedAssets).toHaveBeenCalledWith(new Date());
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.ASSET_DELETION, data: { id: asset.id, deleteOnDisk: true } },
      ]);
    });

    it('should queue assets for deletion after trash duration', async () => {
      const asset = factory.asset({ isOffline: false });

      mocks.asset.streamDeletedAssets.mockReturnValue(makeStream([asset]));
      mocks.systemMetadata.get.mockResolvedValue({ trash: { enabled: true, days: 7 } });

      await expect(sut.handleAssetDeletionCheck()).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.streamDeletedAssets).toHaveBeenCalledWith(DateTime.now().minus({ days: 7 }).toJSDate());
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.ASSET_DELETION, data: { id: asset.id, deleteOnDisk: true } },
      ]);
    });
  });

  describe('handleAssetDeletion', () => {
    it('should remove faces', async () => {
      const assetWithFace = { ...assetStub.image, faces: [faceStub.face1, faceStub.mergeFace1] };

      mocks.asset.getById.mockResolvedValue(assetWithFace);

      await sut.handleAssetDeletion({ id: assetWithFace.id, deleteOnDisk: true });

      expect(mocks.job.queue.mock.calls).toEqual([
        [
          {
            name: JobName.DELETE_FILES,
            data: {
              files: [
                '/uploads/user-id/webp/path.ext',
                '/uploads/user-id/thumbs/path.jpg',
                assetWithFace.encodedVideoPath,
                assetWithFace.sidecarPath,
                assetWithFace.originalPath,
              ],
            },
          },
        ],
      ]);

      expect(mocks.asset.remove).toHaveBeenCalledWith(assetWithFace);
    });

    it('should update stack primary asset if deleted asset was primary asset in a stack', async () => {
      mocks.stack.update.mockResolvedValue(factory.stack() as unknown as any);
      mocks.asset.getById.mockResolvedValue(assetStub.primaryImage as AssetEntity);

      await sut.handleAssetDeletion({ id: assetStub.primaryImage.id, deleteOnDisk: true });

      expect(mocks.stack.update).toHaveBeenCalledWith('stack-1', {
        id: 'stack-1',
        primaryAssetId: 'stack-child-asset-1',
      });
    });

    it('should delete the entire stack if deleted asset was the primary asset and the stack would only contain one asset afterwards', async () => {
      mocks.stack.delete.mockResolvedValue();
      mocks.asset.getById.mockResolvedValue({
        ...assetStub.primaryImage,
        stack: { ...assetStub.primaryImage.stack, assets: assetStub.primaryImage.stack!.assets.slice(0, 2) },
      } as AssetEntity);

      await sut.handleAssetDeletion({ id: assetStub.primaryImage.id, deleteOnDisk: true });

      expect(mocks.stack.delete).toHaveBeenCalledWith('stack-1');
    });

    it('should delete a live photo', async () => {
      mocks.asset.getById.mockResolvedValue(assetStub.livePhotoStillAsset);
      mocks.asset.getLivePhotoCount.mockResolvedValue(0);

      await sut.handleAssetDeletion({
        id: assetStub.livePhotoStillAsset.id,
        deleteOnDisk: true,
      });

      expect(mocks.job.queue.mock.calls).toEqual([
        [
          {
            name: JobName.ASSET_DELETION,
            data: {
              id: assetStub.livePhotoMotionAsset.id,
              deleteOnDisk: true,
            },
          },
        ],
        [
          {
            name: JobName.DELETE_FILES,
            data: {
              files: [undefined, undefined, undefined, undefined, 'fake_path/asset_1.jpeg'],
            },
          },
        ],
      ]);
    });

    it('should not delete a live motion part if it is being used by another asset', async () => {
      mocks.asset.getLivePhotoCount.mockResolvedValue(2);
      mocks.asset.getById.mockResolvedValue(assetStub.livePhotoStillAsset);

      await sut.handleAssetDeletion({
        id: assetStub.livePhotoStillAsset.id,
        deleteOnDisk: true,
      });

      expect(mocks.job.queue.mock.calls).toEqual([
        [
          {
            name: JobName.DELETE_FILES,
            data: {
              files: [undefined, undefined, undefined, undefined, 'fake_path/asset_1.jpeg'],
            },
          },
        ],
      ]);
    });

    it('should update usage', async () => {
      mocks.asset.getById.mockResolvedValue(assetStub.image);
      await sut.handleAssetDeletion({ id: assetStub.image.id, deleteOnDisk: true });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(assetStub.image.ownerId, -5000);
    });

    it('should fail if asset could not be found', async () => {
      await expect(sut.handleAssetDeletion({ id: assetStub.image.id, deleteOnDisk: true })).resolves.toBe(
        JobStatus.FAILED,
      );
    });
  });

  describe('run', () => {
    it('should run the refresh faces job', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.REFRESH_FACES });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.FACE_DETECTION, data: { id: 'asset-1' } }]);
    });

    it('should run the refresh metadata job', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.REFRESH_METADATA });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.METADATA_EXTRACTION, data: { id: 'asset-1' } }]);
    });

    it('should run the refresh thumbnails job', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.REGENERATE_THUMBNAIL });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.GENERATE_THUMBNAILS, data: { id: 'asset-1' } }]);
    });

    it('should run the transcode video', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.TRANSCODE_VIDEO });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.VIDEO_CONVERSION, data: { id: 'asset-1' } }]);
    });
  });

  describe('getUserAssetsByDeviceId', () => {
    it('get assets by device id', async () => {
      const assets = [assetStub.image, assetStub.image1];

      mocks.asset.getAllByDeviceId.mockResolvedValue(assets.map((asset) => asset.deviceAssetId));

      const deviceId = 'device-id';
      const result = await sut.getUserAssetsByDeviceId(authStub.user1, deviceId);

      expect(result.length).toEqual(2);
      expect(result).toEqual(assets.map((asset) => asset.deviceAssetId));
    });
  });
});

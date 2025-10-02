import { BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { MapAsset } from 'src/dtos/asset-response.dto';
import { AssetJobName, AssetStatsResponseDto } from 'src/dtos/asset.dto';
import { AssetStatus, AssetType, AssetVisibility, JobName, JobStatus } from 'src/enum';
import { AssetStats } from 'src/repositories/asset.repository';
import { AssetService } from 'src/services/asset.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { faceStub } from 'test/fixtures/face.stub';
import { userStub } from 'test/fixtures/user.stub';
import { factory } from 'test/small.factory';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

const stats: AssetStats = {
  [AssetType.Image]: 10,
  [AssetType.Video]: 23,
  [AssetType.Audio]: 0,
  [AssetType.Other]: 0,
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

  const mockGetById = (assets: MapAsset[]) => {
    mocks.asset.getById.mockImplementation((assetId) => Promise.resolve(assets.find((asset) => asset.id === assetId)));
  };

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AssetService));

    mockGetById([assetStub.livePhotoStillAsset, assetStub.livePhotoMotionAsset]);
  });

  describe('getStatistics', () => {
    it('should get the statistics for a user, excluding archived assets', async () => {
      mocks.asset.getStatistics.mockResolvedValue(stats);
      await expect(sut.getStatistics(authStub.admin, { visibility: AssetVisibility.Timeline })).resolves.toEqual(
        statResponse,
      );
      expect(mocks.asset.getStatistics).toHaveBeenCalledWith(authStub.admin.user.id, {
        visibility: AssetVisibility.Timeline,
      });
    });

    it('should get the statistics for a user for archived assets', async () => {
      mocks.asset.getStatistics.mockResolvedValue(stats);
      await expect(sut.getStatistics(authStub.admin, { visibility: AssetVisibility.Archive })).resolves.toEqual(
        statResponse,
      );
      expect(mocks.asset.getStatistics).toHaveBeenCalledWith(authStub.admin.user.id, {
        visibility: AssetVisibility.Archive,
      });
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
      const auth = factory.auth({ user: { id: partner.sharedWithId } });

      mocks.asset.getRandom.mockResolvedValue([assetStub.image]);
      mocks.partner.getAll.mockResolvedValue([partner]);

      await sut.getRandom(auth, 1);

      expect(mocks.asset.getRandom).toHaveBeenCalledWith([auth.user.id], 1);
    });

    it('should include partner assets if in timeline', async () => {
      const partner = factory.partner({ inTimeline: true });
      const auth = factory.auth({ user: { id: partner.sharedWithId } });

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
        undefined,
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
      await expect(
        sut.update(authStub.admin, 'asset-1', { visibility: AssetVisibility.Timeline }),
      ).rejects.toBeInstanceOf(BadRequestException);

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
      expect(mocks.asset.update).not.toHaveBeenCalledWith({
        id: assetStub.livePhotoMotionAsset.id,
        visibility: AssetVisibility.Timeline,
      });
      expect(mocks.event.emit).not.toHaveBeenCalledWith('AssetShow', {
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
      expect(mocks.asset.update).not.toHaveBeenCalledWith({
        id: assetStub.livePhotoMotionAsset.id,
        visibility: AssetVisibility.Timeline,
      });
      expect(mocks.event.emit).not.toHaveBeenCalledWith('AssetShow', {
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
      expect(mocks.asset.update).not.toHaveBeenCalledWith({
        id: assetStub.livePhotoMotionAsset.id,
        visibility: AssetVisibility.Timeline,
      });
      expect(mocks.event.emit).not.toHaveBeenCalledWith('AssetShow', {
        assetId: assetStub.livePhotoMotionAsset.id,
        userId: userStub.admin.id,
      });
    });

    it('should link a live video', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.livePhotoStillAsset.id]));
      mocks.asset.getById.mockResolvedValueOnce({
        ...assetStub.livePhotoMotionAsset,
        ownerId: authStub.admin.user.id,
        visibility: AssetVisibility.Timeline,
      });
      mocks.asset.getById.mockResolvedValueOnce(assetStub.image);
      mocks.asset.update.mockResolvedValue(assetStub.image);

      await sut.update(authStub.admin, assetStub.livePhotoStillAsset.id, {
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });

      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoMotionAsset.id,
        visibility: AssetVisibility.Hidden,
      });
      expect(mocks.event.emit).toHaveBeenCalledWith('AssetHide', {
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
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoMotionAsset.id,
        visibility: assetStub.livePhotoStillAsset.visibility,
      });
      expect(mocks.event.emit).toHaveBeenCalledWith('AssetShow', {
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
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should update all assets', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));

      await sut.updateAll(authStub.admin, { ids: ['asset-1', 'asset-2'], visibility: AssetVisibility.Archive });

      expect(mocks.asset.updateAll).toHaveBeenCalledWith(['asset-1', 'asset-2'], {
        visibility: AssetVisibility.Archive,
      });
    });

    it('should not update Assets table if no relevant fields are provided', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.updateAll(authStub.admin, {
        ids: ['asset-1'],
        latitude: 0,
        longitude: 0,
        isFavorite: undefined,
        duplicateId: undefined,
        rating: undefined,
      });
      expect(mocks.asset.updateAll).not.toHaveBeenCalled();
    });

    it('should update Assets table if visibility field is provided', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.updateAll(authStub.admin, {
        ids: ['asset-1'],
        latitude: 0,
        longitude: 0,
        visibility: AssetVisibility.Archive,
        isFavorite: false,
        duplicateId: undefined,
        rating: undefined,
      });
      expect(mocks.asset.updateAll).toHaveBeenCalled();
      expect(mocks.asset.updateAllExif).toHaveBeenCalledWith(['asset-1'], { latitude: 0, longitude: 0 });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.SidecarWrite, data: { id: 'asset-1', latitude: 0, longitude: 0 } },
      ]);
    });

    it('should update exif table if latitude field is provided', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      const dateTimeOriginal = new Date().toISOString();
      await sut.updateAll(authStub.admin, {
        ids: ['asset-1'],
        latitude: 30,
        longitude: 50,
        dateTimeOriginal,
        isFavorite: false,
        duplicateId: undefined,
        rating: undefined,
      });
      expect(mocks.asset.updateAll).toHaveBeenCalled();
      expect(mocks.asset.updateAllExif).toHaveBeenCalledWith(['asset-1'], {
        dateTimeOriginal,
        latitude: 30,
        longitude: 50,
      });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.SidecarWrite, data: { id: 'asset-1', dateTimeOriginal, latitude: 30, longitude: 50 } },
      ]);
    });

    it('should update Assets table if duplicateId is provided as null', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.updateAll(authStub.admin, {
        ids: ['asset-1'],
        latitude: 0,
        longitude: 0,
        isFavorite: undefined,
        duplicateId: null,
        rating: undefined,
      });
      expect(mocks.asset.updateAll).toHaveBeenCalled();
    });

    it('should update exif table if dateTimeRelative and timeZone field is provided', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      const dateTimeRelative = 35;
      const timeZone = 'UTC+2';
      mocks.asset.updateDateTimeOriginal.mockResolvedValue([
        { assetId: 'asset-1', dateTimeOriginal: new Date('2020-02-25T04:41:00'), timeZone },
      ]);
      await sut.updateAll(authStub.admin, {
        ids: ['asset-1'],
        dateTimeRelative,
        timeZone,
      });
      expect(mocks.asset.updateDateTimeOriginal).toHaveBeenCalledWith(['asset-1'], dateTimeRelative, timeZone);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.SidecarWrite,
          data: {
            id: 'asset-1',
            dateTimeOriginal: '2020-02-25T06:41:00.000+02:00',
            description: undefined,
            latitude: undefined,
            longitude: undefined,
          },
        },
      ]);
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

      expect(mocks.event.emit).toHaveBeenCalledWith('AssetDeleteAll', {
        assetIds: ['asset1', 'asset2'],
        userId: 'user-id',
      });
    });

    it('should soft delete a batch of assets', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1', 'asset2']));

      await sut.deleteAll(authStub.user1, { ids: ['asset1', 'asset2'], force: false });

      expect(mocks.asset.updateAll).toHaveBeenCalledWith(['asset1', 'asset2'], {
        deletedAt: expect.any(Date),
        status: AssetStatus.Trashed,
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

      mocks.assetJob.streamForDeletedJob.mockReturnValue(makeStream([asset]));
      mocks.systemMetadata.get.mockResolvedValue({ trash: { enabled: false } });

      await expect(sut.handleAssetDeletionCheck()).resolves.toBe(JobStatus.Success);

      expect(mocks.assetJob.streamForDeletedJob).toHaveBeenCalledWith(new Date());
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetDelete, data: { id: asset.id, deleteOnDisk: true } },
      ]);
    });

    it('should queue assets for deletion after trash duration', async () => {
      const asset = factory.asset({ isOffline: false });

      mocks.assetJob.streamForDeletedJob.mockReturnValue(makeStream([asset]));
      mocks.systemMetadata.get.mockResolvedValue({ trash: { enabled: true, days: 7 } });

      await expect(sut.handleAssetDeletionCheck()).resolves.toBe(JobStatus.Success);

      expect(mocks.assetJob.streamForDeletedJob).toHaveBeenCalledWith(DateTime.now().minus({ days: 7 }).toJSDate());
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetDelete, data: { id: asset.id, deleteOnDisk: true } },
      ]);
    });
  });

  describe('handleAssetDeletion', () => {
    it('should remove faces', async () => {
      const assetWithFace = { ...assetStub.image, faces: [faceStub.face1, faceStub.mergeFace1] };

      mocks.assetJob.getForAssetDeletion.mockResolvedValue(assetWithFace);

      await sut.handleAssetDeletion({ id: assetWithFace.id, deleteOnDisk: true });

      expect(mocks.job.queue.mock.calls).toEqual([
        [
          {
            name: JobName.FileDelete,
            data: {
              files: [
                '/uploads/user-id/webp/path.ext',
                '/uploads/user-id/thumbs/path.jpg',
                '/uploads/user-id/fullsize/path.webp',
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
      mocks.stack.update.mockResolvedValue(factory.stack() as any);
      mocks.assetJob.getForAssetDeletion.mockResolvedValue(assetStub.primaryImage);

      await sut.handleAssetDeletion({ id: assetStub.primaryImage.id, deleteOnDisk: true });

      expect(mocks.stack.update).toHaveBeenCalledWith('stack-1', {
        id: 'stack-1',
        primaryAssetId: 'stack-child-asset-1',
      });
    });

    it('should delete the entire stack if deleted asset was the primary asset and the stack would only contain one asset afterwards', async () => {
      mocks.stack.delete.mockResolvedValue();
      mocks.assetJob.getForAssetDeletion.mockResolvedValue({
        ...assetStub.primaryImage,
        stack: { ...assetStub.primaryImage.stack, assets: assetStub.primaryImage.stack!.assets.slice(0, 2) },
      });

      await sut.handleAssetDeletion({ id: assetStub.primaryImage.id, deleteOnDisk: true });

      expect(mocks.stack.delete).toHaveBeenCalledWith('stack-1');
    });

    it('should delete a live photo', async () => {
      mocks.assetJob.getForAssetDeletion.mockResolvedValue(assetStub.livePhotoStillAsset as any);
      mocks.asset.getLivePhotoCount.mockResolvedValue(0);

      await sut.handleAssetDeletion({
        id: assetStub.livePhotoStillAsset.id,
        deleteOnDisk: true,
      });

      expect(mocks.job.queue.mock.calls).toEqual([
        [
          {
            name: JobName.AssetDelete,
            data: {
              id: assetStub.livePhotoMotionAsset.id,
              deleteOnDisk: true,
            },
          },
        ],
        [
          {
            name: JobName.FileDelete,
            data: {
              files: [
                '/uploads/user-id/webp/path.ext',
                '/uploads/user-id/thumbs/path.jpg',
                '/uploads/user-id/fullsize/path.webp',
                undefined,
                undefined,
                'fake_path/asset_1.jpeg',
              ],
            },
          },
        ],
      ]);
    });

    it('should not delete a live motion part if it is being used by another asset', async () => {
      mocks.asset.getLivePhotoCount.mockResolvedValue(2);
      mocks.assetJob.getForAssetDeletion.mockResolvedValue(assetStub.livePhotoStillAsset as any);

      await sut.handleAssetDeletion({
        id: assetStub.livePhotoStillAsset.id,
        deleteOnDisk: true,
      });

      expect(mocks.job.queue.mock.calls).toEqual([
        [
          {
            name: JobName.FileDelete,
            data: {
              files: [
                '/uploads/user-id/webp/path.ext',
                '/uploads/user-id/thumbs/path.jpg',
                '/uploads/user-id/fullsize/path.webp',
                undefined,
                undefined,
                'fake_path/asset_1.jpeg',
              ],
            },
          },
        ],
      ]);
    });

    it('should update usage', async () => {
      mocks.assetJob.getForAssetDeletion.mockResolvedValue(assetStub.image);
      await sut.handleAssetDeletion({ id: assetStub.image.id, deleteOnDisk: true });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(assetStub.image.ownerId, -5000);
    });

    it('should fail if asset could not be found', async () => {
      mocks.assetJob.getForAssetDeletion.mockResolvedValue(void 0);
      await expect(sut.handleAssetDeletion({ id: assetStub.image.id, deleteOnDisk: true })).resolves.toBe(
        JobStatus.Failed,
      );
    });
  });

  describe('run', () => {
    it('should run the refresh faces job', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.REFRESH_FACES });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.AssetDetectFaces, data: { id: 'asset-1' } }]);
    });

    it('should run the refresh metadata job', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.REFRESH_METADATA });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetExtractMetadata, data: { id: 'asset-1' } },
      ]);
    });

    it('should run the refresh thumbnails job', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.REGENERATE_THUMBNAIL });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-1' } },
      ]);
    });

    it('should run the transcode video', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.TRANSCODE_VIDEO });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.AssetEncodeVideo, data: { id: 'asset-1' } }]);
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

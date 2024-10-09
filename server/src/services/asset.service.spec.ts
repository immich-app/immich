import { BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { AssetJobName, AssetStatsResponseDto } from 'src/dtos/asset.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { AssetStatus, AssetType } from 'src/enum';
import { AssetStats, IAssetRepository } from 'src/interfaces/asset.interface';
import { IEventRepository } from 'src/interfaces/event.interface';
import { IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { IStackRepository } from 'src/interfaces/stack.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { AssetService } from 'src/services/asset.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { faceStub } from 'test/fixtures/face.stub';
import { partnerStub } from 'test/fixtures/partner.stub';
import { userStub } from 'test/fixtures/user.stub';
import { IAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newTestService } from 'test/utils';
import { Mocked, vitest } from 'vitest';

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

  let accessMock: IAccessRepositoryMock;
  let assetMock: Mocked<IAssetRepository>;
  let eventMock: Mocked<IEventRepository>;
  let jobMock: Mocked<IJobRepository>;
  let partnerMock: Mocked<IPartnerRepository>;
  let stackMock: Mocked<IStackRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let userMock: Mocked<IUserRepository>;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  const mockGetById = (assets: AssetEntity[]) => {
    assetMock.getById.mockImplementation((assetId) =>
      Promise.resolve(assets.find((asset) => asset.id === assetId) ?? null),
    );
  };

  beforeEach(() => {
    ({ sut, accessMock, assetMock, eventMock, jobMock, partnerMock, stackMock, systemMock, userMock } =
      newTestService(AssetService));

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

      partnerMock.getAll.mockResolvedValue([]);
      assetMock.getByDayOfYear.mockResolvedValue([image1, image2, image3, image4]);

      await expect(sut.getMemoryLane(authStub.admin, { day: 15, month: 1 })).resolves.toEqual([
        { yearsAgo: 1, title: '1 year ago', assets: [mapAsset(image1), mapAsset(image2)] },
        { yearsAgo: 9, title: '9 years ago', assets: [mapAsset(image3)] },
        { yearsAgo: 15, title: '15 years ago', assets: [mapAsset(image4)] },
      ]);

      expect(assetMock.getByDayOfYear.mock.calls).toEqual([[[authStub.admin.user.id], { day: 15, month: 1 }]]);
    });

    it('should get memories with partners with inTimeline enabled', async () => {
      partnerMock.getAll.mockResolvedValue([partnerStub.user1ToAdmin1]);
      assetMock.getByDayOfYear.mockResolvedValue([]);

      await sut.getMemoryLane(authStub.admin, { day: 15, month: 1 });

      expect(assetMock.getByDayOfYear.mock.calls).toEqual([
        [[authStub.admin.user.id, userStub.user1.id], { day: 15, month: 1 }],
      ]);
    });
  });

  describe('getStatistics', () => {
    it('should get the statistics for a user, excluding archived assets', async () => {
      assetMock.getStatistics.mockResolvedValue(stats);
      await expect(sut.getStatistics(authStub.admin, { isArchived: false })).resolves.toEqual(statResponse);
      expect(assetMock.getStatistics).toHaveBeenCalledWith(authStub.admin.user.id, { isArchived: false });
    });

    it('should get the statistics for a user for archived assets', async () => {
      assetMock.getStatistics.mockResolvedValue(stats);
      await expect(sut.getStatistics(authStub.admin, { isArchived: true })).resolves.toEqual(statResponse);
      expect(assetMock.getStatistics).toHaveBeenCalledWith(authStub.admin.user.id, { isArchived: true });
    });

    it('should get the statistics for a user for favorite assets', async () => {
      assetMock.getStatistics.mockResolvedValue(stats);
      await expect(sut.getStatistics(authStub.admin, { isFavorite: true })).resolves.toEqual(statResponse);
      expect(assetMock.getStatistics).toHaveBeenCalledWith(authStub.admin.user.id, { isFavorite: true });
    });

    it('should get the statistics for a user for all assets', async () => {
      assetMock.getStatistics.mockResolvedValue(stats);
      await expect(sut.getStatistics(authStub.admin, {})).resolves.toEqual(statResponse);
      expect(assetMock.getStatistics).toHaveBeenCalledWith(authStub.admin.user.id, {});
    });
  });

  describe('getRandom', () => {
    it('should get own random assets', async () => {
      assetMock.getRandom.mockResolvedValue([assetStub.image]);
      await sut.getRandom(authStub.admin, 1);
      expect(assetMock.getRandom).toHaveBeenCalledWith([authStub.admin.user.id], 1);
    });

    it('should not include partner assets if not in timeline', async () => {
      assetMock.getRandom.mockResolvedValue([assetStub.image]);
      partnerMock.getAll.mockResolvedValue([{ ...partnerStub.user1ToAdmin1, inTimeline: false }]);
      await sut.getRandom(authStub.admin, 1);
      expect(assetMock.getRandom).toHaveBeenCalledWith([authStub.admin.user.id], 1);
    });

    it('should include partner assets if in timeline', async () => {
      assetMock.getRandom.mockResolvedValue([assetStub.image]);
      partnerMock.getAll.mockResolvedValue([partnerStub.user1ToAdmin1]);
      await sut.getRandom(authStub.admin, 1);
      expect(assetMock.getRandom).toHaveBeenCalledWith([userStub.admin.id, userStub.user1.id], 1);
    });
  });

  describe('get', () => {
    it('should allow owner access', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      assetMock.getById.mockResolvedValue(assetStub.image);
      await sut.get(authStub.admin, assetStub.image.id);
      expect(accessMock.asset.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set([assetStub.image.id]),
      );
    });

    it('should allow shared link access', async () => {
      accessMock.asset.checkSharedLinkAccess.mockResolvedValue(new Set([assetStub.image.id]));
      assetMock.getById.mockResolvedValue(assetStub.image);
      await sut.get(authStub.adminSharedLink, assetStub.image.id);
      expect(accessMock.asset.checkSharedLinkAccess).toHaveBeenCalledWith(
        authStub.adminSharedLink.sharedLink?.id,
        new Set([assetStub.image.id]),
      );
    });

    it('should strip metadata for shared link if exif is disabled', async () => {
      accessMock.asset.checkSharedLinkAccess.mockResolvedValue(new Set([assetStub.image.id]));
      assetMock.getById.mockResolvedValue(assetStub.image);

      const result = await sut.get(
        { ...authStub.adminSharedLink, sharedLink: { ...authStub.adminSharedLink.sharedLink!, showExif: false } },
        assetStub.image.id,
      );

      expect(result).toEqual(expect.objectContaining({ hasMetadata: false }));
      expect(result).not.toHaveProperty('exifInfo');
      expect(accessMock.asset.checkSharedLinkAccess).toHaveBeenCalledWith(
        authStub.adminSharedLink.sharedLink?.id,
        new Set([assetStub.image.id]),
      );
    });

    it('should allow partner sharing access', async () => {
      accessMock.asset.checkPartnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      assetMock.getById.mockResolvedValue(assetStub.image);
      await sut.get(authStub.admin, assetStub.image.id);
      expect(accessMock.asset.checkPartnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set([assetStub.image.id]),
      );
    });

    it('should allow shared album access', async () => {
      accessMock.asset.checkAlbumAccess.mockResolvedValue(new Set([assetStub.image.id]));
      assetMock.getById.mockResolvedValue(assetStub.image);
      await sut.get(authStub.admin, assetStub.image.id);
      expect(accessMock.asset.checkAlbumAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set([assetStub.image.id]),
      );
    });

    it('should throw an error for no access', async () => {
      await expect(sut.get(authStub.admin, assetStub.image.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(assetMock.getById).not.toHaveBeenCalled();
    });

    it('should throw an error for an invalid shared link', async () => {
      await expect(sut.get(authStub.adminSharedLink, assetStub.image.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(accessMock.asset.checkOwnerAccess).not.toHaveBeenCalled();
      expect(assetMock.getById).not.toHaveBeenCalled();
    });

    it('should throw an error if the asset could not be found', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      await expect(sut.get(authStub.admin, assetStub.image.id)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('should require asset write access for the id', async () => {
      await expect(sut.update(authStub.admin, 'asset-1', { isArchived: false })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(assetMock.update).not.toHaveBeenCalled();
    });

    it('should update the asset', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      assetMock.getById.mockResolvedValue(assetStub.image);
      await sut.update(authStub.admin, 'asset-1', { isFavorite: true });
      expect(assetMock.update).toHaveBeenCalledWith({ id: 'asset-1', isFavorite: true });
    });

    it('should update the exif description', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      assetMock.getById.mockResolvedValue(assetStub.image);
      await sut.update(authStub.admin, 'asset-1', { description: 'Test description' });
      expect(assetMock.upsertExif).toHaveBeenCalledWith({ assetId: 'asset-1', description: 'Test description' });
    });

    it('should update the exif rating', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      assetMock.getById.mockResolvedValue(assetStub.image);
      await sut.update(authStub.admin, 'asset-1', { rating: 3 });
      expect(assetMock.upsertExif).toHaveBeenCalledWith({ assetId: 'asset-1', rating: 3 });
    });

    it('should fail linking a live video if the motion part could not be found', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.livePhotoStillAsset.id]));
      assetMock.getById.mockResolvedValue(null);

      await expect(
        sut.update(authStub.admin, assetStub.livePhotoStillAsset.id, {
          livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(assetMock.update).not.toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
      expect(assetMock.update).not.toHaveBeenCalledWith({ id: assetStub.livePhotoMotionAsset.id, isVisible: true });
      expect(eventMock.emit).not.toHaveBeenCalledWith('asset.show', {
        assetId: assetStub.livePhotoMotionAsset.id,
        userId: userStub.admin.id,
      });
    });

    it('should fail linking a live video if the motion part is not a video', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.livePhotoStillAsset.id]));
      assetMock.getById.mockResolvedValue(assetStub.livePhotoStillAsset);

      await expect(
        sut.update(authStub.admin, assetStub.livePhotoStillAsset.id, {
          livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(assetMock.update).not.toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
      expect(assetMock.update).not.toHaveBeenCalledWith({ id: assetStub.livePhotoMotionAsset.id, isVisible: true });
      expect(eventMock.emit).not.toHaveBeenCalledWith('asset.show', {
        assetId: assetStub.livePhotoMotionAsset.id,
        userId: userStub.admin.id,
      });
    });

    it('should fail linking a live video if the motion part has a different owner', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.livePhotoStillAsset.id]));
      assetMock.getById.mockResolvedValue(assetStub.livePhotoMotionAsset);

      await expect(
        sut.update(authStub.admin, assetStub.livePhotoStillAsset.id, {
          livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(assetMock.update).not.toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
      expect(assetMock.update).not.toHaveBeenCalledWith({ id: assetStub.livePhotoMotionAsset.id, isVisible: true });
      expect(eventMock.emit).not.toHaveBeenCalledWith('asset.show', {
        assetId: assetStub.livePhotoMotionAsset.id,
        userId: userStub.admin.id,
      });
    });

    it('should link a live video', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.livePhotoStillAsset.id]));
      assetMock.getById.mockResolvedValueOnce({
        ...assetStub.livePhotoMotionAsset,
        ownerId: authStub.admin.user.id,
        isVisible: true,
      });
      assetMock.getById.mockResolvedValueOnce(assetStub.image);

      await sut.update(authStub.admin, assetStub.livePhotoStillAsset.id, {
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });

      expect(assetMock.update).toHaveBeenCalledWith({ id: assetStub.livePhotoMotionAsset.id, isVisible: false });
      expect(eventMock.emit).toHaveBeenCalledWith('asset.hide', {
        assetId: assetStub.livePhotoMotionAsset.id,
        userId: userStub.admin.id,
      });
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
    });

    it('should throw an error if asset could not be found after update', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      await expect(sut.update(authStub.admin, 'asset-1', { isFavorite: true })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should unlink a live video', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.livePhotoStillAsset.id]));
      assetMock.getById.mockResolvedValueOnce(assetStub.livePhotoStillAsset);
      assetMock.getById.mockResolvedValueOnce(assetStub.livePhotoMotionAsset);
      assetMock.getById.mockResolvedValueOnce(assetStub.image);

      await sut.update(authStub.admin, assetStub.livePhotoStillAsset.id, { livePhotoVideoId: null });

      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: null,
      });
      expect(assetMock.update).toHaveBeenCalledWith({ id: assetStub.livePhotoMotionAsset.id, isVisible: true });
      expect(eventMock.emit).toHaveBeenCalledWith('asset.show', {
        assetId: assetStub.livePhotoMotionAsset.id,
        userId: userStub.admin.id,
      });
    });

    it('should fail unlinking a live video if the asset could not be found', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.livePhotoStillAsset.id]));
      assetMock.getById.mockResolvedValue(null);

      await expect(
        sut.update(authStub.admin, assetStub.livePhotoStillAsset.id, { livePhotoVideoId: null }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(assetMock.update).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalledWith();
      expect(eventMock.emit).not.toHaveBeenCalledWith();
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
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));
      await sut.updateAll(authStub.admin, { ids: ['asset-1', 'asset-2'], isArchived: true });
      expect(assetMock.updateAll).toHaveBeenCalledWith(['asset-1', 'asset-2'], { isArchived: true });
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
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1', 'asset2']));

      await sut.deleteAll(authStub.user1, { ids: ['asset1', 'asset2'], force: true });

      expect(eventMock.emit).toHaveBeenCalledWith('assets.delete', {
        assetIds: ['asset1', 'asset2'],
        userId: 'user-id',
      });
    });

    it('should soft delete a batch of assets', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1', 'asset2']));

      await sut.deleteAll(authStub.user1, { ids: ['asset1', 'asset2'], force: false });

      expect(assetMock.updateAll).toHaveBeenCalledWith(['asset1', 'asset2'], {
        deletedAt: expect.any(Date),
        status: AssetStatus.TRASHED,
      });
      expect(jobMock.queue.mock.calls).toEqual([]);
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
      assetMock.getAll.mockResolvedValue({ hasNextPage: false, items: [assetStub.image] });
      systemMock.get.mockResolvedValue({ trash: { enabled: false } });

      await expect(sut.handleAssetDeletionCheck()).resolves.toBe(JobStatus.SUCCESS);

      expect(assetMock.getAll).toHaveBeenCalledWith(expect.anything(), { trashedBefore: new Date() });
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        { name: JobName.ASSET_DELETION, data: { id: assetStub.image.id, deleteOnDisk: true } },
      ]);
    });

    it('should queue assets for deletion after trash duration', async () => {
      assetMock.getAll.mockResolvedValue({ hasNextPage: false, items: [assetStub.image] });
      systemMock.get.mockResolvedValue({ trash: { enabled: true, days: 7 } });

      await expect(sut.handleAssetDeletionCheck()).resolves.toBe(JobStatus.SUCCESS);

      expect(assetMock.getAll).toHaveBeenCalledWith(expect.anything(), {
        trashedBefore: DateTime.now().minus({ days: 7 }).toJSDate(),
      });
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        { name: JobName.ASSET_DELETION, data: { id: assetStub.image.id, deleteOnDisk: true } },
      ]);
    });
  });

  describe('handleAssetDeletion', () => {
    it('should remove faces', async () => {
      const assetWithFace = { ...assetStub.image, faces: [faceStub.face1, faceStub.mergeFace1] };

      assetMock.getById.mockResolvedValue(assetWithFace);

      await sut.handleAssetDeletion({ id: assetWithFace.id, deleteOnDisk: true });

      expect(jobMock.queue.mock.calls).toEqual([
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

      expect(assetMock.remove).toHaveBeenCalledWith(assetWithFace);
    });

    it('should update stack primary asset if deleted asset was primary asset in a stack', async () => {
      assetMock.getById.mockResolvedValue(assetStub.primaryImage as AssetEntity);

      await sut.handleAssetDeletion({ id: assetStub.primaryImage.id, deleteOnDisk: true });

      expect(stackMock.update).toHaveBeenCalledWith({
        id: 'stack-1',
        primaryAssetId: 'stack-child-asset-1',
      });
    });

    it('should delete the entire stack if deleted asset was the primary asset and the stack would only contain one asset afterwards', async () => {
      assetMock.getById.mockResolvedValue({
        ...assetStub.primaryImage,
        stack: { ...assetStub.primaryImage.stack, assets: assetStub.primaryImage.stack!.assets.slice(0, 2) },
      } as AssetEntity);

      await sut.handleAssetDeletion({ id: assetStub.primaryImage.id, deleteOnDisk: true });

      expect(stackMock.delete).toHaveBeenCalledWith('stack-1');
    });

    it('should delete a live photo', async () => {
      assetMock.getById.mockResolvedValue(assetStub.livePhotoStillAsset);
      assetMock.getLivePhotoCount.mockResolvedValue(0);

      await sut.handleAssetDeletion({
        id: assetStub.livePhotoStillAsset.id,
        deleteOnDisk: true,
      });

      expect(jobMock.queue.mock.calls).toEqual([
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
      assetMock.getLivePhotoCount.mockResolvedValue(2);
      assetMock.getById.mockResolvedValue(assetStub.livePhotoStillAsset);

      await sut.handleAssetDeletion({
        id: assetStub.livePhotoStillAsset.id,
        deleteOnDisk: true,
      });

      expect(jobMock.queue.mock.calls).toEqual([
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
      assetMock.getById.mockResolvedValue(assetStub.image);
      await sut.handleAssetDeletion({ id: assetStub.image.id, deleteOnDisk: true });
      expect(userMock.updateUsage).toHaveBeenCalledWith(assetStub.image.ownerId, -5000);
    });

    it('should fail if asset could not be found', async () => {
      await expect(sut.handleAssetDeletion({ id: assetStub.image.id, deleteOnDisk: true })).resolves.toBe(
        JobStatus.FAILED,
      );
    });
  });

  describe('run', () => {
    it('should run the refresh faces job', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.REFRESH_FACES });
      expect(jobMock.queueAll).toHaveBeenCalledWith([{ name: JobName.FACE_DETECTION, data: { id: 'asset-1' } }]);
    });

    it('should run the refresh metadata job', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.REFRESH_METADATA });
      expect(jobMock.queueAll).toHaveBeenCalledWith([{ name: JobName.METADATA_EXTRACTION, data: { id: 'asset-1' } }]);
    });

    it('should run the refresh thumbnails job', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.REGENERATE_THUMBNAIL });
      expect(jobMock.queueAll).toHaveBeenCalledWith([{ name: JobName.GENERATE_THUMBNAILS, data: { id: 'asset-1' } }]);
    });

    it('should run the transcode video', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.TRANSCODE_VIDEO });
      expect(jobMock.queueAll).toHaveBeenCalledWith([{ name: JobName.VIDEO_CONVERSION, data: { id: 'asset-1' } }]);
    });
  });

  describe('getUserAssetsByDeviceId', () => {
    it('get assets by device id', async () => {
      const assets = [assetStub.image, assetStub.image1];

      assetMock.getAllByDeviceId.mockResolvedValue(assets.map((asset) => asset.deviceAssetId));

      const deviceId = 'device-id';
      const result = await sut.getUserAssetsByDeviceId(authStub.user1, deviceId);

      expect(result.length).toEqual(2);
      expect(result).toEqual(assets.map((asset) => asset.deviceAssetId));
    });
  });
});

import { BadRequestException } from '@nestjs/common';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { AssetJobName, AssetStatsResponseDto } from 'src/dtos/asset.dto';
import { AssetEntity, AssetType } from 'src/entities/asset.entity';
import { AssetStats, IAssetRepository } from 'src/interfaces/asset.interface';
import { ClientEvent, IEventRepository } from 'src/interfaces/event.interface';
import { IJobRepository, JobName } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { IStackRepository } from 'src/interfaces/stack.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { AssetService } from 'src/services/asset.service';
import { assetStub, stackStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { faceStub } from 'test/fixtures/face.stub';
import { partnerStub } from 'test/fixtures/partner.stub';
import { userStub } from 'test/fixtures/user.stub';
import { IAccessRepositoryMock, newAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newAssetRepositoryMock } from 'test/repositories/asset.repository.mock';
import { newEventRepositoryMock } from 'test/repositories/event.repository.mock';
import { newJobRepositoryMock } from 'test/repositories/job.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newPartnerRepositoryMock } from 'test/repositories/partner.repository.mock';
import { newStackRepositoryMock } from 'test/repositories/stack.repository.mock';
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { newUserRepositoryMock } from 'test/repositories/user.repository.mock';
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
  let jobMock: Mocked<IJobRepository>;
  let userMock: Mocked<IUserRepository>;
  let eventMock: Mocked<IEventRepository>;
  let stackMock: Mocked<IStackRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let partnerMock: Mocked<IPartnerRepository>;
  let loggerMock: Mocked<ILoggerRepository>;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  const mockGetById = (assets: AssetEntity[]) => {
    assetMock.getById.mockImplementation((assetId) =>
      Promise.resolve(assets.find((asset) => asset.id === assetId) ?? null),
    );
  };

  beforeEach(() => {
    accessMock = newAccessRepositoryMock();
    assetMock = newAssetRepositoryMock();
    eventMock = newEventRepositoryMock();
    jobMock = newJobRepositoryMock();
    userMock = newUserRepositoryMock();
    systemMock = newSystemMetadataRepositoryMock();
    partnerMock = newPartnerRepositoryMock();
    stackMock = newStackRepositoryMock();
    loggerMock = newLoggerRepositoryMock();

    sut = new AssetService(
      accessMock,
      assetMock,
      jobMock,
      systemMock,
      userMock,
      eventMock,
      partnerMock,
      stackMock,
      loggerMock,
    );

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

    /// Stack related

    it('should require asset update access for parent', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      await expect(
        sut.updateAll(authStub.user1, {
          ids: ['asset-1'],
          stackParentId: 'parent',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should update parent asset updatedAt when children are added', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['parent']));
      mockGetById([{ ...assetStub.image, id: 'parent' }]);
      await sut.updateAll(authStub.user1, {
        ids: [],
        stackParentId: 'parent',
      }),
        expect(assetMock.updateAll).toHaveBeenCalledWith(['parent'], { updatedAt: expect.any(Date) });
    });

    it('should update parent asset when children are removed', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['child-1']));
      assetMock.getByIds.mockResolvedValue([
        {
          id: 'child-1',
          stackId: 'stack-1',
          stack: stackStub('stack-1', [{ id: 'parent' } as AssetEntity, { id: 'child-1' } as AssetEntity]),
        } as AssetEntity,
      ]);
      stackMock.getById.mockResolvedValue(stackStub('stack-1', [{ id: 'parent' } as AssetEntity]));

      await sut.updateAll(authStub.user1, {
        ids: ['child-1'],
        removeParent: true,
      });
      expect(assetMock.updateAll).toHaveBeenCalledWith(expect.arrayContaining(['child-1']), { stack: null });
      expect(assetMock.updateAll).toHaveBeenCalledWith(expect.arrayContaining(['parent']), {
        updatedAt: expect.any(Date),
      });
      expect(stackMock.delete).toHaveBeenCalledWith('stack-1');
    });

    it('update parentId for new children', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValueOnce(new Set(['child-1', 'child-2']));
      accessMock.asset.checkOwnerAccess.mockResolvedValueOnce(new Set(['parent']));
      const stack = stackStub('stack-1', [
        { id: 'parent' } as AssetEntity,
        { id: 'child-1' } as AssetEntity,
        { id: 'child-2' } as AssetEntity,
      ]);
      assetMock.getById.mockResolvedValue({
        id: 'child-1',
        stack,
      } as AssetEntity);

      await sut.updateAll(authStub.user1, {
        stackParentId: 'parent',
        ids: ['child-1', 'child-2'],
      });

      expect(stackMock.update).toHaveBeenCalledWith({
        ...stackStub('stack-1', [
          { id: 'child-1' } as AssetEntity,
          { id: 'child-2' } as AssetEntity,
          { id: 'parent' } as AssetEntity,
        ]),
        primaryAsset: undefined,
      });
      expect(assetMock.updateAll).toBeCalledWith(['child-1', 'child-2', 'parent'], { updatedAt: expect.any(Date) });
    });

    it('remove stack for removed children', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['child-1', 'child-2']));
      await sut.updateAll(authStub.user1, {
        removeParent: true,
        ids: ['child-1', 'child-2'],
      });

      expect(assetMock.updateAll).toBeCalledWith(['child-1', 'child-2'], { stack: null });
    });

    it('merge stacks if new child has children', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValueOnce(new Set(['child-1']));
      accessMock.asset.checkOwnerAccess.mockResolvedValueOnce(new Set(['parent']));
      assetMock.getById.mockResolvedValue({ ...assetStub.image, id: 'parent' });
      assetMock.getByIds.mockResolvedValue([
        {
          id: 'child-1',
          stackId: 'stack-1',
          stack: stackStub('stack-1', [{ id: 'child-1' } as AssetEntity, { id: 'child-2' } as AssetEntity]),
        } as AssetEntity,
      ]);
      stackMock.getById.mockResolvedValue(stackStub('stack-1', [{ id: 'parent' } as AssetEntity]));

      await sut.updateAll(authStub.user1, {
        ids: ['child-1'],
        stackParentId: 'parent',
      });

      expect(stackMock.delete).toHaveBeenCalledWith('stack-1');
      expect(stackMock.create).toHaveBeenCalledWith({
        assets: [{ id: 'child-1' }, { id: 'parent' }, { id: 'child-1' }, { id: 'child-2' }],
        ownerId: 'user-id',
        primaryAssetId: 'parent',
      });
      expect(assetMock.updateAll).toBeCalledWith(['child-1', 'parent', 'child-1', 'child-2'], {
        updatedAt: expect.any(Date),
      });
    });

    it('should send ws asset update event', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValueOnce(new Set(['asset-1']));
      accessMock.asset.checkOwnerAccess.mockResolvedValueOnce(new Set(['parent']));
      assetMock.getById.mockResolvedValue(assetStub.image);

      await sut.updateAll(authStub.user1, {
        ids: ['asset-1'],
        stackParentId: 'parent',
      });

      expect(eventMock.clientSend).toHaveBeenCalledWith(ClientEvent.ASSET_STACK_UPDATE, authStub.user1.user.id, [
        'asset-1',
        'parent',
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
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1', 'asset2']));

      await sut.deleteAll(authStub.user1, { ids: ['asset1', 'asset2'], force: true });

      expect(jobMock.queueAll).toHaveBeenCalledWith([
        { name: JobName.ASSET_DELETION, data: { id: 'asset1', deleteOnDisk: true } },
        { name: JobName.ASSET_DELETION, data: { id: 'asset2', deleteOnDisk: true } },
      ]);
    });

    it('should soft delete a batch of assets', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset1', 'asset2']));

      await sut.deleteAll(authStub.user1, { ids: ['asset1', 'asset2'], force: false });

      expect(assetMock.softDeleteAll).toHaveBeenCalledWith(['asset1', 'asset2']);
      expect(jobMock.queue.mock.calls).toEqual([]);
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
                assetWithFace.thumbnailPath,
                assetWithFace.previewPath,
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
  });

  describe('run', () => {
    it('should run the refresh metadata job', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.REFRESH_METADATA }),
        expect(jobMock.queueAll).toHaveBeenCalledWith([{ name: JobName.METADATA_EXTRACTION, data: { id: 'asset-1' } }]);
    });

    it('should run the refresh thumbnails job', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.REGENERATE_THUMBNAIL }),
        expect(jobMock.queueAll).toHaveBeenCalledWith([{ name: JobName.GENERATE_PREVIEW, data: { id: 'asset-1' } }]);
    });

    it('should run the transcode video', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      await sut.run(authStub.admin, { assetIds: ['asset-1'], name: AssetJobName.TRANSCODE_VIDEO }),
        expect(jobMock.queueAll).toHaveBeenCalledWith([{ name: JobName.VIDEO_CONVERSION, data: { id: 'asset-1' } }]);
    });
  });

  describe('updateStackParent', () => {
    it('should require asset update access for new parent', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['old']));
      await expect(
        sut.updateStackParent(authStub.user1, {
          oldParentId: 'old',
          newParentId: 'new',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should require asset read access for old parent', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['new']));
      await expect(
        sut.updateStackParent(authStub.user1, {
          oldParentId: 'old',
          newParentId: 'new',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('make old parent the child of new parent', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValueOnce(new Set([assetStub.image.id]));
      accessMock.asset.checkOwnerAccess.mockResolvedValueOnce(new Set(['new']));
      assetMock.getById.mockResolvedValue({ ...assetStub.image, stackId: 'stack-1' });

      await sut.updateStackParent(authStub.user1, {
        oldParentId: assetStub.image.id,
        newParentId: 'new',
      });

      expect(stackMock.update).toBeCalledWith({ id: 'stack-1', primaryAssetId: 'new' });
      expect(assetMock.updateAll).toBeCalledWith([assetStub.image.id, 'new', assetStub.image.id], {
        updatedAt: expect.any(Date),
      });
    });
  });

  it('get assets by device id', async () => {
    const assets = [assetStub.image, assetStub.image1];

    assetMock.getAllByDeviceId.mockResolvedValue(assets.map((asset) => asset.deviceAssetId));

    const deviceId = 'device-id';
    const result = await sut.getUserAssetsByDeviceId(authStub.user1, deviceId);

    expect(result.length).toEqual(2);
    expect(result).toEqual(assets.map((asset) => asset.deviceAssetId));
  });
});

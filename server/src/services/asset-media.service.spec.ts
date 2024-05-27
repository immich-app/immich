import { Stats } from 'node:fs';
import { AssetMediaStatusEnum, AssetRejectReason, AssetUploadAction } from 'src/dtos/asset-media-response.dto';
import { AssetMediaReplaceDto } from 'src/dtos/asset-media.dto';
import { ASSET_CHECKSUM_CONSTRAINT, AssetEntity, AssetType } from 'src/entities/asset.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IEventRepository } from 'src/interfaces/event.interface';
import { IJobRepository, JobName } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { AssetMediaService, UploadFile } from 'src/services/asset-media.service';
import { mimeTypes } from 'src/utils/mime-types';
import { authStub } from 'test/fixtures/auth.stub';
import { fileStub } from 'test/fixtures/file.stub';
import { IAccessRepositoryMock, newAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newAssetRepositoryMock } from 'test/repositories/asset.repository.mock';
import { newEventRepositoryMock } from 'test/repositories/event.repository.mock';
import { newJobRepositoryMock } from 'test/repositories/job.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newStorageRepositoryMock } from 'test/repositories/storage.repository.mock';
import { newUserRepositoryMock } from 'test/repositories/user.repository.mock';
import { QueryFailedError } from 'typeorm';
import { Mocked } from 'vitest';

const _getUpdateAssetDto = (): AssetMediaReplaceDto => {
  return Object.assign(new AssetMediaReplaceDto(), {
    deviceAssetId: 'deviceAssetId',
    deviceId: 'deviceId',
    fileModifiedAt: new Date('2024-04-15T23:41:36.910Z'),
    fileCreatedAt: new Date('2024-04-15T23:41:36.910Z'),
    updatedAt: new Date('2024-04-15T23:41:36.910Z'),
  });
};

const _getAsset_1 = () => {
  const asset_1 = new AssetEntity();

  asset_1.id = 'id_1';
  asset_1.ownerId = 'user_id_1';
  asset_1.deviceAssetId = 'device_asset_id_1';
  asset_1.deviceId = 'device_id_1';
  asset_1.type = AssetType.VIDEO;
  asset_1.originalPath = 'fake_path/asset_1.jpeg';
  asset_1.previewPath = '';
  asset_1.fileModifiedAt = new Date('2022-06-19T23:41:36.910Z');
  asset_1.fileCreatedAt = new Date('2022-06-19T23:41:36.910Z');
  asset_1.updatedAt = new Date('2022-06-19T23:41:36.910Z');
  asset_1.isFavorite = false;
  asset_1.isArchived = false;
  asset_1.thumbnailPath = '';
  asset_1.encodedVideoPath = '';
  asset_1.duration = '0:00:00.000000';
  asset_1.exifInfo = new ExifEntity();
  asset_1.exifInfo.latitude = 49.533_547;
  asset_1.exifInfo.longitude = 10.703_075;
  asset_1.livePhotoVideoId = null;
  asset_1.sidecarPath = null;
  return asset_1;
};
const _getExistingAsset = () => {
  return {
    ..._getAsset_1(),
    duration: null,
    type: AssetType.IMAGE,
    checksum: Buffer.from('_getExistingAsset', 'utf8'),
    libraryId: 'libraryId',
  } as AssetEntity;
};
const _getExistingAssetWithSideCar = () => {
  return {
    ..._getExistingAsset(),
    sidecarPath: 'sidecar-path',
    checksum: Buffer.from('_getExistingAssetWithSideCar', 'utf8'),
  } as AssetEntity;
};
const _getCopiedAsset = () => {
  return {
    id: 'copied-asset',
    originalPath: 'copied-path',
  } as AssetEntity;
};

describe('AssetMediaService', () => {
  let sut: AssetMediaService;
  let accessMock: IAccessRepositoryMock;
  let assetMock: Mocked<IAssetRepository>;
  let jobMock: Mocked<IJobRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let userMock: Mocked<IUserRepository>;
  let eventMock: Mocked<IEventRepository>;

  beforeEach(() => {
    accessMock = newAccessRepositoryMock();
    assetMock = newAssetRepositoryMock();
    jobMock = newJobRepositoryMock();
    loggerMock = newLoggerRepositoryMock();
    storageMock = newStorageRepositoryMock();
    userMock = newUserRepositoryMock();
    eventMock = newEventRepositoryMock();

    sut = new AssetMediaService(accessMock, assetMock, jobMock, storageMock, userMock, eventMock, loggerMock);
  });

  describe('replaceAsset', () => {
    const expectAssetUpdate = (
      existingAsset: AssetEntity,
      uploadFile: UploadFile,
      dto: AssetMediaReplaceDto,
      livePhotoVideo?: AssetEntity,
      sidecarPath?: UploadFile,
      // eslint-disable-next-line unicorn/consistent-function-scoping
    ) => {
      expect(assetMock.update).toHaveBeenCalledWith({
        id: existingAsset.id,
        checksum: uploadFile.checksum,
        originalFileName: uploadFile.originalName,
        originalPath: uploadFile.originalPath,
        deviceAssetId: dto.deviceAssetId,
        deviceId: dto.deviceId,
        fileCreatedAt: dto.fileCreatedAt,
        fileModifiedAt: dto.fileModifiedAt,
        localDateTime: dto.fileCreatedAt,
        type: mimeTypes.assetType(uploadFile.originalPath),
        duration: dto.duration || null,
        livePhotoVideo: livePhotoVideo ? { id: livePhotoVideo?.id } : null,
        sidecarPath: sidecarPath?.originalPath || null,
      });
    };

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const expectAssetCreateCopy = (existingAsset: AssetEntity) => {
      expect(assetMock.create).toHaveBeenCalledWith({
        ownerId: existingAsset.ownerId,
        originalPath: existingAsset.originalPath,
        originalFileName: existingAsset.originalFileName,
        libraryId: existingAsset.libraryId,
        deviceAssetId: existingAsset.deviceAssetId,
        deviceId: existingAsset.deviceId,
        type: existingAsset.type,
        checksum: existingAsset.checksum,
        fileCreatedAt: existingAsset.fileCreatedAt,
        localDateTime: existingAsset.localDateTime,
        fileModifiedAt: existingAsset.fileModifiedAt,
        livePhotoVideoId: existingAsset.livePhotoVideoId || null,
        sidecarPath: existingAsset.sidecarPath || null,
      });
    };

    it('should error when update photo does not exist', async () => {
      const dto = _getUpdateAssetDto();
      assetMock.getById.mockResolvedValueOnce(null);

      await expect(sut.replaceAsset(authStub.user1, 'id', dto, fileStub.photo)).rejects.toThrow(
        'Not found or no asset.update access',
      );

      expect(assetMock.create).not.toHaveBeenCalled();
    });
    it('should update a photo with no sidecar to photo with no sidecar', async () => {
      const existingAsset = _getExistingAsset();
      const updatedFile = fileStub.photo;
      const updatedAsset = { ...existingAsset, ...updatedFile };
      const dto = _getUpdateAssetDto();
      assetMock.getById.mockResolvedValueOnce(existingAsset);
      assetMock.getById.mockResolvedValueOnce(updatedAsset);
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([existingAsset.id]));
      // this is the original file size
      storageMock.stat.mockResolvedValue({ size: 0 } as Stats);
      // this is for the clone call
      assetMock.create.mockResolvedValue(_getCopiedAsset());

      await expect(sut.replaceAsset(authStub.user1, existingAsset.id, dto, updatedFile)).resolves.toEqual({
        status: AssetMediaStatusEnum.REPLACED,
        id: _getCopiedAsset().id,
      });

      expectAssetUpdate(existingAsset, updatedFile, dto);
      expectAssetCreateCopy(existingAsset);

      expect(assetMock.softDeleteAll).toHaveBeenCalledWith([_getCopiedAsset().id]);
      expect(userMock.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, updatedFile.size);
      expect(storageMock.utimes).toHaveBeenCalledWith(
        updatedFile.originalPath,
        expect.any(Date),
        new Date(dto.fileModifiedAt),
      );
    });
    it('should update a photo with sidecar to photo with sidecar', async () => {
      const existingAsset = _getExistingAssetWithSideCar();

      const updatedFile = fileStub.photo;
      const sidecarFile = fileStub.photoSidecar;
      const dto = _getUpdateAssetDto();
      const updatedAsset = { ...existingAsset, ...updatedFile };
      assetMock.getById.mockResolvedValueOnce(existingAsset);
      assetMock.getById.mockResolvedValueOnce(updatedAsset);
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([existingAsset.id]));
      // this is the original file size
      storageMock.stat.mockResolvedValue({ size: 0 } as Stats);
      // this is for the clone call
      assetMock.create.mockResolvedValue(_getCopiedAsset());

      await expect(sut.replaceAsset(authStub.user1, existingAsset.id, dto, updatedFile, sidecarFile)).resolves.toEqual({
        status: AssetMediaStatusEnum.REPLACED,
        id: _getCopiedAsset().id,
      });

      expectAssetUpdate(existingAsset, updatedFile, dto, undefined, sidecarFile);
      expectAssetCreateCopy(existingAsset);
      expect(assetMock.softDeleteAll).toHaveBeenCalledWith([_getCopiedAsset().id]);
      expect(userMock.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, updatedFile.size);
      expect(storageMock.utimes).toHaveBeenCalledWith(
        updatedFile.originalPath,
        expect.any(Date),
        new Date(dto.fileModifiedAt),
      );
    });
    it('should update a photo with a sidecar to photo with no sidecar', async () => {
      const existingAsset = _getExistingAssetWithSideCar();
      const updatedFile = fileStub.photo;

      const dto = _getUpdateAssetDto();
      const updatedAsset = { ...existingAsset, ...updatedFile };
      assetMock.getById.mockResolvedValueOnce(existingAsset);
      assetMock.getById.mockResolvedValueOnce(updatedAsset);
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([existingAsset.id]));
      // this is the original file size
      storageMock.stat.mockResolvedValue({ size: 0 } as Stats);
      // this is for the copy call
      assetMock.create.mockResolvedValue(_getCopiedAsset());

      await expect(sut.replaceAsset(authStub.user1, existingAsset.id, dto, updatedFile)).resolves.toEqual({
        status: AssetMediaStatusEnum.REPLACED,
        id: _getCopiedAsset().id,
      });

      expectAssetUpdate(existingAsset, updatedFile, dto);
      expectAssetCreateCopy(existingAsset);
      expect(assetMock.softDeleteAll).toHaveBeenCalledWith([_getCopiedAsset().id]);
      expect(userMock.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, updatedFile.size);
      expect(storageMock.utimes).toHaveBeenCalledWith(
        updatedFile.originalPath,
        expect.any(Date),
        new Date(dto.fileModifiedAt),
      );
    });
    it('should handle a photo with sidecar to duplicate photo ', async () => {
      const existingAsset = _getExistingAssetWithSideCar();
      const updatedFile = fileStub.photo;
      const dto = _getUpdateAssetDto();
      const error = new QueryFailedError('', [], new Error('unique key violation'));
      (error as any).constraint = ASSET_CHECKSUM_CONSTRAINT;

      assetMock.update.mockRejectedValue(error);
      assetMock.getById.mockResolvedValueOnce(existingAsset);
      assetMock.getUploadAssetIdByChecksum.mockResolvedValue(existingAsset.id);
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([existingAsset.id]));
      // this is the original file size
      storageMock.stat.mockResolvedValue({ size: 0 } as Stats);
      // this is for the clone call
      assetMock.create.mockResolvedValue(_getCopiedAsset());

      await expect(sut.replaceAsset(authStub.user1, existingAsset.id, dto, updatedFile)).resolves.toEqual({
        status: AssetMediaStatusEnum.DUPLICATE,
        id: existingAsset.id,
      });

      expectAssetUpdate(existingAsset, updatedFile, dto);
      expect(assetMock.create).not.toHaveBeenCalled();
      expect(assetMock.softDeleteAll).not.toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: { files: [updatedFile.originalPath, undefined] },
      });
      expect(userMock.updateUsage).not.toHaveBeenCalled();
    });
  });
  describe('bulkUploadCheck', () => {
    it('should accept hex and base64 checksums', async () => {
      const file1 = Buffer.from('d2947b871a706081be194569951b7db246907957', 'hex');
      const file2 = Buffer.from('53be335e99f18a66ff12e9a901c7a6171dd76573', 'hex');

      assetMock.getByChecksums.mockResolvedValue([
        { id: 'asset-1', checksum: file1 } as AssetEntity,
        { id: 'asset-2', checksum: file2 } as AssetEntity,
      ]);

      await expect(
        sut.bulkUploadCheck(authStub.admin, {
          assets: [
            { id: '1', checksum: file1.toString('hex') },
            { id: '2', checksum: file2.toString('base64') },
          ],
        }),
      ).resolves.toEqual({
        results: [
          { id: '1', assetId: 'asset-1', action: AssetUploadAction.REJECT, reason: AssetRejectReason.DUPLICATE },
          { id: '2', assetId: 'asset-2', action: AssetUploadAction.REJECT, reason: AssetRejectReason.DUPLICATE },
        ],
      });

      expect(assetMock.getByChecksums).toHaveBeenCalledWith(authStub.admin.user.id, [file1, file2]);
    });
  });
});

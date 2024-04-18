import { Stats } from 'node:fs';
import { AssetRejectReason, AssetUploadAction } from 'src/dtos/asset-v1-response.dto';
import { CreateAssetDto, UpdateAssetDataDto } from 'src/dtos/asset-v1.dto';

import { ASSET_CHECKSUM_CONSTRAINT, AssetEntity, AssetType } from 'src/entities/asset.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import { IAssetRepositoryV1 } from 'src/interfaces/asset-v1.interface';
import { AssetCreate, IAssetRepository } from 'src/interfaces/asset.interface';
import { IEventRepository } from 'src/interfaces/event.interface';
import { IJobRepository, JobName } from 'src/interfaces/job.interface';
import { ILibraryRepository } from 'src/interfaces/library.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { AssetServiceV1 } from 'src/services/asset-v1.service';
import { UploadFile } from 'src/services/asset.service';
import { mimeTypes } from 'src/utils/mime-types';

import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { fileStub } from 'test/fixtures/file.stub';
import { IAccessRepositoryMock, newAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newAssetRepositoryMock } from 'test/repositories/asset.repository.mock';
import { newEventRepositoryMock } from 'test/repositories/event.repository.mock';
import { newJobRepositoryMock } from 'test/repositories/job.repository.mock';
import { newLibraryRepositoryMock } from 'test/repositories/library.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newStorageRepositoryMock } from 'test/repositories/storage.repository.mock';
import { newUserRepositoryMock } from 'test/repositories/user.repository.mock';
import { QueryFailedError } from 'typeorm';
import { Mocked, vitest } from 'vitest';

const _getCreateAssetDto = (): CreateAssetDto => {
  const createAssetDto = new CreateAssetDto();
  createAssetDto.deviceAssetId = 'deviceAssetId';
  createAssetDto.deviceId = 'deviceId';
  createAssetDto.fileCreatedAt = new Date('2022-06-19T23:41:36.910Z');
  createAssetDto.fileModifiedAt = new Date('2022-06-19T23:41:36.910Z');
  createAssetDto.isFavorite = false;
  createAssetDto.isArchived = false;
  createAssetDto.duration = '0:00:00.000000';
  createAssetDto.libraryId = 'libraryId';

  return createAssetDto;
};

const _getUpdateAssetDto = (): UpdateAssetDataDto => {
  return Object.assign(new UpdateAssetDataDto(), {
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
  return asset_1;
};
const _getExistingAsset = {
  ..._getAsset_1(),
  duration: null,
  type: AssetType.IMAGE,
  checksum: Buffer.from('_getExistingAsset', 'utf8'),
  libraryId: 'libraryId',
};
const _getExistingAssetWithSideCar = {
  ..._getExistingAsset,
  sidecarPath: 'sidecar-path',
  checksum: Buffer.from('_getExistingAssetWithSideCar', 'utf8'),
};
const _getClonedAsset = {
  id: 'cloned-copy',
  originalPath: 'cloned-path',
};
const _getExistingLivePhotoMotionAsset = {
  ...assetStub.livePhotoMotionAsset,
  checksum: Buffer.from('_getExistingLivePhotoMotionAsset', 'utf8'),
  libraryId: 'libraryId',
};
const _getExistingLivePhotoStillAsset = {
  ..._getExistingAsset,
  livePhotoVideoId: _getExistingLivePhotoMotionAsset.id,
};
const _getClonedLivePhotoMotionAsset = {
  id: 'cloned-livephotomotion',
  originalPath: 'cloned-livephotomotion-path',
  checksum: Buffer.from('cloned-livephotomotion', 'utf8'),
};

describe('AssetService', () => {
  let sut: AssetServiceV1;
  let accessMock: IAccessRepositoryMock;
  let assetRepositoryMockV1: Mocked<IAssetRepositoryV1>;
  let assetMock: Mocked<IAssetRepository>;
  let jobMock: Mocked<IJobRepository>;
  let libraryMock: Mocked<ILibraryRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let userMock: Mocked<IUserRepository>;
  let eventMock: Mocked<IEventRepository>;

  beforeEach(() => {
    assetRepositoryMockV1 = {
      get: vitest.fn(),
      getAllByUserId: vitest.fn(),
      getDetectedObjectsByUserId: vitest.fn(),
      getLocationsByUserId: vitest.fn(),
      getSearchPropertiesByUserId: vitest.fn(),
      getAssetsByChecksums: vitest.fn(),
      getExistingAssets: vitest.fn(),
      getByOriginalPath: vitest.fn(),
    };

    accessMock = newAccessRepositoryMock();
    assetMock = newAssetRepositoryMock();
    jobMock = newJobRepositoryMock();
    libraryMock = newLibraryRepositoryMock();
    loggerMock = newLoggerRepositoryMock();
    storageMock = newStorageRepositoryMock();
    userMock = newUserRepositoryMock();
    eventMock = newEventRepositoryMock();

    sut = new AssetServiceV1(
      accessMock,
      assetRepositoryMockV1,
      assetMock,
      jobMock,
      libraryMock,
      storageMock,
      userMock,
      loggerMock,
      eventMock,
    );

    assetRepositoryMockV1.get.mockImplementation((assetId) =>
      Promise.resolve(
        [assetStub.livePhotoMotionAsset, assetStub.livePhotoMotionAsset].find((asset) => asset.id === assetId) ?? null,
      ),
    );
  });

  describe('uploadFile', () => {
    it('should a file upload', async () => {
      const assetEntity = _getAsset_1();

      const file = {
        uuid: 'random-uuid',
        originalPath: 'fake_path/asset_1.jpeg',
        mimeType: 'image/jpeg',
        checksum: Buffer.from('file hash', 'utf8'),
        originalName: 'asset_1.jpeg',
        size: 42,
      };
      const dto = _getCreateAssetDto();

      assetMock.create.mockResolvedValue(assetEntity);
      accessMock.library.checkOwnerAccess.mockResolvedValue(new Set([dto.libraryId!]));

      await expect(sut.uploadFile(authStub.user1, dto, file)).resolves.toEqual({ duplicate: false, id: 'id_1' });

      expect(assetMock.create).toHaveBeenCalled();
      expect(userMock.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, file.size);
      expect(storageMock.utimes).toHaveBeenCalledWith(
        file.originalPath,
        expect.any(Date),
        new Date(dto.fileModifiedAt),
      );
    });

    it('should a duplicate', async () => {
      const file = {
        uuid: 'random-uuid',
        originalPath: 'fake_path/asset_1.jpeg',
        mimeType: 'image/jpeg',
        checksum: Buffer.from('file hash', 'utf8'),
        originalName: 'asset_1.jpeg',
        size: 0,
      };
      const dto = _getCreateAssetDto();
      const error = new QueryFailedError('', [], new Error('unique key violation'));
      (error as any).constraint = ASSET_CHECKSUM_CONSTRAINT;

      assetMock.create.mockRejectedValue(error);
      assetRepositoryMockV1.getAssetsByChecksums.mockResolvedValue([_getAsset_1()]);
      accessMock.library.checkOwnerAccess.mockResolvedValue(new Set([dto.libraryId!]));

      await expect(sut.uploadFile(authStub.user1, dto, file)).resolves.toEqual({ duplicate: true, id: 'id_1' });

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: { files: ['fake_path/asset_1.jpeg', undefined, undefined] },
      });
      expect(userMock.updateUsage).not.toHaveBeenCalled();
    });

    it('should a live photo', async () => {
      const dto = _getCreateAssetDto();

      assetMock.create.mockResolvedValueOnce(assetStub.livePhotoMotionAsset);
      assetMock.create.mockResolvedValueOnce(assetStub.livePhotoStillAsset);
      accessMock.library.checkOwnerAccess.mockResolvedValue(new Set([dto.libraryId!]));

      await expect(
        sut.uploadFile(authStub.user1, dto, fileStub.livePhotoStill, fileStub.livePhotoMotion),
      ).resolves.toEqual({
        duplicate: false,
        id: assetStub.livePhotoStillAsset.id,
      });

      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.METADATA_EXTRACTION,
            data: { id: assetStub.livePhotoMotionAsset.id, source: 'upload' },
          },
        ],
        [{ name: JobName.METADATA_EXTRACTION, data: { id: assetStub.livePhotoStillAsset.id, source: 'upload' } }],
      ]);
      expect(userMock.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, 111);
      expect(storageMock.utimes).toHaveBeenCalledWith(
        fileStub.livePhotoStill.originalPath,
        expect.any(Date),
        new Date(dto.fileModifiedAt),
      );
      expect(storageMock.utimes).toHaveBeenCalledWith(
        fileStub.livePhotoMotion.originalPath,
        expect.any(Date),
        new Date(dto.fileModifiedAt),
      );
    });
  });
  describe('updateFile', () => {
    const expectAssetUpdate = (
      existingAsset: AssetEntity,
      uploadFile: UploadFile,
      dto: UpdateAssetDataDto,
      livePhotoVideo?: AssetEntity,
      sidecarPath?: UploadFile,
      // eslint-disable-next-line unicorn/consistent-function-scoping
    ) => {
      expect(assetMock.update).toHaveBeenCalledWith({
        id: existingAsset.id,
        ownerId: authStub.user1.user.id,
        libraryId: existingAsset.libraryId,
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
    const expectAssetCreateFromClone = (existingAsset: AssetEntity) => {
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

    const expectLivePhotoAssetCreateFromUpload = (
      libraryId: string,
      uploadFile: UploadFile,
      dto: UpdateAssetDataDto,
      livePhotoVideo?: AssetEntity,
      sidecarPath?: UploadFile,
      // eslint-disable-next-line unicorn/consistent-function-scoping
    ) => {
      expect(assetMock.create).toHaveBeenCalledWith({
        ownerId: authStub.user1.user.id,
        libraryId: libraryId,
        checksum: uploadFile.checksum,
        originalPath: uploadFile.originalPath,
        deviceAssetId: dto.deviceAssetId,
        deviceId: dto.deviceId,
        fileCreatedAt: dto.fileCreatedAt,
        fileModifiedAt: dto.fileModifiedAt,
        isArchived: false,
        isFavorite: false,
        isOffline: false,
        isReadOnly: false,
        isVisible: false,
        localDateTime: dto.fileCreatedAt,
        originalFileName: uploadFile.originalName,
        type: mimeTypes.assetType(uploadFile.originalPath),
        duration: dto.duration || null,
        livePhotoVideo: livePhotoVideo ? { id: livePhotoVideo.id } : null,
        sidecarPath: sidecarPath?.originalPath || null,
      });
    };
    it('should error when update photo does not exist', async () => {
      const dto = _getUpdateAssetDto();
      assetRepositoryMockV1.get.mockResolvedValueOnce(null);

      await expect(sut.updateFile(authStub.user1, dto, 'id', fileStub.photo)).rejects.toThrow('Asset does not exist');

      expect(assetMock.create).not.toHaveBeenCalled();
    });
    it('should update a photo (to photo with: no live photo)', async () => {
      const existingAsset = _getExistingAsset;
      const updatedFile = fileStub.photo;
      const dto = _getUpdateAssetDto();
      assetRepositoryMockV1.get.mockResolvedValueOnce(existingAsset);
      accessMock.library.checkOwnerAccess.mockResolvedValue(new Set([existingAsset.libraryId!]));
      // this is the original file size
      storageMock.stat.mockResolvedValue(Promise.resolve({ size: 0 } as Stats));
      // this is for the clone call
      assetMock.create.mockResolvedValue(_getClonedAsset as AssetEntity);

      await expect(sut.updateFile(authStub.user1, dto, existingAsset.id, updatedFile)).resolves.toEqual({
        duplicate: false,
        id: existingAsset.id,
      });

      expectAssetUpdate(existingAsset, updatedFile, dto);
      expectAssetCreateFromClone(existingAsset);

      expect(assetMock.softDeleteAll).toHaveBeenCalledWith([_getClonedAsset.id]);
      expect(userMock.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, updatedFile.size);
      expect(storageMock.utimes).toHaveBeenCalledWith(
        updatedFile.originalPath,
        expect.any(Date),
        new Date(dto.fileModifiedAt),
      );
    });
    it('should update a photo with a sidecar (to photo with: sidecar)', async () => {
      const existingAsset = _getExistingAssetWithSideCar;

      const updatedFile = fileStub.photo;
      const sidecarFile = fileStub.photoSidecar;
      const dto = _getUpdateAssetDto();
      assetRepositoryMockV1.get.mockResolvedValueOnce(existingAsset);
      accessMock.library.checkOwnerAccess.mockResolvedValue(new Set([existingAsset.libraryId!]));
      // this is the original file size
      storageMock.stat.mockResolvedValue(Promise.resolve({ size: 0 } as Stats));
      // this is for the clone call
      assetMock.create.mockImplementationOnce((asset: AssetCreate) =>
        Promise.resolve(Object.assign(new AssetEntity(), asset, { id: 'cloned' })),
      );

      await expect(
        sut.updateFile(authStub.user1, dto, existingAsset.id, updatedFile, undefined, sidecarFile),
      ).resolves.toEqual({
        duplicate: false,
        id: existingAsset.id,
      });

      expectAssetUpdate(existingAsset, updatedFile, dto, undefined, sidecarFile);
      expectAssetCreateFromClone(existingAsset);
      expect(assetMock.softDeleteAll).toHaveBeenCalledWith(['cloned']);
      expect(userMock.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, updatedFile.size);
      expect(storageMock.utimes).toHaveBeenCalledWith(
        updatedFile.originalPath,
        expect.any(Date),
        new Date(dto.fileModifiedAt),
      );
    });
    it('should update a photo with a sidecar (to photo with: no sidecar)', async () => {
      const existingAsset = _getExistingAssetWithSideCar;
      const updatedFile = fileStub.photo;

      const dto = _getUpdateAssetDto();
      assetRepositoryMockV1.get.mockResolvedValueOnce(existingAsset);
      accessMock.library.checkOwnerAccess.mockResolvedValue(new Set([existingAsset.libraryId!]));
      // this is the original file size
      storageMock.stat.mockResolvedValue(Promise.resolve({ size: 0 } as Stats));
      // this is for the clone call
      assetMock.create.mockImplementationOnce((asset: AssetCreate) =>
        Promise.resolve(Object.assign(new AssetEntity(), asset, { id: 'cloned' })),
      );

      await expect(sut.updateFile(authStub.user1, dto, existingAsset.id, updatedFile)).resolves.toEqual({
        duplicate: false,
        id: existingAsset.id,
      });

      expectAssetUpdate(existingAsset, updatedFile, dto);
      expectAssetCreateFromClone(existingAsset);
      expect(assetMock.softDeleteAll).toHaveBeenCalledWith(['cloned']);
      expect(userMock.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, updatedFile.size);
      expect(storageMock.utimes).toHaveBeenCalledWith(
        updatedFile.originalPath,
        expect.any(Date),
        new Date(dto.fileModifiedAt),
      );
    });
    it('should update a photo (to duplicate photo) ', async () => {
      const existingAsset = _getExistingAssetWithSideCar;
      const updatedFile = fileStub.photo;
      const dto = _getUpdateAssetDto();
      const error = new QueryFailedError('', [], new Error('unique key violation'));
      (error as any).constraint = ASSET_CHECKSUM_CONSTRAINT;

      assetMock.update.mockRejectedValue(error);
      assetRepositoryMockV1.get.mockResolvedValueOnce(existingAsset);
      assetRepositoryMockV1.getAssetsByChecksums.mockResolvedValue([existingAsset]);
      accessMock.library.checkOwnerAccess.mockResolvedValue(new Set([existingAsset.libraryId!]));
      // this is the original file size
      storageMock.stat.mockResolvedValue(Promise.resolve({ size: 0 } as Stats));
      // this is for the clone call
      assetMock.create.mockImplementationOnce((asset: AssetCreate) =>
        Promise.resolve(Object.assign(new AssetEntity(), asset, { id: 'cloned' })),
      );

      await expect(sut.updateFile(authStub.user1, dto, existingAsset.id, updatedFile)).resolves.toEqual({
        duplicate: true,
        id: existingAsset.id,
      });

      expectAssetUpdate(existingAsset, updatedFile, dto);
      expect(assetMock.create).not.toHaveBeenCalled();
      expect(assetMock.softDeleteAll).not.toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: { files: [updatedFile.originalPath, undefined, undefined] },
      });
      expect(userMock.updateUsage).not.toHaveBeenCalled();
    });
    it('should update a photo with no live photo (to photo with: live photo)', async () => {
      const existingAsset = _getExistingAsset;
      const dto = _getUpdateAssetDto();
      assetRepositoryMockV1.get.mockResolvedValueOnce(existingAsset);
      // this is the original file size
      storageMock.stat.mockResolvedValue({ size: 0 } as Stats);
      // this is creating the live photo
      assetMock.create.mockResolvedValueOnce(assetStub.livePhotoMotionAsset);
      // this is creating a clone of the existing
      const clonedAsset = _getClonedAsset as AssetEntity;
      assetMock.create.mockResolvedValueOnce(clonedAsset);
      accessMock.library.checkOwnerAccess.mockResolvedValue(new Set([existingAsset.libraryId]));

      await expect(
        sut.updateFile(authStub.user1, dto, existingAsset.id, fileStub.livePhotoStill, fileStub.livePhotoMotion),
      ).resolves.toEqual({
        duplicate: false,
        id: existingAsset.id,
      });
      expectLivePhotoAssetCreateFromUpload(existingAsset.libraryId, fileStub.livePhotoMotion, dto);
      expectAssetUpdate(existingAsset, fileStub.livePhotoStill, dto, assetStub.livePhotoMotionAsset);
      expectAssetCreateFromClone(existingAsset);
      expect(assetMock.softDeleteAll).toHaveBeenCalledWith([_getClonedAsset.id]);
      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.METADATA_EXTRACTION,
            data: { id: assetStub.livePhotoMotionAsset.id, source: 'upload' },
          },
        ],
        [{ name: JobName.METADATA_EXTRACTION, data: { id: existingAsset.id, source: 'upload' } }],
        [{ name: JobName.METADATA_EXTRACTION, data: { id: clonedAsset.id, source: 'clone' } }],
      ]);
      expect(userMock.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, 111);
      expect(storageMock.utimes).toHaveBeenCalledWith(
        fileStub.livePhotoStill.originalPath,
        expect.any(Date),
        new Date(dto.fileModifiedAt),
      );
      expect(storageMock.utimes).toHaveBeenCalledWith(
        fileStub.livePhotoMotion.originalPath,
        expect.any(Date),
        new Date(dto.fileModifiedAt),
      );
    });
    it('should update a photo with live photo (to photo with: live photo)', async () => {
      const existingLivePhotoMotionAsset = _getExistingLivePhotoMotionAsset;
      const existingAsset = _getExistingLivePhotoStillAsset;
      const dto = _getUpdateAssetDto();
      accessMock.library.checkOwnerAccess.mockResolvedValue(new Set([existingAsset.libraryId]));
      // this is the existing asset
      assetRepositoryMockV1.get.mockResolvedValueOnce(existingAsset);
      // this is the existing live photo
      assetRepositoryMockV1.get.mockResolvedValueOnce(existingLivePhotoMotionAsset);
      // this is the original file size
      storageMock.stat.mockResolvedValue({ size: 0 } as Stats);
      const clonedLivePhotoMotionAsset = _getClonedLivePhotoMotionAsset;
      assetMock.create.mockResolvedValueOnce(clonedLivePhotoMotionAsset as AssetEntity);

      // this is creating a clone of the existing
      const clonedAsset = _getClonedAsset;
      assetMock.create.mockResolvedValueOnce(clonedAsset as AssetEntity);

      await expect(
        sut.updateFile(authStub.user1, dto, existingAsset.id, fileStub.livePhotoStill, fileStub.livePhotoMotion),
      ).resolves.toEqual({
        duplicate: false,
        id: existingAsset.id,
      });

      expectAssetUpdate(existingLivePhotoMotionAsset, fileStub.livePhotoMotion, dto);
      expectAssetCreateFromClone(existingLivePhotoMotionAsset);
      expectAssetUpdate(existingAsset, fileStub.livePhotoStill, dto, assetStub.livePhotoMotionAsset);
      expectAssetCreateFromClone({ ...existingAsset, livePhotoVideoId: _getClonedLivePhotoMotionAsset.id });
      expect(assetMock.softDeleteAll).toHaveBeenCalledWith([_getClonedAsset.id]);
      // only soft delete the main asset, not the live photo
      expect(assetMock.softDeleteAll).not.toHaveBeenCalledWith([_getClonedLivePhotoMotionAsset.id]);

      expect(userMock.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, 111);
      expect(storageMock.utimes).toHaveBeenCalledWith(
        fileStub.livePhotoStill.originalPath,
        expect.any(Date),
        new Date(dto.fileModifiedAt),
      );
      expect(storageMock.utimes).toHaveBeenCalledWith(
        fileStub.livePhotoMotion.originalPath,
        expect.any(Date),
        new Date(dto.fileModifiedAt),
      );
    });
  });
  describe('bulkUploadCheck', () => {
    it('should accept hex and base64 checksums', async () => {
      const file1 = Buffer.from('d2947b871a706081be194569951b7db246907957', 'hex');
      const file2 = Buffer.from('53be335e99f18a66ff12e9a901c7a6171dd76573', 'hex');

      assetRepositoryMockV1.getAssetsByChecksums.mockResolvedValue([
        { id: 'asset-1', checksum: file1 },
        { id: 'asset-2', checksum: file2 },
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

      expect(assetRepositoryMockV1.getAssetsByChecksums).toHaveBeenCalledWith(authStub.admin.user.id, [file1, file2]);
    });
  });
});

import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Stats } from 'node:fs';
import { AssetMediaStatus, AssetRejectReason, AssetUploadAction } from 'src/dtos/asset-media-response.dto';
import { AssetMediaCreateDto, AssetMediaReplaceDto, UploadFieldName } from 'src/dtos/asset-media.dto';
import { ASSET_CHECKSUM_CONSTRAINT, AssetEntity, AssetType } from 'src/entities/asset.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IEventRepository } from 'src/interfaces/event.interface';
import { IJobRepository, JobName } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { AssetMediaService, UploadFile } from 'src/services/asset-media.service';
import { CacheControl, ImmichFileResponse } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';
import { assetStub } from 'test/fixtures/asset.stub';
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

const file1 = Buffer.from('d2947b871a706081be194569951b7db246907957', 'hex');

const uploadFile = {
  nullAuth: {
    auth: null,
    fieldName: UploadFieldName.ASSET_DATA,
    file: {
      uuid: 'random-uuid',
      checksum: Buffer.from('checksum', 'utf8'),
      originalPath: 'upload/admin/image.jpeg',
      originalName: 'image.jpeg',
      size: 1000,
    },
  },
  filename: (fieldName: UploadFieldName, filename: string) => {
    return {
      auth: authStub.admin,
      fieldName,
      file: {
        uuid: 'random-uuid',
        mimeType: 'image/jpeg',
        checksum: Buffer.from('checksum', 'utf8'),
        originalPath: `upload/admin/${filename}`,
        originalName: filename,
        size: 1000,
      },
    };
  },
};

const validImages = [
  '.3fr',
  '.ari',
  '.arw',
  '.avif',
  '.cap',
  '.cin',
  '.cr2',
  '.cr3',
  '.crw',
  '.dcr',
  '.dng',
  '.erf',
  '.fff',
  '.gif',
  '.heic',
  '.heif',
  '.iiq',
  '.jpeg',
  '.jpg',
  '.jxl',
  '.k25',
  '.kdc',
  '.mrw',
  '.nef',
  '.orf',
  '.ori',
  '.pef',
  '.png',
  '.psd',
  '.raf',
  '.raw',
  '.rwl',
  '.sr2',
  '.srf',
  '.srw',
  '.svg',
  '.tiff',
  '.webp',
  '.x3f',
];

const validVideos = ['.3gp', '.avi', '.flv', '.m2ts', '.mkv', '.mov', '.mp4', '.mpg', '.mts', '.webm', '.wmv'];

const uploadTests = [
  {
    label: 'asset images',
    fieldName: UploadFieldName.ASSET_DATA,
    valid: validImages,
    invalid: ['.html', '.xml'],
  },
  {
    label: 'asset videos',
    fieldName: UploadFieldName.ASSET_DATA,
    valid: validVideos,
    invalid: ['.html', '.xml'],
  },
  {
    label: 'sidecar',
    fieldName: UploadFieldName.SIDECAR_DATA,
    valid: ['.xmp'],
    invalid: ['.html', '.jpeg', '.jpg', '.mov', '.mp4', '.xml'],
  },
  {
    label: 'profile',
    fieldName: UploadFieldName.PROFILE_DATA,
    valid: ['.avif', '.dng', '.heic', '.heif', '.jpeg', '.jpg', '.png', '.webp'],
    invalid: ['.arf', '.cr2', '.html', '.mov', '.mp4', '.xml'],
  },
];

const _getCreateAssetDto = (): AssetMediaCreateDto => {
  const createAssetDto = new AssetMediaCreateDto();
  createAssetDto.deviceAssetId = 'deviceAssetId';
  createAssetDto.deviceId = 'deviceId';
  createAssetDto.fileCreatedAt = new Date('2022-06-19T23:41:36.910Z');
  createAssetDto.fileModifiedAt = new Date('2022-06-19T23:41:36.910Z');
  createAssetDto.isFavorite = false;
  createAssetDto.isArchived = false;
  createAssetDto.duration = '0:00:00.000000';

  return createAssetDto;
};

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

  describe('getUploadAssetIdByChecksum', () => {
    it('should handle a non-existent asset', async () => {
      await expect(sut.getUploadAssetIdByChecksum(authStub.admin, file1.toString('hex'))).resolves.toBeUndefined();
      expect(assetMock.getUploadAssetIdByChecksum).toHaveBeenCalledWith(authStub.admin.user.id, file1);
    });

    it('should find an existing asset', async () => {
      assetMock.getUploadAssetIdByChecksum.mockResolvedValue('asset-id');
      await expect(sut.getUploadAssetIdByChecksum(authStub.admin, file1.toString('hex'))).resolves.toEqual({
        id: 'asset-id',
        status: AssetMediaStatus.DUPLICATE,
      });
      expect(assetMock.getUploadAssetIdByChecksum).toHaveBeenCalledWith(authStub.admin.user.id, file1);
    });

    it('should find an existing asset by base64', async () => {
      assetMock.getUploadAssetIdByChecksum.mockResolvedValue('asset-id');
      await expect(sut.getUploadAssetIdByChecksum(authStub.admin, file1.toString('base64'))).resolves.toEqual({
        id: 'asset-id',
        status: AssetMediaStatus.DUPLICATE,
      });
      expect(assetMock.getUploadAssetIdByChecksum).toHaveBeenCalledWith(authStub.admin.user.id, file1);
    });
  });

  describe('canUpload', () => {
    it('should require an authenticated user', () => {
      expect(() => sut.canUploadFile(uploadFile.nullAuth)).toThrowError(UnauthorizedException);
    });

    for (const { fieldName, valid, invalid } of uploadTests) {
      describe(fieldName, () => {
        for (const filetype of valid) {
          it(`should accept ${filetype}`, () => {
            expect(sut.canUploadFile(uploadFile.filename(fieldName, `asset${filetype}`))).toEqual(true);
          });
        }

        for (const filetype of invalid) {
          it(`should reject ${filetype}`, () => {
            expect(() => sut.canUploadFile(uploadFile.filename(fieldName, `asset${filetype}`))).toThrowError(
              BadRequestException,
            );
          });
        }

        it('should be sorted (valid)', () => {
          // TODO: use toSorted in NodeJS 20.
          expect(valid).toEqual([...valid].sort());
        });

        it('should be sorted (invalid)', () => {
          // TODO: use toSorted in NodeJS 20.
          expect(invalid).toEqual([...invalid].sort());
        });
      });
    }
  });

  describe('getUploadFilename', () => {
    it('should require authentication', () => {
      expect(() => sut.getUploadFilename(uploadFile.nullAuth)).toThrowError(UnauthorizedException);
    });

    it('should be the original extension for asset upload', () => {
      expect(sut.getUploadFilename(uploadFile.filename(UploadFieldName.ASSET_DATA, 'image.jpg'))).toEqual(
        'random-uuid.jpg',
      );
    });

    it('should be the xmp extension for sidecar upload', () => {
      expect(sut.getUploadFilename(uploadFile.filename(UploadFieldName.SIDECAR_DATA, 'image.html'))).toEqual(
        'random-uuid.xmp',
      );
    });

    it('should be the original extension for profile upload', () => {
      expect(sut.getUploadFilename(uploadFile.filename(UploadFieldName.PROFILE_DATA, 'image.jpg'))).toEqual(
        'random-uuid.jpg',
      );
    });
  });

  describe('getUploadFolder', () => {
    it('should require authentication', () => {
      expect(() => sut.getUploadFolder(uploadFile.nullAuth)).toThrowError(UnauthorizedException);
    });

    it('should return profile for profile uploads', () => {
      expect(sut.getUploadFolder(uploadFile.filename(UploadFieldName.PROFILE_DATA, 'image.jpg'))).toEqual(
        'upload/profile/admin_id',
      );
      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/profile/admin_id');
    });

    it('should return upload for everything else', () => {
      expect(sut.getUploadFolder(uploadFile.filename(UploadFieldName.ASSET_DATA, 'image.jpg'))).toEqual(
        'upload/upload/admin_id/ra/nd',
      );
      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/upload/admin_id/ra/nd');
    });
  });

  describe('uploadFile', () => {
    it('should handle a file upload', async () => {
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

      await expect(sut.uploadFile(authStub.user1, dto, file)).resolves.toEqual({
        id: 'id_1',
        status: AssetMediaStatus.CREATED,
      });

      expect(assetMock.create).toHaveBeenCalled();
      expect(userMock.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, file.size);
      expect(storageMock.utimes).toHaveBeenCalledWith(
        file.originalPath,
        expect.any(Date),
        new Date(dto.fileModifiedAt),
      );
    });

    it('should handle a duplicate', async () => {
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
      assetMock.getUploadAssetIdByChecksum.mockResolvedValue(_getAsset_1().id);

      await expect(sut.uploadFile(authStub.user1, dto, file)).resolves.toEqual({
        id: 'id_1',
        status: AssetMediaStatus.DUPLICATE,
      });

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: { files: ['fake_path/asset_1.jpeg', undefined] },
      });
      expect(userMock.updateUsage).not.toHaveBeenCalled();
    });

    it('should handle a live photo', async () => {
      const dto = _getCreateAssetDto();

      assetMock.getById.mockResolvedValueOnce(assetStub.livePhotoMotionAsset);
      assetMock.create.mockResolvedValueOnce(assetStub.livePhotoStillAsset);

      await expect(sut.uploadFile(authStub.user1, dto, fileStub.livePhotoStill)).resolves.toEqual({
        status: AssetMediaStatus.CREATED,
        id: 'live-photo-still-asset',
      });

      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.METADATA_EXTRACTION, data: { id: assetStub.livePhotoStillAsset.id, source: 'upload' } }],
      ]);
      expect(userMock.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, fileStub.livePhotoStill.size);
      expect(storageMock.utimes).toHaveBeenCalledWith(
        fileStub.livePhotoStill.originalPath,
        expect.any(Date),
        new Date(dto.fileModifiedAt),
      );
    });
  });

  describe('downloadOriginal', () => {
    it('should require the asset.download permission', async () => {
      await expect(sut.downloadOriginal(authStub.admin, 'asset-1')).rejects.toBeInstanceOf(BadRequestException);

      expect(accessMock.asset.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['asset-1']));
      expect(accessMock.asset.checkAlbumAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['asset-1']));
      expect(accessMock.asset.checkPartnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['asset-1']));
    });

    it('should throw an error if the asset is not found', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      assetMock.getById.mockResolvedValue(null);

      await expect(sut.downloadOriginal(authStub.admin, 'asset-1')).rejects.toBeInstanceOf(NotFoundException);

      expect(assetMock.getById).toHaveBeenCalledWith('asset-1');
    });

    it('should download a file', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      assetMock.getById.mockResolvedValue(assetStub.image);

      await expect(sut.downloadOriginal(authStub.admin, 'asset-1')).resolves.toEqual(
        new ImmichFileResponse({
          path: '/original/path.jpg',
          contentType: 'image/jpeg',
          cacheControl: CacheControl.PRIVATE_WITH_CACHE,
        }),
      );
    });
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
        status: AssetMediaStatus.REPLACED,
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
        status: AssetMediaStatus.REPLACED,
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
        status: AssetMediaStatus.REPLACED,
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
        status: AssetMediaStatus.DUPLICATE,
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

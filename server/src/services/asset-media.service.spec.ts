import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Stats } from 'node:fs';
import { AssetMediaStatus, AssetRejectReason, AssetUploadAction } from 'src/dtos/asset-media-response.dto';
import { AssetMediaCreateDto, AssetMediaReplaceDto, AssetMediaSize, UploadFieldName } from 'src/dtos/asset-media.dto';
import { AssetFileEntity } from 'src/entities/asset-files.entity';
import { ASSET_CHECKSUM_CONSTRAINT, AssetEntity } from 'src/entities/asset.entity';
import { AssetFileType, AssetStatus, AssetType, CacheControl } from 'src/enum';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IJobRepository, JobName } from 'src/interfaces/job.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { AssetMediaService } from 'src/services/asset-media.service';
import { ImmichFileResponse } from 'src/utils/file';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { fileStub } from 'test/fixtures/file.stub';
import { userStub } from 'test/fixtures/user.stub';
import { IAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newTestService } from 'test/utils';
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

const createDto = Object.freeze({
  deviceAssetId: 'deviceAssetId',
  deviceId: 'deviceId',
  fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
  fileModifiedAt: new Date('2022-06-19T23:41:36.910Z'),
  isFavorite: false,
  isArchived: false,
  duration: '0:00:00.000000',
}) as AssetMediaCreateDto;

const replaceDto = Object.freeze({
  deviceAssetId: 'deviceAssetId',
  deviceId: 'deviceId',
  fileModifiedAt: new Date('2024-04-15T23:41:36.910Z'),
  fileCreatedAt: new Date('2024-04-15T23:41:36.910Z'),
}) as AssetMediaReplaceDto;

const assetEntity = Object.freeze({
  id: 'id_1',
  ownerId: 'user_id_1',
  deviceAssetId: 'device_asset_id_1',
  deviceId: 'device_id_1',
  type: AssetType.VIDEO,
  originalPath: 'fake_path/asset_1.jpeg',
  fileModifiedAt: new Date('2022-06-19T23:41:36.910Z'),
  fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
  updatedAt: new Date('2022-06-19T23:41:36.910Z'),
  isFavorite: false,
  isArchived: false,
  encodedVideoPath: '',
  duration: '0:00:00.000000',
  files: [] as AssetFileEntity[],
  exifInfo: {
    latitude: 49.533_547,
    longitude: 10.703_075,
  },
  livePhotoVideoId: null,
  sidecarPath: null,
}) as AssetEntity;

const existingAsset = Object.freeze({
  ...assetEntity,
  duration: null,
  type: AssetType.IMAGE,
  checksum: Buffer.from('_getExistingAsset', 'utf8'),
  libraryId: 'libraryId',
  originalFileName: 'existing-filename.jpeg',
}) as AssetEntity;

const sidecarAsset = Object.freeze({
  ...existingAsset,
  sidecarPath: 'sidecar-path',
  checksum: Buffer.from('_getExistingAssetWithSideCar', 'utf8'),
}) as AssetEntity;

const copiedAsset = Object.freeze({
  id: 'copied-asset',
  originalPath: 'copied-path',
}) as AssetEntity;

describe(AssetMediaService.name, () => {
  let sut: AssetMediaService;

  let accessMock: IAccessRepositoryMock;
  let assetMock: Mocked<IAssetRepository>;
  let jobMock: Mocked<IJobRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let userMock: Mocked<IUserRepository>;

  beforeEach(() => {
    ({ sut, accessMock, assetMock, jobMock, storageMock, userMock } = newTestService(AssetMediaService));
  });

  describe('getUploadAssetIdByChecksum', () => {
    it('should return if checksum is undefined', async () => {
      await expect(sut.getUploadAssetIdByChecksum(authStub.admin)).resolves.toBe(undefined);
    });

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
          expect(valid).toEqual(valid.toSorted());
        });

        it('should be sorted (invalid)', () => {
          expect(invalid).toEqual(invalid.toSorted());
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

  describe('uploadAsset', () => {
    it('should throw an error if the quota is exceeded', async () => {
      const file = {
        uuid: 'random-uuid',
        originalPath: 'fake_path/asset_1.jpeg',
        mimeType: 'image/jpeg',
        checksum: Buffer.from('file hash', 'utf8'),
        originalName: 'asset_1.jpeg',
        size: 42,
      };

      assetMock.create.mockResolvedValue(assetEntity);

      await expect(
        sut.uploadAsset(
          { ...authStub.admin, user: { ...authStub.admin.user, quotaSizeInBytes: 42, quotaUsageInBytes: 1 } },
          createDto,
          file,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(assetMock.create).not.toHaveBeenCalled();
      expect(userMock.updateUsage).not.toHaveBeenCalledWith(authStub.user1.user.id, file.size);
      expect(storageMock.utimes).not.toHaveBeenCalledWith(
        file.originalPath,
        expect.any(Date),
        new Date(createDto.fileModifiedAt),
      );
    });

    it('should handle a file upload', async () => {
      const file = {
        uuid: 'random-uuid',
        originalPath: 'fake_path/asset_1.jpeg',
        mimeType: 'image/jpeg',
        checksum: Buffer.from('file hash', 'utf8'),
        originalName: 'asset_1.jpeg',
        size: 42,
      };

      assetMock.create.mockResolvedValue(assetEntity);

      await expect(sut.uploadAsset(authStub.user1, createDto, file)).resolves.toEqual({
        id: 'id_1',
        status: AssetMediaStatus.CREATED,
      });

      expect(assetMock.create).toHaveBeenCalled();
      expect(userMock.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, file.size);
      expect(storageMock.utimes).toHaveBeenCalledWith(
        file.originalPath,
        expect.any(Date),
        new Date(createDto.fileModifiedAt),
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
      const error = new QueryFailedError('', [], new Error('unique key violation'));
      (error as any).constraint = ASSET_CHECKSUM_CONSTRAINT;

      assetMock.create.mockRejectedValue(error);
      assetMock.getUploadAssetIdByChecksum.mockResolvedValue(assetEntity.id);

      await expect(sut.uploadAsset(authStub.user1, createDto, file)).resolves.toEqual({
        id: 'id_1',
        status: AssetMediaStatus.DUPLICATE,
      });

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: { files: ['fake_path/asset_1.jpeg', undefined] },
      });
      expect(userMock.updateUsage).not.toHaveBeenCalled();
    });

    it('should throw an error if the duplicate could not be found by checksum', async () => {
      const file = {
        uuid: 'random-uuid',
        originalPath: 'fake_path/asset_1.jpeg',
        mimeType: 'image/jpeg',
        checksum: Buffer.from('file hash', 'utf8'),
        originalName: 'asset_1.jpeg',
        size: 0,
      };
      const error = new QueryFailedError('', [], new Error('unique key violation'));
      (error as any).constraint = ASSET_CHECKSUM_CONSTRAINT;

      assetMock.create.mockRejectedValue(error);

      await expect(sut.uploadAsset(authStub.user1, createDto, file)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: { files: ['fake_path/asset_1.jpeg', undefined] },
      });
      expect(userMock.updateUsage).not.toHaveBeenCalled();
    });

    it('should handle a live photo', async () => {
      assetMock.getById.mockResolvedValueOnce(assetStub.livePhotoMotionAsset);
      assetMock.create.mockResolvedValueOnce(assetStub.livePhotoStillAsset);

      await expect(
        sut.uploadAsset(
          authStub.user1,
          { ...createDto, livePhotoVideoId: 'live-photo-motion-asset' },
          fileStub.livePhotoStill,
        ),
      ).resolves.toEqual({
        status: AssetMediaStatus.CREATED,
        id: 'live-photo-still-asset',
      });

      expect(assetMock.getById).toHaveBeenCalledWith('live-photo-motion-asset');
      expect(assetMock.update).not.toHaveBeenCalled();
    });

    it('should hide the linked motion asset', async () => {
      assetMock.getById.mockResolvedValueOnce({ ...assetStub.livePhotoMotionAsset, isVisible: true });
      assetMock.create.mockResolvedValueOnce(assetStub.livePhotoStillAsset);

      await expect(
        sut.uploadAsset(
          authStub.user1,
          { ...createDto, livePhotoVideoId: 'live-photo-motion-asset' },
          fileStub.livePhotoStill,
        ),
      ).resolves.toEqual({
        status: AssetMediaStatus.CREATED,
        id: 'live-photo-still-asset',
      });

      expect(assetMock.getById).toHaveBeenCalledWith('live-photo-motion-asset');
      expect(assetMock.update).toHaveBeenCalledWith({ id: 'live-photo-motion-asset', isVisible: false });
    });

    it('should handle a sidecar file', async () => {
      assetMock.getById.mockResolvedValueOnce(assetStub.image);
      assetMock.create.mockResolvedValueOnce(assetStub.image);

      await expect(sut.uploadAsset(authStub.user1, createDto, fileStub.photo, fileStub.photoSidecar)).resolves.toEqual({
        status: AssetMediaStatus.CREATED,
        id: assetStub.image.id,
      });

      expect(storageMock.utimes).toHaveBeenCalledWith(
        fileStub.photoSidecar.originalPath,
        expect.any(Date),
        new Date(createDto.fileModifiedAt),
      );
      expect(assetMock.update).not.toHaveBeenCalled();
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

      expect(assetMock.getById).toHaveBeenCalledWith('asset-1', { files: true });
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

  describe('viewThumbnail', () => {
    it('should require asset.view permissions', async () => {
      await expect(sut.viewThumbnail(authStub.admin, 'id', {})).rejects.toBeInstanceOf(BadRequestException);

      expect(accessMock.asset.checkOwnerAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']));
      expect(accessMock.asset.checkAlbumAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']));
      expect(accessMock.asset.checkPartnerAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']));
    });

    it('should throw an error if the asset does not exist', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      assetMock.getById.mockResolvedValue(null);

      await expect(
        sut.viewThumbnail(authStub.admin, assetStub.image.id, { size: AssetMediaSize.PREVIEW }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw an error if the requested thumbnail file does not exist', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      assetMock.getById.mockResolvedValue({ ...assetStub.image, files: [] });

      await expect(
        sut.viewThumbnail(authStub.admin, assetStub.image.id, { size: AssetMediaSize.THUMBNAIL }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw an error if the requested preview file does not exist', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      assetMock.getById.mockResolvedValue({
        ...assetStub.image,
        files: [
          {
            assetId: assetStub.image.id,
            createdAt: assetStub.image.fileCreatedAt,
            id: '42',
            path: '/path/to/preview',
            type: AssetFileType.THUMBNAIL,
            updatedAt: new Date(),
          },
        ],
      });
      await expect(
        sut.viewThumbnail(authStub.admin, assetStub.image.id, { size: AssetMediaSize.PREVIEW }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should fall back to preview if the requested thumbnail file does not exist', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      assetMock.getById.mockResolvedValue({
        ...assetStub.image,
        files: [
          {
            assetId: assetStub.image.id,
            createdAt: assetStub.image.fileCreatedAt,
            id: '42',
            path: '/path/to/preview.jpg',
            type: AssetFileType.PREVIEW,
            updatedAt: new Date(),
          },
        ],
      });

      await expect(
        sut.viewThumbnail(authStub.admin, assetStub.image.id, { size: AssetMediaSize.THUMBNAIL }),
      ).resolves.toEqual(
        new ImmichFileResponse({
          path: '/path/to/preview.jpg',
          cacheControl: CacheControl.PRIVATE_WITH_CACHE,
          contentType: 'image/jpeg',
        }),
      );
    });

    it('should get preview file', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      assetMock.getById.mockResolvedValue({ ...assetStub.image });
      await expect(
        sut.viewThumbnail(authStub.admin, assetStub.image.id, { size: AssetMediaSize.PREVIEW }),
      ).resolves.toEqual(
        new ImmichFileResponse({
          path: assetStub.image.files[0].path,
          cacheControl: CacheControl.PRIVATE_WITH_CACHE,
          contentType: 'image/jpeg',
        }),
      );
    });

    it('should get thumbnail file', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      assetMock.getById.mockResolvedValue({ ...assetStub.image });
      await expect(
        sut.viewThumbnail(authStub.admin, assetStub.image.id, { size: AssetMediaSize.THUMBNAIL }),
      ).resolves.toEqual(
        new ImmichFileResponse({
          path: assetStub.image.files[1].path,
          cacheControl: CacheControl.PRIVATE_WITH_CACHE,
          contentType: 'application/octet-stream',
        }),
      );
    });
  });

  describe('playbackVideo', () => {
    it('should require asset.view permissions', async () => {
      await expect(sut.playbackVideo(authStub.admin, 'id')).rejects.toBeInstanceOf(BadRequestException);

      expect(accessMock.asset.checkOwnerAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']));
      expect(accessMock.asset.checkAlbumAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']));
      expect(accessMock.asset.checkPartnerAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']));
    });

    it('should throw an error if the asset does not exist', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      assetMock.getById.mockResolvedValue(null);

      await expect(sut.playbackVideo(authStub.admin, assetStub.image.id)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw an error if the asset is not a video', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      assetMock.getById.mockResolvedValue(assetStub.image);

      await expect(sut.playbackVideo(authStub.admin, assetStub.image.id)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return the encoded video path if available', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.hasEncodedVideo.id]));
      assetMock.getById.mockResolvedValue(assetStub.hasEncodedVideo);

      await expect(sut.playbackVideo(authStub.admin, assetStub.hasEncodedVideo.id)).resolves.toEqual(
        new ImmichFileResponse({
          path: assetStub.hasEncodedVideo.encodedVideoPath!,
          cacheControl: CacheControl.PRIVATE_WITH_CACHE,
          contentType: 'video/mp4',
        }),
      );
    });

    it('should fall back to the original path', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.video.id]));
      assetMock.getById.mockResolvedValue(assetStub.video);

      await expect(sut.playbackVideo(authStub.admin, assetStub.video.id)).resolves.toEqual(
        new ImmichFileResponse({
          path: assetStub.video.originalPath,
          cacheControl: CacheControl.PRIVATE_WITH_CACHE,
          contentType: 'application/octet-stream',
        }),
      );
    });
  });

  describe('checkExistingAssets', () => {
    it('should get existing asset ids', async () => {
      assetMock.getByDeviceIds.mockResolvedValue(['42']);
      await expect(
        sut.checkExistingAssets(authStub.admin, { deviceId: '420', deviceAssetIds: ['69'] }),
      ).resolves.toEqual({ existingIds: ['42'] });

      expect(assetMock.getByDeviceIds).toHaveBeenCalledWith(userStub.admin.id, '420', ['69']);
    });
  });

  describe('replaceAsset', () => {
    it('should error when update photo does not exist', async () => {
      assetMock.getById.mockResolvedValueOnce(null);

      await expect(sut.replaceAsset(authStub.user1, 'id', replaceDto, fileStub.photo)).rejects.toThrow(
        'Not found or no asset.update access',
      );

      expect(assetMock.create).not.toHaveBeenCalled();
    });

    it('should update a photo with no sidecar to photo with no sidecar', async () => {
      const updatedFile = fileStub.photo;
      const updatedAsset = { ...existingAsset, ...updatedFile };
      assetMock.getById.mockResolvedValueOnce(existingAsset);
      assetMock.getById.mockResolvedValueOnce(updatedAsset);
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([existingAsset.id]));
      // this is the original file size
      storageMock.stat.mockResolvedValue({ size: 0 } as Stats);
      // this is for the clone call
      assetMock.create.mockResolvedValue(copiedAsset);

      await expect(sut.replaceAsset(authStub.user1, existingAsset.id, replaceDto, updatedFile)).resolves.toEqual({
        status: AssetMediaStatus.REPLACED,
        id: 'copied-asset',
      });

      expect(assetMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: existingAsset.id,
          sidecarPath: null,
          originalFileName: 'photo1.jpeg',
          originalPath: 'fake_path/photo1.jpeg',
        }),
      );
      expect(assetMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sidecarPath: null,
          originalFileName: 'existing-filename.jpeg',
          originalPath: 'fake_path/asset_1.jpeg',
        }),
      );

      expect(assetMock.updateAll).toHaveBeenCalledWith([copiedAsset.id], {
        deletedAt: expect.any(Date),
        status: AssetStatus.TRASHED,
      });
      expect(userMock.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, updatedFile.size);
      expect(storageMock.utimes).toHaveBeenCalledWith(
        updatedFile.originalPath,
        expect.any(Date),
        new Date(replaceDto.fileModifiedAt),
      );
    });

    it('should update a photo with sidecar to photo with sidecar', async () => {
      const updatedFile = fileStub.photo;
      const sidecarFile = fileStub.photoSidecar;
      const updatedAsset = { ...sidecarAsset, ...updatedFile };
      assetMock.getById.mockResolvedValueOnce(existingAsset);
      assetMock.getById.mockResolvedValueOnce(updatedAsset);
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([sidecarAsset.id]));
      // this is the original file size
      storageMock.stat.mockResolvedValue({ size: 0 } as Stats);
      // this is for the clone call
      assetMock.create.mockResolvedValue(copiedAsset);

      await expect(
        sut.replaceAsset(authStub.user1, sidecarAsset.id, replaceDto, updatedFile, sidecarFile),
      ).resolves.toEqual({
        status: AssetMediaStatus.REPLACED,
        id: 'copied-asset',
      });

      expect(assetMock.updateAll).toHaveBeenCalledWith([copiedAsset.id], {
        deletedAt: expect.any(Date),
        status: AssetStatus.TRASHED,
      });
      expect(userMock.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, updatedFile.size);
      expect(storageMock.utimes).toHaveBeenCalledWith(
        updatedFile.originalPath,
        expect.any(Date),
        new Date(replaceDto.fileModifiedAt),
      );
    });

    it('should update a photo with a sidecar to photo with no sidecar', async () => {
      const updatedFile = fileStub.photo;

      const updatedAsset = { ...sidecarAsset, ...updatedFile };
      assetMock.getById.mockResolvedValueOnce(sidecarAsset);
      assetMock.getById.mockResolvedValueOnce(updatedAsset);
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([sidecarAsset.id]));
      // this is the original file size
      storageMock.stat.mockResolvedValue({ size: 0 } as Stats);
      // this is for the copy call
      assetMock.create.mockResolvedValue(copiedAsset);

      await expect(sut.replaceAsset(authStub.user1, existingAsset.id, replaceDto, updatedFile)).resolves.toEqual({
        status: AssetMediaStatus.REPLACED,
        id: 'copied-asset',
      });

      expect(assetMock.updateAll).toHaveBeenCalledWith([copiedAsset.id], {
        deletedAt: expect.any(Date),
        status: AssetStatus.TRASHED,
      });
      expect(userMock.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, updatedFile.size);
      expect(storageMock.utimes).toHaveBeenCalledWith(
        updatedFile.originalPath,
        expect.any(Date),
        new Date(replaceDto.fileModifiedAt),
      );
    });

    it('should handle a photo with sidecar to duplicate photo ', async () => {
      const updatedFile = fileStub.photo;
      const error = new QueryFailedError('', [], new Error('unique key violation'));
      (error as any).constraint = ASSET_CHECKSUM_CONSTRAINT;

      assetMock.update.mockRejectedValue(error);
      assetMock.getById.mockResolvedValueOnce(sidecarAsset);
      assetMock.getUploadAssetIdByChecksum.mockResolvedValue(sidecarAsset.id);
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([sidecarAsset.id]));
      // this is the original file size
      storageMock.stat.mockResolvedValue({ size: 0 } as Stats);
      // this is for the clone call
      assetMock.create.mockResolvedValue(copiedAsset);

      await expect(sut.replaceAsset(authStub.user1, sidecarAsset.id, replaceDto, updatedFile)).resolves.toEqual({
        status: AssetMediaStatus.DUPLICATE,
        id: sidecarAsset.id,
      });

      expect(assetMock.create).not.toHaveBeenCalled();
      expect(assetMock.updateAll).not.toHaveBeenCalled();
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
          {
            id: '1',
            assetId: 'asset-1',
            action: AssetUploadAction.REJECT,
            reason: AssetRejectReason.DUPLICATE,
            isTrashed: false,
          },
          {
            id: '2',
            assetId: 'asset-2',
            action: AssetUploadAction.REJECT,
            reason: AssetRejectReason.DUPLICATE,
            isTrashed: false,
          },
        ],
      });

      expect(assetMock.getByChecksums).toHaveBeenCalledWith(authStub.admin.user.id, [file1, file2]);
    });

    it('should return non-duplicates as well', async () => {
      const file1 = Buffer.from('d2947b871a706081be194569951b7db246907957', 'hex');
      const file2 = Buffer.from('53be335e99f18a66ff12e9a901c7a6171dd76573', 'hex');

      assetMock.getByChecksums.mockResolvedValue([{ id: 'asset-1', checksum: file1 } as AssetEntity]);

      await expect(
        sut.bulkUploadCheck(authStub.admin, {
          assets: [
            { id: '1', checksum: file1.toString('hex') },
            { id: '2', checksum: file2.toString('base64') },
          ],
        }),
      ).resolves.toEqual({
        results: [
          {
            id: '1',
            assetId: 'asset-1',
            action: AssetUploadAction.REJECT,
            reason: AssetRejectReason.DUPLICATE,
            isTrashed: false,
          },
          {
            id: '2',
            action: AssetUploadAction.ACCEPT,
          },
        ],
      });

      expect(assetMock.getByChecksums).toHaveBeenCalledWith(authStub.admin.user.id, [file1, file2]);
    });
  });
});

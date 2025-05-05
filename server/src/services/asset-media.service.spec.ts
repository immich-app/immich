import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Stats } from 'node:fs';
import { AssetFile } from 'src/database';
import { AssetMediaStatus, AssetRejectReason, AssetUploadAction } from 'src/dtos/asset-media-response.dto';
import { AssetMediaCreateDto, AssetMediaReplaceDto, AssetMediaSize, UploadFieldName } from 'src/dtos/asset-media.dto';
import { MapAsset } from 'src/dtos/asset-response.dto';
import { AssetFileType, AssetStatus, AssetType, CacheControl, JobName } from 'src/enum';
import { AuthRequest } from 'src/middleware/auth.guard';
import { AssetMediaService } from 'src/services/asset-media.service';
import { ASSET_CHECKSUM_CONSTRAINT } from 'src/utils/database';
import { ImmichFileResponse } from 'src/utils/file';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { fileStub } from 'test/fixtures/file.stub';
import { userStub } from 'test/fixtures/user.stub';
import { newTestService, ServiceMocks } from 'test/utils';

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
  '.jp2',
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

const validVideos = [
  '.3gp',
  '.avi',
  '.flv',
  '.m2t',
  '.m2ts',
  '.mkv',
  '.mov',
  '.mp4',
  '.mpg',
  '.mts',
  '.vob',
  '.webm',
  '.wmv',
];

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
  files: [] as AssetFile[],
  exifInfo: {
    latitude: 49.533_547,
    longitude: 10.703_075,
  },
  livePhotoVideoId: null,
  sidecarPath: null,
} as MapAsset);

const existingAsset = Object.freeze({
  ...assetEntity,
  duration: null,
  type: AssetType.IMAGE,
  checksum: Buffer.from('_getExistingAsset', 'utf8'),
  libraryId: 'libraryId',
  originalFileName: 'existing-filename.jpeg',
}) as MapAsset;

const sidecarAsset = Object.freeze({
  ...existingAsset,
  sidecarPath: 'sidecar-path',
  checksum: Buffer.from('_getExistingAssetWithSideCar', 'utf8'),
}) as MapAsset;

const copiedAsset = Object.freeze({
  id: 'copied-asset',
  originalPath: 'copied-path',
}) as MapAsset;

describe(AssetMediaService.name, () => {
  let sut: AssetMediaService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AssetMediaService));
  });

  describe('getUploadAssetIdByChecksum', () => {
    it('should return if checksum is undefined', async () => {
      await expect(sut.getUploadAssetIdByChecksum(authStub.admin)).resolves.toBe(undefined);
    });

    it('should handle a non-existent asset', async () => {
      await expect(sut.getUploadAssetIdByChecksum(authStub.admin, file1.toString('hex'))).resolves.toBeUndefined();
      expect(mocks.asset.getUploadAssetIdByChecksum).toHaveBeenCalledWith(authStub.admin.user.id, file1);
    });

    it('should find an existing asset', async () => {
      mocks.asset.getUploadAssetIdByChecksum.mockResolvedValue('asset-id');
      await expect(sut.getUploadAssetIdByChecksum(authStub.admin, file1.toString('hex'))).resolves.toEqual({
        id: 'asset-id',
        status: AssetMediaStatus.DUPLICATE,
      });
      expect(mocks.asset.getUploadAssetIdByChecksum).toHaveBeenCalledWith(authStub.admin.user.id, file1);
    });

    it('should find an existing asset by base64', async () => {
      mocks.asset.getUploadAssetIdByChecksum.mockResolvedValue('asset-id');
      await expect(sut.getUploadAssetIdByChecksum(authStub.admin, file1.toString('base64'))).resolves.toEqual({
        id: 'asset-id',
        status: AssetMediaStatus.DUPLICATE,
      });
      expect(mocks.asset.getUploadAssetIdByChecksum).toHaveBeenCalledWith(authStub.admin.user.id, file1);
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
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith('upload/profile/admin_id');
    });

    it('should return upload for everything else', () => {
      expect(sut.getUploadFolder(uploadFile.filename(UploadFieldName.ASSET_DATA, 'image.jpg'))).toEqual(
        'upload/upload/admin_id/ra/nd',
      );
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith('upload/upload/admin_id/ra/nd');
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

      mocks.asset.create.mockResolvedValue(assetEntity);

      await expect(
        sut.uploadAsset(
          { ...authStub.admin, user: { ...authStub.admin.user, quotaSizeInBytes: 42, quotaUsageInBytes: 1 } },
          createDto,
          file,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.asset.create).not.toHaveBeenCalled();
      expect(mocks.user.updateUsage).not.toHaveBeenCalledWith(authStub.user1.user.id, file.size);
      expect(mocks.storage.utimes).not.toHaveBeenCalledWith(
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

      mocks.asset.create.mockResolvedValue(assetEntity);

      await expect(sut.uploadAsset(authStub.user1, createDto, file)).resolves.toEqual({
        id: 'id_1',
        status: AssetMediaStatus.CREATED,
      });

      expect(mocks.asset.create).toHaveBeenCalled();
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, file.size);
      expect(mocks.storage.utimes).toHaveBeenCalledWith(
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
      const error = new Error('unique key violation');
      (error as any).constraint_name = ASSET_CHECKSUM_CONSTRAINT;

      mocks.asset.create.mockRejectedValue(error);
      mocks.asset.getUploadAssetIdByChecksum.mockResolvedValue(assetEntity.id);

      await expect(sut.uploadAsset(authStub.user1, createDto, file)).resolves.toEqual({
        id: 'id_1',
        status: AssetMediaStatus.DUPLICATE,
      });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: { files: ['fake_path/asset_1.jpeg', undefined] },
      });
      expect(mocks.user.updateUsage).not.toHaveBeenCalled();
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
      const error = new Error('unique key violation');
      (error as any).constraint_name = ASSET_CHECKSUM_CONSTRAINT;

      mocks.asset.create.mockRejectedValue(error);

      await expect(sut.uploadAsset(authStub.user1, createDto, file)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: { files: ['fake_path/asset_1.jpeg', undefined] },
      });
      expect(mocks.user.updateUsage).not.toHaveBeenCalled();
    });

    it('should handle a live photo', async () => {
      mocks.asset.getById.mockResolvedValueOnce(assetStub.livePhotoMotionAsset);
      mocks.asset.create.mockResolvedValueOnce(assetStub.livePhotoStillAsset);

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

      expect(mocks.asset.getById).toHaveBeenCalledWith('live-photo-motion-asset');
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should hide the linked motion asset', async () => {
      mocks.asset.getById.mockResolvedValueOnce({ ...assetStub.livePhotoMotionAsset, isVisible: true });
      mocks.asset.create.mockResolvedValueOnce(assetStub.livePhotoStillAsset);

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

      expect(mocks.asset.getById).toHaveBeenCalledWith('live-photo-motion-asset');
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: 'live-photo-motion-asset', isVisible: false });
    });

    it('should handle a sidecar file', async () => {
      mocks.asset.getById.mockResolvedValueOnce(assetStub.image);
      mocks.asset.create.mockResolvedValueOnce(assetStub.image);

      await expect(sut.uploadAsset(authStub.user1, createDto, fileStub.photo, fileStub.photoSidecar)).resolves.toEqual({
        status: AssetMediaStatus.CREATED,
        id: assetStub.image.id,
      });

      expect(mocks.storage.utimes).toHaveBeenCalledWith(
        fileStub.photoSidecar.originalPath,
        expect.any(Date),
        new Date(createDto.fileModifiedAt),
      );
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });
  });

  describe('downloadOriginal', () => {
    it('should require the asset.download permission', async () => {
      await expect(sut.downloadOriginal(authStub.admin, 'asset-1')).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['asset-1']));
      expect(mocks.access.asset.checkAlbumAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['asset-1']));
      expect(mocks.access.asset.checkPartnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['asset-1']));
    });

    it('should throw an error if the asset is not found', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await expect(sut.downloadOriginal(authStub.admin, 'asset-1')).rejects.toBeInstanceOf(NotFoundException);

      expect(mocks.asset.getById).toHaveBeenCalledWith('asset-1', { files: true });
    });

    it('should download a file', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      mocks.asset.getById.mockResolvedValue(assetStub.image);

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

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']));
      expect(mocks.access.asset.checkAlbumAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']));
      expect(mocks.access.asset.checkPartnerAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']));
    });

    it('should throw an error if the asset does not exist', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));

      await expect(
        sut.viewThumbnail(authStub.admin, assetStub.image.id, { size: AssetMediaSize.PREVIEW }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw an error if the requested thumbnail file does not exist', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      mocks.asset.getById.mockResolvedValue({ ...assetStub.image, files: [] });

      await expect(
        sut.viewThumbnail(authStub.admin, assetStub.image.id, { size: AssetMediaSize.THUMBNAIL }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw an error if the requested preview file does not exist', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      mocks.asset.getById.mockResolvedValue({
        ...assetStub.image,
        files: [
          {
            id: '42',
            path: '/path/to/preview',
            type: AssetFileType.THUMBNAIL,
          },
        ],
      });
      await expect(
        sut.viewThumbnail(authStub.admin, assetStub.image.id, { size: AssetMediaSize.PREVIEW }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should fall back to preview if the requested thumbnail file does not exist', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      mocks.asset.getById.mockResolvedValue({
        ...assetStub.image,
        files: [
          {
            id: '42',
            path: '/path/to/preview.jpg',
            type: AssetFileType.PREVIEW,
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
          fileName: 'asset-id_thumbnail.jpg',
        }),
      );
    });

    it('should get preview file', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      mocks.asset.getById.mockResolvedValue({ ...assetStub.image });
      await expect(
        sut.viewThumbnail(authStub.admin, assetStub.image.id, { size: AssetMediaSize.PREVIEW }),
      ).resolves.toEqual(
        new ImmichFileResponse({
          path: '/uploads/user-id/thumbs/path.jpg',
          cacheControl: CacheControl.PRIVATE_WITH_CACHE,
          contentType: 'image/jpeg',
          fileName: 'asset-id_preview.jpg',
        }),
      );
    });

    it('should get thumbnail file', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      mocks.asset.getById.mockResolvedValue({ ...assetStub.image });
      await expect(
        sut.viewThumbnail(authStub.admin, assetStub.image.id, { size: AssetMediaSize.THUMBNAIL }),
      ).resolves.toEqual(
        new ImmichFileResponse({
          path: '/uploads/user-id/webp/path.ext',
          cacheControl: CacheControl.PRIVATE_WITH_CACHE,
          contentType: 'application/octet-stream',
          fileName: 'asset-id_thumbnail.ext',
        }),
      );
    });
  });

  describe('playbackVideo', () => {
    it('should require asset.view permissions', async () => {
      await expect(sut.playbackVideo(authStub.admin, 'id')).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']));
      expect(mocks.access.asset.checkAlbumAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']));
      expect(mocks.access.asset.checkPartnerAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']));
    });

    it('should throw an error if the asset does not exist', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));

      await expect(sut.playbackVideo(authStub.admin, assetStub.image.id)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw an error if the asset is not a video', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      mocks.asset.getById.mockResolvedValue(assetStub.image);

      await expect(sut.playbackVideo(authStub.admin, assetStub.image.id)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return the encoded video path if available', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.hasEncodedVideo.id]));
      mocks.asset.getById.mockResolvedValue(assetStub.hasEncodedVideo);

      await expect(sut.playbackVideo(authStub.admin, assetStub.hasEncodedVideo.id)).resolves.toEqual(
        new ImmichFileResponse({
          path: assetStub.hasEncodedVideo.encodedVideoPath!,
          cacheControl: CacheControl.PRIVATE_WITH_CACHE,
          contentType: 'video/mp4',
        }),
      );
    });

    it('should fall back to the original path', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.video.id]));
      mocks.asset.getById.mockResolvedValue(assetStub.video);

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
      mocks.asset.getByDeviceIds.mockResolvedValue(['42']);
      await expect(
        sut.checkExistingAssets(authStub.admin, { deviceId: '420', deviceAssetIds: ['69'] }),
      ).resolves.toEqual({ existingIds: ['42'] });

      expect(mocks.asset.getByDeviceIds).toHaveBeenCalledWith(userStub.admin.id, '420', ['69']);
    });
  });

  describe('replaceAsset', () => {
    it('should fail the auth check when update photo does not exist', async () => {
      await expect(sut.replaceAsset(authStub.user1, 'id', replaceDto, fileStub.photo)).rejects.toThrow(
        'Not found or no asset.update access',
      );

      expect(mocks.asset.create).not.toHaveBeenCalled();
    });

    it('should fail if asset cannot be fetched', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([existingAsset.id]));
      await expect(sut.replaceAsset(authStub.user1, existingAsset.id, replaceDto, fileStub.photo)).rejects.toThrow(
        'Asset not found',
      );

      expect(mocks.asset.create).not.toHaveBeenCalled();
    });

    it('should update a photo with no sidecar to photo with no sidecar', async () => {
      const updatedFile = fileStub.photo;
      const updatedAsset = { ...existingAsset, ...updatedFile };
      mocks.asset.getById.mockResolvedValueOnce(existingAsset);
      mocks.asset.getById.mockResolvedValueOnce(updatedAsset);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([existingAsset.id]));
      // this is the original file size
      mocks.storage.stat.mockResolvedValue({ size: 0 } as Stats);
      // this is for the clone call
      mocks.asset.create.mockResolvedValue(copiedAsset);

      await expect(sut.replaceAsset(authStub.user1, existingAsset.id, replaceDto, updatedFile)).resolves.toEqual({
        status: AssetMediaStatus.REPLACED,
        id: 'copied-asset',
      });

      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: existingAsset.id,
          sidecarPath: null,
          originalFileName: 'photo1.jpeg',
          originalPath: 'fake_path/photo1.jpeg',
        }),
      );
      expect(mocks.asset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sidecarPath: null,
          originalFileName: 'existing-filename.jpeg',
          originalPath: 'fake_path/asset_1.jpeg',
        }),
      );

      expect(mocks.asset.updateAll).toHaveBeenCalledWith([copiedAsset.id], {
        deletedAt: expect.any(Date),
        status: AssetStatus.TRASHED,
      });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, updatedFile.size);
      expect(mocks.storage.utimes).toHaveBeenCalledWith(
        updatedFile.originalPath,
        expect.any(Date),
        new Date(replaceDto.fileModifiedAt),
      );
    });

    it('should update a photo with sidecar to photo with sidecar', async () => {
      const updatedFile = fileStub.photo;
      const sidecarFile = fileStub.photoSidecar;
      const updatedAsset = { ...sidecarAsset, ...updatedFile };
      mocks.asset.getById.mockResolvedValueOnce(existingAsset);
      mocks.asset.getById.mockResolvedValueOnce(updatedAsset);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([sidecarAsset.id]));
      // this is the original file size
      mocks.storage.stat.mockResolvedValue({ size: 0 } as Stats);
      // this is for the clone call
      mocks.asset.create.mockResolvedValue(copiedAsset);

      await expect(
        sut.replaceAsset(authStub.user1, sidecarAsset.id, replaceDto, updatedFile, sidecarFile),
      ).resolves.toEqual({
        status: AssetMediaStatus.REPLACED,
        id: 'copied-asset',
      });

      expect(mocks.asset.updateAll).toHaveBeenCalledWith([copiedAsset.id], {
        deletedAt: expect.any(Date),
        status: AssetStatus.TRASHED,
      });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, updatedFile.size);
      expect(mocks.storage.utimes).toHaveBeenCalledWith(
        updatedFile.originalPath,
        expect.any(Date),
        new Date(replaceDto.fileModifiedAt),
      );
    });

    it('should update a photo with a sidecar to photo with no sidecar', async () => {
      const updatedFile = fileStub.photo;

      const updatedAsset = { ...sidecarAsset, ...updatedFile };
      mocks.asset.getById.mockResolvedValueOnce(sidecarAsset);
      mocks.asset.getById.mockResolvedValueOnce(updatedAsset);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([sidecarAsset.id]));
      // this is the original file size
      mocks.storage.stat.mockResolvedValue({ size: 0 } as Stats);
      // this is for the copy call
      mocks.asset.create.mockResolvedValue(copiedAsset);

      await expect(sut.replaceAsset(authStub.user1, existingAsset.id, replaceDto, updatedFile)).resolves.toEqual({
        status: AssetMediaStatus.REPLACED,
        id: 'copied-asset',
      });

      expect(mocks.asset.updateAll).toHaveBeenCalledWith([copiedAsset.id], {
        deletedAt: expect.any(Date),
        status: AssetStatus.TRASHED,
      });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(authStub.user1.user.id, updatedFile.size);
      expect(mocks.storage.utimes).toHaveBeenCalledWith(
        updatedFile.originalPath,
        expect.any(Date),
        new Date(replaceDto.fileModifiedAt),
      );
    });

    it('should handle a photo with sidecar to duplicate photo ', async () => {
      const updatedFile = fileStub.photo;
      const error = new Error('unique key violation');
      (error as any).constraint_name = ASSET_CHECKSUM_CONSTRAINT;

      mocks.asset.update.mockRejectedValue(error);
      mocks.asset.getById.mockResolvedValueOnce(sidecarAsset);
      mocks.asset.getUploadAssetIdByChecksum.mockResolvedValue(sidecarAsset.id);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([sidecarAsset.id]));
      // this is the original file size
      mocks.storage.stat.mockResolvedValue({ size: 0 } as Stats);
      // this is for the clone call
      mocks.asset.create.mockResolvedValue(copiedAsset);

      await expect(sut.replaceAsset(authStub.user1, sidecarAsset.id, replaceDto, updatedFile)).resolves.toEqual({
        status: AssetMediaStatus.DUPLICATE,
        id: sidecarAsset.id,
      });

      expect(mocks.asset.create).not.toHaveBeenCalled();
      expect(mocks.asset.updateAll).not.toHaveBeenCalled();
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: { files: [updatedFile.originalPath, undefined] },
      });
      expect(mocks.user.updateUsage).not.toHaveBeenCalled();
    });
  });

  describe('bulkUploadCheck', () => {
    it('should accept hex and base64 checksums', async () => {
      const file1 = Buffer.from('d2947b871a706081be194569951b7db246907957', 'hex');
      const file2 = Buffer.from('53be335e99f18a66ff12e9a901c7a6171dd76573', 'hex');

      mocks.asset.getByChecksums.mockResolvedValue([
        { id: 'asset-1', checksum: file1, deletedAt: null },
        { id: 'asset-2', checksum: file2, deletedAt: null },
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

      expect(mocks.asset.getByChecksums).toHaveBeenCalledWith(authStub.admin.user.id, [file1, file2]);
    });

    it('should return non-duplicates as well', async () => {
      const file1 = Buffer.from('d2947b871a706081be194569951b7db246907957', 'hex');
      const file2 = Buffer.from('53be335e99f18a66ff12e9a901c7a6171dd76573', 'hex');

      mocks.asset.getByChecksums.mockResolvedValue([{ id: 'asset-1', checksum: file1, deletedAt: null }]);

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

      expect(mocks.asset.getByChecksums).toHaveBeenCalledWith(authStub.admin.user.id, [file1, file2]);
    });
  });

  describe('onUploadError', () => {
    it('should queue a job to delete the uploaded file', async () => {
      const request = { user: authStub.user1 } as AuthRequest;

      const file = {
        fieldname: UploadFieldName.ASSET_DATA,
        originalname: 'image.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from(''),
        size: 1000,
        uuid: 'random-uuid',
        checksum: Buffer.from('checksum', 'utf8'),
        originalPath: 'upload/upload/user-id/ra/nd/random-uuid.jpg',
      } as unknown as Express.Multer.File;

      await sut.onUploadError(request, file);

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: { files: ['upload/upload/user-id/ra/nd/random-uuid.jpg'] },
      });
    });
  });
});

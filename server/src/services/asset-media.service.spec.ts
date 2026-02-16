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
import { AssetEditAction } from 'src/dtos/editing.dto';
import { AssetFileType, AssetStatus, AssetType, AssetVisibility, CacheControl, JobName } from 'src/enum';
import { AuthRequest } from 'src/middleware/auth.guard';
import { AssetMediaService } from 'src/services/asset-media.service';
import { UploadBody } from 'src/types';
import { ASSET_CHECKSUM_CONSTRAINT } from 'src/utils/database';
import { ImmichFileResponse } from 'src/utils/file';
import { AssetFileFactory } from 'test/factories/asset-file.factory';
import { AssetFactory } from 'test/factories/asset.factory';
import { AuthFactory } from 'test/factories/auth.factory';
import { authStub } from 'test/fixtures/auth.stub';
import { fileStub } from 'test/fixtures/file.stub';
import { userStub } from 'test/fixtures/user.stub';
import { newTestService, ServiceMocks } from 'test/utils';

const file1 = Buffer.from('d2947b871a706081be194569951b7db246907957', 'hex');

const uploadFile = {
  nullAuth: {
    auth: null,
    body: {},
    fieldName: UploadFieldName.ASSET_DATA,
    file: {
      uuid: 'random-uuid',
      checksum: Buffer.from('checksum', 'utf8'),
      originalPath: '/data/library/admin/image.jpeg',
      originalName: 'image.jpeg',
      size: 1000,
    },
  },
  filename: (fieldName: UploadFieldName, filename: string, body?: UploadBody) => {
    return {
      auth: authStub.admin,
      body: body || {},
      fieldName,
      file: {
        uuid: 'random-uuid',
        mimeType: 'image/jpeg',
        checksum: Buffer.from('checksum', 'utf8'),
        originalPath: `/data/admin/${filename}`,
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
  type: AssetType.Video,
  originalPath: 'fake_path/asset_1.jpeg',
  fileModifiedAt: new Date('2022-06-19T23:41:36.910Z'),
  fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
  updatedAt: new Date('2022-06-19T23:41:36.910Z'),
  isFavorite: false,
  encodedVideoPath: '',
  duration: '0:00:00.000000',
  files: [] as AssetFile[],
  exifInfo: {
    latitude: 49.533_547,
    longitude: 10.703_075,
  },
  livePhotoVideoId: null,
} as MapAsset);

const existingAsset = Object.freeze({
  ...assetEntity,
  duration: null,
  type: AssetType.Image,
  checksum: Buffer.from('_getExistingAsset', 'utf8'),
  libraryId: 'libraryId',
  originalFileName: 'existing-filename.jpeg',
}) as MapAsset;

const sidecarAsset = Object.freeze({
  ...existingAsset,
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

    it('should prefer filename from body over name from path', () => {
      const pathFilename = 'invalid-file-name';
      const body = { filename: 'video.mov' };
      expect(() => sut.canUploadFile(uploadFile.filename(UploadFieldName.ASSET_DATA, pathFilename))).toThrowError(
        BadRequestException,
      );
      expect(sut.canUploadFile(uploadFile.filename(UploadFieldName.ASSET_DATA, pathFilename, body))).toEqual(true);
    });
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
        expect.stringContaining('/data/profile/admin_id'),
      );
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('/data/profile/admin_id'));
    });

    it('should return upload for everything else', () => {
      expect(sut.getUploadFolder(uploadFile.filename(UploadFieldName.ASSET_DATA, 'image.jpg'))).toEqual(
        expect.stringContaining('/data/upload/admin_id/ra/nd'),
      );
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('/data/upload/admin_id/ra/nd'));
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
        name: JobName.FileDelete,
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
        name: JobName.FileDelete,
        data: { files: ['fake_path/asset_1.jpeg', undefined] },
      });
      expect(mocks.user.updateUsage).not.toHaveBeenCalled();
    });

    it('should handle a live photo', async () => {
      const motionAsset = AssetFactory.from({ type: AssetType.Video, visibility: AssetVisibility.Hidden })
        .owner(authStub.user1.user)
        .build();
      const asset = AssetFactory.create({ livePhotoVideoId: motionAsset.id });
      mocks.asset.getById.mockResolvedValueOnce(motionAsset);
      mocks.asset.create.mockResolvedValueOnce(asset);

      await expect(
        sut.uploadAsset(authStub.user1, { ...createDto, livePhotoVideoId: motionAsset.id }, fileStub.livePhotoStill),
      ).resolves.toEqual({
        status: AssetMediaStatus.CREATED,
        id: asset.id,
      });

      expect(mocks.asset.getById).toHaveBeenCalledWith(motionAsset.id);
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should hide the linked motion asset', async () => {
      const motionAsset = AssetFactory.from({ type: AssetType.Video }).owner(authStub.user1.user).build();
      const asset = AssetFactory.create();
      mocks.asset.getById.mockResolvedValueOnce(motionAsset);
      mocks.asset.create.mockResolvedValueOnce(asset);

      await expect(
        sut.uploadAsset(authStub.user1, { ...createDto, livePhotoVideoId: motionAsset.id }, fileStub.livePhotoStill),
      ).resolves.toEqual({
        status: AssetMediaStatus.CREATED,
        id: asset.id,
      });

      expect(mocks.asset.getById).toHaveBeenCalledWith(motionAsset.id);
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: motionAsset.id,
        visibility: AssetVisibility.Hidden,
      });
    });

    it('should handle a sidecar file', async () => {
      const asset = AssetFactory.from().file({ type: AssetFileType.Sidecar }).build();
      mocks.asset.getById.mockResolvedValueOnce(asset);
      mocks.asset.create.mockResolvedValueOnce(asset);

      await expect(sut.uploadAsset(authStub.user1, createDto, fileStub.photo, fileStub.photoSidecar)).resolves.toEqual({
        status: AssetMediaStatus.CREATED,
        id: asset.id,
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
      await expect(sut.downloadOriginal(authStub.admin, 'asset-1', {})).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set(['asset-1']),
        undefined,
      );
      expect(mocks.access.asset.checkAlbumAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['asset-1']));
      expect(mocks.access.asset.checkPartnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['asset-1']));
    });

    it('should download a file', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getForOriginal.mockResolvedValue(asset);

      await expect(sut.downloadOriginal(authStub.admin, asset.id, {})).resolves.toEqual(
        new ImmichFileResponse({
          path: asset.originalPath,
          fileName: asset.originalFileName,
          contentType: 'image/jpeg',
          cacheControl: CacheControl.PrivateWithCache,
        }),
      );
    });

    it('should download edited file by default when edits exist', async () => {
      const editedAsset = AssetFactory.from()
        .edit()
        .files([AssetFileType.FullSize, AssetFileType.Preview, AssetFileType.Thumbnail])
        .file({ type: AssetFileType.FullSize, isEdited: true })
        .build();

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([editedAsset.id]));
      mocks.asset.getForOriginal.mockResolvedValue({ ...editedAsset, editedPath: editedAsset.files[3].path });

      await expect(sut.downloadOriginal(AuthFactory.create(), editedAsset.id, {})).resolves.toEqual(
        new ImmichFileResponse({
          path: editedAsset.files[3].path,
          fileName: editedAsset.originalFileName,
          contentType: 'image/jpeg',
          cacheControl: CacheControl.PrivateWithCache,
        }),
      );
    });

    it('should download edited file when edited=true', async () => {
      const editedAsset = AssetFactory.from()
        .edit()
        .files([AssetFileType.FullSize, AssetFileType.Preview, AssetFileType.Thumbnail])
        .file({ type: AssetFileType.FullSize, isEdited: true })
        .build();

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([editedAsset.id]));
      mocks.asset.getForOriginal.mockResolvedValue({ ...editedAsset, editedPath: editedAsset.files[3].path });

      await expect(sut.downloadOriginal(AuthFactory.create(), editedAsset.id, { edited: true })).resolves.toEqual(
        new ImmichFileResponse({
          path: editedAsset.files[3].path,
          fileName: editedAsset.originalFileName,
          contentType: 'image/jpeg',
          cacheControl: CacheControl.PrivateWithCache,
        }),
      );
    });

    it('should not return the unedited version if requested using a shared link', async () => {
      const fullsizeEdited = AssetFileFactory.create({ type: AssetFileType.FullSize, isEdited: true });
      const editedAsset = AssetFactory.from().edit({ action: AssetEditAction.Crop }).file(fullsizeEdited).build();

      mocks.access.asset.checkSharedLinkAccess.mockResolvedValue(new Set([editedAsset.id]));
      mocks.asset.getForOriginal.mockResolvedValue({ ...editedAsset, editedPath: fullsizeEdited.path });

      await expect(
        sut.downloadOriginal(AuthFactory.from().sharedLink().build(), editedAsset.id, { edited: false }),
      ).resolves.toEqual(
        new ImmichFileResponse({
          path: fullsizeEdited.path,
          fileName: editedAsset.originalFileName,
          contentType: 'image/jpeg',
          cacheControl: CacheControl.PrivateWithCache,
        }),
      );
    });

    it('should download original file when edited=false', async () => {
      const editedAsset = AssetFactory.from()
        .edit()
        .files([AssetFileType.FullSize, AssetFileType.Preview, AssetFileType.Thumbnail])
        .file({ type: AssetFileType.FullSize, isEdited: true })
        .build();

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([editedAsset.id]));
      mocks.asset.getForOriginal.mockResolvedValue(editedAsset);

      await expect(sut.downloadOriginal(AuthFactory.create(), editedAsset.id, { edited: false })).resolves.toEqual(
        new ImmichFileResponse({
          path: editedAsset.originalPath,
          fileName: editedAsset.originalFileName,
          contentType: 'image/jpeg',
          cacheControl: CacheControl.PrivateWithCache,
        }),
      );
    });
  });

  describe('viewThumbnail', () => {
    it('should require asset.view permissions', async () => {
      await expect(sut.viewThumbnail(authStub.admin, 'id', {})).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']), undefined);
      expect(mocks.access.asset.checkAlbumAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']));
      expect(mocks.access.asset.checkPartnerAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']));
    });

    it('should fall back to preview if the requested thumbnail file does not exist', async () => {
      const asset = AssetFactory.from().file({ type: AssetFileType.Preview }).build();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getForThumbnail.mockResolvedValue({ ...asset, path: asset.files[0].path });

      await expect(sut.viewThumbnail(authStub.admin, asset.id, { size: AssetMediaSize.THUMBNAIL })).resolves.toEqual(
        new ImmichFileResponse({
          path: asset.files[0].path,
          cacheControl: CacheControl.PrivateWithCache,
          contentType: 'image/jpeg',
          fileName: `IMG_${asset.id}_thumbnail.jpg`,
        }),
      );
    });

    it('should get preview file', async () => {
      const asset = AssetFactory.from().file({ type: AssetFileType.Preview }).build();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getForThumbnail.mockResolvedValue({ ...asset, path: asset.files[0].path });
      await expect(sut.viewThumbnail(authStub.admin, asset.id, { size: AssetMediaSize.PREVIEW })).resolves.toEqual(
        new ImmichFileResponse({
          path: asset.files[0].path,
          cacheControl: CacheControl.PrivateWithCache,
          contentType: 'image/jpeg',
          fileName: `IMG_${asset.id}_preview.jpg`,
        }),
      );
    });

    it('should get thumbnail file', async () => {
      const asset = AssetFactory.from()
        .file({ type: AssetFileType.Thumbnail, path: '/uploads/user-id/webp/path.ext' })
        .build();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getForThumbnail.mockResolvedValue({ ...asset, path: asset.files[0].path });
      await expect(sut.viewThumbnail(authStub.admin, asset.id, { size: AssetMediaSize.THUMBNAIL })).resolves.toEqual(
        new ImmichFileResponse({
          path: asset.files[0].path,
          cacheControl: CacheControl.PrivateWithCache,
          contentType: 'application/octet-stream',
          fileName: `IMG_${asset.id}_thumbnail.ext`,
        }),
      );
      expect(mocks.asset.getForThumbnail).toHaveBeenCalledWith(asset.id, AssetFileType.Thumbnail, false);
    });

    it('should get original thumbnail by default', async () => {
      const asset = AssetFactory.from().file({ type: AssetFileType.Thumbnail }).build();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getForThumbnail.mockResolvedValue({ ...asset, path: asset.files[0].path });
      await expect(sut.viewThumbnail(authStub.admin, asset.id, { size: AssetMediaSize.THUMBNAIL })).resolves.toEqual(
        new ImmichFileResponse({
          path: asset.files[0].path,
          cacheControl: CacheControl.PrivateWithCache,
          contentType: 'image/jpeg',
          fileName: `IMG_${asset.id}_thumbnail.jpg`,
        }),
      );
      expect(mocks.asset.getForThumbnail).toHaveBeenCalledWith(asset.id, AssetFileType.Thumbnail, false);
    });

    it('should get edited thumbnail when edited=true', async () => {
      const asset = AssetFactory.from().file({ type: AssetFileType.Thumbnail, isEdited: true }).build();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getForThumbnail.mockResolvedValue({ ...asset, path: asset.files[0].path });
      await expect(
        sut.viewThumbnail(authStub.admin, asset.id, { size: AssetMediaSize.THUMBNAIL, edited: true }),
      ).resolves.toEqual(
        new ImmichFileResponse({
          path: asset.files[0].path,
          cacheControl: CacheControl.PrivateWithCache,
          contentType: 'image/jpeg',
          fileName: `IMG_${asset.id}_thumbnail.jpg`,
        }),
      );
      expect(mocks.asset.getForThumbnail).toHaveBeenCalledWith(asset.id, AssetFileType.Thumbnail, true);
    });

    it('should get original thumbnail when edited=false', async () => {
      const asset = AssetFactory.from().file({ type: AssetFileType.Thumbnail }).build();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getForThumbnail.mockResolvedValue({ ...asset, path: asset.files[0].path });
      await expect(
        sut.viewThumbnail(authStub.admin, asset.id, { size: AssetMediaSize.THUMBNAIL, edited: false }),
      ).resolves.toEqual(
        new ImmichFileResponse({
          path: asset.files[0].path,
          cacheControl: CacheControl.PrivateWithCache,
          contentType: 'image/jpeg',
          fileName: `IMG_${asset.id}_thumbnail.jpg`,
        }),
      );
      expect(mocks.asset.getForThumbnail).toHaveBeenCalledWith(asset.id, AssetFileType.Thumbnail, false);
    });

    it('should not return the unedited version if requested using a shared link', async () => {
      const asset = AssetFactory.from().file({ type: AssetFileType.Thumbnail }).build();
      mocks.access.asset.checkSharedLinkAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getForThumbnail.mockResolvedValue({ ...asset, path: asset.files[0].path });
      await expect(
        sut.viewThumbnail(authStub.adminSharedLink, asset.id, {
          size: AssetMediaSize.THUMBNAIL,
          edited: true,
        }),
      ).resolves.toEqual(
        new ImmichFileResponse({
          path: asset.files[0].path,
          cacheControl: CacheControl.PrivateWithCache,
          contentType: 'image/jpeg',
          fileName: `IMG_${asset.id}_thumbnail.jpg`,
        }),
      );
      expect(mocks.asset.getForThumbnail).toHaveBeenCalledWith(asset.id, AssetFileType.Thumbnail, true);
    });
  });

  describe('playbackVideo', () => {
    it('should require asset.view permissions', async () => {
      await expect(sut.playbackVideo(authStub.admin, 'id')).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']), undefined);
      expect(mocks.access.asset.checkAlbumAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']));
      expect(mocks.access.asset.checkPartnerAccess).toHaveBeenCalledWith(userStub.admin.id, new Set(['id']));
    });

    it('should throw an error if the video asset could not be found', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));

      await expect(sut.playbackVideo(authStub.admin, asset.id)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should return the encoded video path if available', async () => {
      const asset = AssetFactory.create({ encodedVideoPath: '/path/to/encoded/video.mp4' });
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getForVideo.mockResolvedValue(asset);

      await expect(sut.playbackVideo(authStub.admin, asset.id)).resolves.toEqual(
        new ImmichFileResponse({
          path: asset.encodedVideoPath!,
          cacheControl: CacheControl.PrivateWithCache,
          contentType: 'video/mp4',
        }),
      );
    });

    it('should fall back to the original path', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video, originalPath: '/original/path.ext' });
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.asset.getForVideo.mockResolvedValue(asset);

      await expect(sut.playbackVideo(authStub.admin, asset.id)).resolves.toEqual(
        new ImmichFileResponse({
          path: asset.originalPath,
          cacheControl: CacheControl.PrivateWithCache,
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
          originalFileName: 'photo1.jpeg',
          originalPath: 'fake_path/photo1.jpeg',
        }),
      );
      expect(mocks.asset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalFileName: 'existing-filename.jpeg',
          originalPath: 'fake_path/asset_1.jpeg',
        }),
      );
      expect(mocks.asset.deleteFile).toHaveBeenCalledWith(
        expect.objectContaining({
          assetId: existingAsset.id,
          type: AssetFileType.Sidecar,
        }),
      );

      expect(mocks.asset.updateAll).toHaveBeenCalledWith([copiedAsset.id], {
        deletedAt: expect.any(Date),
        status: AssetStatus.Trashed,
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
        status: AssetStatus.Trashed,
      });
      expect(mocks.asset.upsertFile).toHaveBeenCalledWith(
        expect.objectContaining({
          assetId: existingAsset.id,
          path: sidecarFile.originalPath,
          type: AssetFileType.Sidecar,
        }),
      );
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
        status: AssetStatus.Trashed,
      });
      expect(mocks.asset.deleteFile).toHaveBeenCalledWith(
        expect.objectContaining({
          assetId: existingAsset.id,
          type: AssetFileType.Sidecar,
        }),
      );
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
      expect(mocks.asset.upsertFile).not.toHaveBeenCalled();
      expect(mocks.asset.deleteFile).not.toHaveBeenCalled();

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FileDelete,
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
      const request = {
        body: {},
        user: authStub.user1,
      } as AuthRequest;

      const file = {
        fieldname: UploadFieldName.ASSET_DATA,
        originalname: 'image.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from(''),
        size: 1000,
        uuid: 'random-uuid',
        checksum: Buffer.from('checksum', 'utf8'),
        originalPath: '/data/upload/user-id/ra/nd/random-uuid.jpg',
      } as unknown as Express.Multer.File;

      await sut.onUploadError(request, file);

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FileDelete,
        data: { files: [expect.stringContaining('/data/upload/user-id/ra/nd/random-uuid.jpg')] },
      });
    });
  });
});

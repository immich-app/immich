import {
  ICryptoRepository,
  IJobRepository,
  IStorageRepository,
  JobName,
  mimeTypes,
  UploadFieldName,
} from '@app/domain';
import { AssetEntity, AssetType, ExifEntity } from '@app/infra/entities';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import {
  assetEntityStub,
  authStub,
  fileStub,
  IAccessRepositoryMock,
  newAccessRepositoryMock,
  newCryptoRepositoryMock,
  newJobRepositoryMock,
  newStorageRepositoryMock,
} from '@test';
import { when } from 'jest-when';
import { QueryFailedError, Repository } from 'typeorm';
import { IAssetRepository } from './asset-repository';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { TimeGroupEnum } from './dto/get-asset-count-by-time-bucket.dto';
import { AssetRejectReason, AssetUploadAction } from './response-dto/asset-check-response.dto';
import { AssetCountByTimeBucket } from './response-dto/asset-count-by-time-group-response.dto';

const _getCreateAssetDto = (): CreateAssetDto => {
  const createAssetDto = new CreateAssetDto();
  createAssetDto.deviceAssetId = 'deviceAssetId';
  createAssetDto.deviceId = 'deviceId';
  createAssetDto.fileCreatedAt = new Date('2022-06-19T23:41:36.910Z');
  createAssetDto.fileModifiedAt = new Date('2022-06-19T23:41:36.910Z');
  createAssetDto.isFavorite = false;
  createAssetDto.isArchived = false;
  createAssetDto.duration = '0:00:00.000000';

  return createAssetDto;
};

const _getAsset_1 = () => {
  const asset_1 = new AssetEntity();

  asset_1.id = 'id_1';
  asset_1.ownerId = 'user_id_1';
  asset_1.deviceAssetId = 'device_asset_id_1';
  asset_1.deviceId = 'device_id_1';
  asset_1.type = AssetType.VIDEO;
  asset_1.originalPath = 'fake_path/asset_1.jpeg';
  asset_1.resizePath = '';
  asset_1.fileModifiedAt = new Date('2022-06-19T23:41:36.910Z');
  asset_1.fileCreatedAt = new Date('2022-06-19T23:41:36.910Z');
  asset_1.updatedAt = new Date('2022-06-19T23:41:36.910Z');
  asset_1.isFavorite = false;
  asset_1.isArchived = false;
  asset_1.webpPath = '';
  asset_1.encodedVideoPath = '';
  asset_1.duration = '0:00:00.000000';
  asset_1.exifInfo = new ExifEntity();
  asset_1.exifInfo.latitude = 49.533547;
  asset_1.exifInfo.longitude = 10.703075;
  return asset_1;
};

const _getAsset_2 = () => {
  const asset_2 = new AssetEntity();

  asset_2.id = 'id_2';
  asset_2.ownerId = 'user_id_1';
  asset_2.deviceAssetId = 'device_asset_id_2';
  asset_2.deviceId = 'device_id_1';
  asset_2.type = AssetType.VIDEO;
  asset_2.originalPath = 'fake_path/asset_2.jpeg';
  asset_2.resizePath = '';
  asset_2.fileModifiedAt = new Date('2022-06-19T23:41:36.910Z');
  asset_2.fileCreatedAt = new Date('2022-06-19T23:41:36.910Z');
  asset_2.updatedAt = new Date('2022-06-19T23:41:36.910Z');
  asset_2.isFavorite = false;
  asset_2.isArchived = false;
  asset_2.webpPath = '';
  asset_2.encodedVideoPath = '';
  asset_2.duration = '0:00:00.000000';

  return asset_2;
};

const _getAssets = () => {
  return [_getAsset_1(), _getAsset_2()];
};

const _getAssetCountByTimeBucket = (): AssetCountByTimeBucket[] => {
  const result1 = new AssetCountByTimeBucket();
  result1.count = 2;
  result1.timeBucket = '2022-06-01T00:00:00.000Z';

  const result2 = new AssetCountByTimeBucket();
  result1.count = 5;
  result1.timeBucket = '2022-07-01T00:00:00.000Z';

  return [result1, result2];
};

const uploadFile = {
  nullAuth: {
    authUser: null,
    fieldName: UploadFieldName.ASSET_DATA,
    file: {
      checksum: Buffer.from('checksum', 'utf8'),
      originalPath: 'upload/admin/image.jpeg',
      originalName: 'image.jpeg',
    },
  },
  filename: (fieldName: UploadFieldName, filename: string) => {
    return {
      authUser: authStub.admin,
      fieldName,
      file: {
        mimeType: 'image/jpeg',
        checksum: Buffer.from('checksum', 'utf8'),
        originalPath: `upload/admin/${filename}`,
        originalName: filename,
      },
    };
  },
};

const uploadTests = [
  {
    label: 'asset',
    fieldName: UploadFieldName.ASSET_DATA,
    filetypes: Object.keys({ ...mimeTypes.image, ...mimeTypes.video }),
    invalid: ['.xml', '.html'],
  },
  {
    label: 'live photo',
    fieldName: UploadFieldName.LIVE_PHOTO_DATA,
    filetypes: Object.keys(mimeTypes.video),
    invalid: ['.xml', '.html', '.jpg', '.jpeg'],
  },
  {
    label: 'sidecar',
    fieldName: UploadFieldName.SIDECAR_DATA,
    filetypes: Object.keys(mimeTypes.sidecar),
    invalid: ['.xml', '.html', '.jpg', '.jpeg', '.mov', '.mp4'],
  },
  {
    label: 'profile',
    fieldName: UploadFieldName.PROFILE_DATA,
    filetypes: Object.keys(mimeTypes.profile),
    invalid: ['.xml', '.html', '.cr2', '.arf', '.mov', '.mp4'],
  },
];

describe('AssetService', () => {
  let sut: AssetService;
  let a: Repository<AssetEntity>; // TO BE DELETED AFTER FINISHED REFACTORING
  let accessMock: IAccessRepositoryMock;
  let assetRepositoryMock: jest.Mocked<IAssetRepository>;
  let cryptoMock: jest.Mocked<ICryptoRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;

  beforeEach(() => {
    assetRepositoryMock = {
      get: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),

      update: jest.fn(),
      getAllByUserId: jest.fn(),
      getAllByDeviceId: jest.fn(),
      getAssetCountByTimeBucket: jest.fn(),
      getById: jest.fn(),
      getDetectedObjectsByUserId: jest.fn(),
      getLocationsByUserId: jest.fn(),
      getSearchPropertiesByUserId: jest.fn(),
      getAssetByTimeBucket: jest.fn(),
      getAssetsByChecksums: jest.fn(),
      getExistingAssets: jest.fn(),
      getByOriginalPath: jest.fn(),
    };

    accessMock = newAccessRepositoryMock();
    cryptoMock = newCryptoRepositoryMock();
    jobMock = newJobRepositoryMock();
    storageMock = newStorageRepositoryMock();

    sut = new AssetService(accessMock, assetRepositoryMock, a, cryptoMock, jobMock, storageMock);

    when(assetRepositoryMock.get)
      .calledWith(assetEntityStub.livePhotoStillAsset.id)
      .mockResolvedValue(assetEntityStub.livePhotoStillAsset);
    when(assetRepositoryMock.get)
      .calledWith(assetEntityStub.livePhotoMotionAsset.id)
      .mockResolvedValue(assetEntityStub.livePhotoMotionAsset);
  });

  describe('mime types linting', () => {
    describe('profile', () => {
      it('should contain only lowercase mime types', () => {
        const keys = Object.keys(mimeTypes.profile);
        expect(keys).toEqual(keys.map((mimeType) => mimeType.toLowerCase()));
        const values = Object.values(mimeTypes.profile);
        expect(values).toEqual(values.map((mimeType) => mimeType.toLowerCase()));
      });

      it('should be a sorted list', () => {
        const keys = Object.keys(mimeTypes.profile);
        expect(keys).toEqual([...keys].sort());
      });
    });

    describe('image', () => {
      it('should contain only lowercase mime types', () => {
        const keys = Object.keys(mimeTypes.image);
        expect(keys).toEqual(keys.map((mimeType) => mimeType.toLowerCase()));
        const values = Object.values(mimeTypes.image);
        expect(values).toEqual(values.map((mimeType) => mimeType.toLowerCase()));
      });

      it('should be a sorted list', () => {
        const keys = Object.keys(mimeTypes.image).filter((key) => key in mimeTypes.profile === false);
        expect(keys).toEqual([...keys].sort());
      });

      it('should contain only image mime types', () => {
        expect(Object.values(mimeTypes.image)).toEqual(
          Object.values(mimeTypes.image).filter((mimeType) => mimeType.startsWith('image/')),
        );
      });
    });

    describe('video', () => {
      it('should contain only lowercase mime types', () => {
        const keys = Object.keys(mimeTypes.video);
        expect(keys).toEqual(keys.map((mimeType) => mimeType.toLowerCase()));
        const values = Object.values(mimeTypes.video);
        expect(values).toEqual(values.map((mimeType) => mimeType.toLowerCase()));
      });

      it('should be a sorted list', () => {
        const keys = Object.keys(mimeTypes.video);
        expect(keys).toEqual([...keys].sort());
      });

      it('should contain only video mime types', () => {
        expect(Object.values(mimeTypes.video)).toEqual(
          Object.values(mimeTypes.video).filter((mimeType) => mimeType.startsWith('video/')),
        );
      });
    });

    describe('sidecar', () => {
      it('should contain only lowercase mime types', () => {
        const keys = Object.keys(mimeTypes.sidecar);
        expect(keys).toEqual(keys.map((mimeType) => mimeType.toLowerCase()));
        const values = Object.values(mimeTypes.sidecar);
        expect(values).toEqual(values.map((mimeType) => mimeType.toLowerCase()));
      });

      it('should be a sorted list', () => {
        const keys = Object.keys(mimeTypes.sidecar);
        expect(keys).toEqual([...keys].sort());
      });
    });

    describe('sidecar', () => {
      it('should contain only be xml mime type', () => {
        expect(Object.values(mimeTypes.sidecar)).toEqual(
          Object.values(mimeTypes.sidecar).filter((mimeType) => mimeType === 'application/xml'),
        );
      });
    });
  });

  describe('canUpload', () => {
    it('should require an authenticated user', () => {
      expect(() => sut.canUploadFile(uploadFile.nullAuth)).toThrowError(UnauthorizedException);
    });

    for (const { fieldName, filetypes, invalid } of uploadTests) {
      describe(`${fieldName}`, () => {
        for (const filetype of filetypes) {
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

    it('should be the mov extension for live photo upload', () => {
      expect(sut.getUploadFilename(uploadFile.filename(UploadFieldName.LIVE_PHOTO_DATA, 'image.mp4'))).toEqual(
        'random-uuid.mov',
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
        'upload/upload/admin_id',
      );
      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/upload/admin_id');
    });
  });

  describe('uploadFile', () => {
    it('should handle a file upload', async () => {
      const assetEntity = _getAsset_1();
      const file = {
        originalPath: 'fake_path/asset_1.jpeg',
        mimeType: 'image/jpeg',
        checksum: Buffer.from('file hash', 'utf8'),
        originalName: 'asset_1.jpeg',
      };
      const dto = _getCreateAssetDto();

      assetRepositoryMock.create.mockResolvedValue(assetEntity);

      await expect(sut.uploadFile(authStub.user1, dto, file)).resolves.toEqual({ duplicate: false, id: 'id_1' });

      expect(assetRepositoryMock.create).toHaveBeenCalled();
    });

    it('should handle a duplicate', async () => {
      const file = {
        originalPath: 'fake_path/asset_1.jpeg',
        mimeType: 'image/jpeg',
        checksum: Buffer.from('file hash', 'utf8'),
        originalName: 'asset_1.jpeg',
      };
      const dto = _getCreateAssetDto();
      const error = new QueryFailedError('', [], '');
      (error as any).constraint = 'UQ_userid_checksum';

      assetRepositoryMock.create.mockRejectedValue(error);
      assetRepositoryMock.getAssetsByChecksums.mockResolvedValue([_getAsset_1()]);

      await expect(sut.uploadFile(authStub.user1, dto, file)).resolves.toEqual({ duplicate: true, id: 'id_1' });

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: { files: ['fake_path/asset_1.jpeg', undefined, undefined] },
      });
      expect(storageMock.moveFile).not.toHaveBeenCalled();
    });

    it('should handle a live photo', async () => {
      const dto = _getCreateAssetDto();
      const error = new QueryFailedError('', [], '');
      (error as any).constraint = 'UQ_userid_checksum';

      assetRepositoryMock.create.mockResolvedValueOnce(assetEntityStub.livePhotoMotionAsset);
      assetRepositoryMock.create.mockResolvedValueOnce(assetEntityStub.livePhotoStillAsset);

      await expect(
        sut.uploadFile(authStub.user1, dto, fileStub.livePhotoStill, fileStub.livePhotoMotion),
      ).resolves.toEqual({
        duplicate: false,
        id: 'live-photo-still-asset',
      });

      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.METADATA_EXTRACTION,
            data: { id: assetEntityStub.livePhotoMotionAsset.id, source: 'upload' },
          },
        ],
        [{ name: JobName.METADATA_EXTRACTION, data: { id: assetEntityStub.livePhotoStillAsset.id, source: 'upload' } }],
      ]);
    });
  });

  it('get assets by device id', async () => {
    const assets = _getAssets();

    assetRepositoryMock.getAllByDeviceId.mockImplementation(() =>
      Promise.resolve<string[]>(Array.from(assets.map((asset) => asset.deviceAssetId))),
    );

    const deviceId = 'device_id_1';
    const result = await sut.getUserAssetsByDeviceId(authStub.user1, deviceId);

    expect(result.length).toEqual(2);
    expect(result).toEqual(assets.map((asset) => asset.deviceAssetId));
  });

  it('get assets count by time bucket', async () => {
    const assetCountByTimeBucket = _getAssetCountByTimeBucket();

    assetRepositoryMock.getAssetCountByTimeBucket.mockImplementation(() =>
      Promise.resolve<AssetCountByTimeBucket[]>(assetCountByTimeBucket),
    );

    const result = await sut.getAssetCountByTimeBucket(authStub.user1, {
      timeGroup: TimeGroupEnum.Month,
    });

    expect(result.totalCount).toEqual(assetCountByTimeBucket.reduce((a, b) => a + b.count, 0));
    expect(result.buckets.length).toEqual(2);
  });

  describe('deleteAll', () => {
    it('should return failed status when an asset is missing', async () => {
      assetRepositoryMock.get.mockResolvedValue(null);
      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);

      await expect(sut.deleteAll(authStub.user1, { ids: ['asset1'] })).resolves.toEqual([
        { id: 'asset1', status: 'FAILED' },
      ]);

      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should return failed status a delete fails', async () => {
      assetRepositoryMock.get.mockResolvedValue({ id: 'asset1' } as AssetEntity);
      assetRepositoryMock.remove.mockRejectedValue('delete failed');
      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);

      await expect(sut.deleteAll(authStub.user1, { ids: ['asset1'] })).resolves.toEqual([
        { id: 'asset1', status: 'FAILED' },
      ]);

      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should delete a live photo', async () => {
      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);

      await expect(sut.deleteAll(authStub.user1, { ids: [assetEntityStub.livePhotoStillAsset.id] })).resolves.toEqual([
        { id: assetEntityStub.livePhotoStillAsset.id, status: 'SUCCESS' },
        { id: assetEntityStub.livePhotoMotionAsset.id, status: 'SUCCESS' },
      ]);

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: {
          files: [
            'fake_path/asset_1.jpeg',
            undefined,
            undefined,
            undefined,
            undefined,
            'fake_path/asset_1.mp4',
            undefined,
            undefined,
            undefined,
            undefined,
          ],
        },
      });
    });

    it('should delete a batch of assets', async () => {
      const asset1 = {
        id: 'asset1',
        originalPath: 'original-path-1',
        resizePath: 'resize-path-1',
        webpPath: 'web-path-1',
      };

      const asset2 = {
        id: 'asset2',
        originalPath: 'original-path-2',
        resizePath: 'resize-path-2',
        webpPath: 'web-path-2',
        encodedVideoPath: 'encoded-video-path-2',
      };

      when(assetRepositoryMock.get)
        .calledWith(asset1.id)
        .mockResolvedValue(asset1 as AssetEntity);
      when(assetRepositoryMock.get)
        .calledWith(asset2.id)
        .mockResolvedValue(asset2 as AssetEntity);

      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);

      await expect(sut.deleteAll(authStub.user1, { ids: ['asset1', 'asset2'] })).resolves.toEqual([
        { id: 'asset1', status: 'SUCCESS' },
        { id: 'asset2', status: 'SUCCESS' },
      ]);

      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.SEARCH_REMOVE_ASSET, data: { ids: ['asset1'] } }],
        [{ name: JobName.SEARCH_REMOVE_ASSET, data: { ids: ['asset2'] } }],
        [
          {
            name: JobName.DELETE_FILES,
            data: {
              files: [
                'original-path-1',
                'web-path-1',
                'resize-path-1',
                undefined,
                undefined,
                'original-path-2',
                'web-path-2',
                'resize-path-2',
                'encoded-video-path-2',
                undefined,
              ],
            },
          },
        ],
      ]);
    });
  });

  describe('bulkUploadCheck', () => {
    it('should accept hex and base64 checksums', async () => {
      const file1 = Buffer.from('d2947b871a706081be194569951b7db246907957', 'hex');
      const file2 = Buffer.from('53be335e99f18a66ff12e9a901c7a6171dd76573', 'hex');

      assetRepositoryMock.getAssetsByChecksums.mockResolvedValue([
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

      expect(assetRepositoryMock.getAssetsByChecksums).toHaveBeenCalledWith(authStub.admin.id, [file1, file2]);
    });
  });

  describe('importFile', () => {
    it('should handle a file import', async () => {
      assetRepositoryMock.create.mockResolvedValue(assetEntityStub.image);
      storageMock.checkFileExists.mockResolvedValue(true);

      await expect(
        sut.importFile(authStub.external1, {
          ..._getCreateAssetDto(),
          assetPath: '/data/user1/fake_path/asset_1.jpeg',
          isReadOnly: true,
        }),
      ).resolves.toEqual({ duplicate: false, id: 'asset-id' });

      expect(assetRepositoryMock.create).toHaveBeenCalled();
    });

    it('should handle a duplicate if originalPath already exists', async () => {
      const error = new QueryFailedError('', [], '');
      (error as any).constraint = 'UQ_userid_checksum';

      assetRepositoryMock.create.mockRejectedValue(error);
      assetRepositoryMock.getAssetsByChecksums.mockResolvedValue([assetEntityStub.image]);
      storageMock.checkFileExists.mockResolvedValue(true);
      cryptoMock.hashFile.mockResolvedValue(Buffer.from('file hash', 'utf8'));

      await expect(
        sut.importFile(authStub.external1, {
          ..._getCreateAssetDto(),
          assetPath: '/data/user1/fake_path/asset_1.jpeg',
          isReadOnly: true,
        }),
      ).resolves.toEqual({ duplicate: true, id: 'asset-id' });

      expect(assetRepositoryMock.create).toHaveBeenCalled();
    });
  });

  describe('getAssetById', () => {
    it('should allow owner access', async () => {
      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
      assetRepositoryMock.getById.mockResolvedValue(assetEntityStub.image);
      await sut.getAssetById(authStub.admin, assetEntityStub.image.id);
      expect(accessMock.asset.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, assetEntityStub.image.id);
    });

    it('should allow shared link access', async () => {
      accessMock.asset.hasSharedLinkAccess.mockResolvedValue(true);
      assetRepositoryMock.getById.mockResolvedValue(assetEntityStub.image);
      await sut.getAssetById(authStub.adminSharedLink, assetEntityStub.image.id);
      expect(accessMock.asset.hasSharedLinkAccess).toHaveBeenCalledWith(
        authStub.adminSharedLink.sharedLinkId,
        assetEntityStub.image.id,
      );
    });

    it('should allow partner sharing access', async () => {
      accessMock.asset.hasOwnerAccess.mockResolvedValue(false);
      accessMock.asset.hasPartnerAccess.mockResolvedValue(true);
      assetRepositoryMock.getById.mockResolvedValue(assetEntityStub.image);
      await sut.getAssetById(authStub.admin, assetEntityStub.image.id);
      expect(accessMock.asset.hasPartnerAccess).toHaveBeenCalledWith(authStub.admin.id, assetEntityStub.image.id);
    });

    it('should allow shared album access', async () => {
      accessMock.asset.hasOwnerAccess.mockResolvedValue(false);
      accessMock.asset.hasPartnerAccess.mockResolvedValue(false);
      accessMock.asset.hasAlbumAccess.mockResolvedValue(true);
      assetRepositoryMock.getById.mockResolvedValue(assetEntityStub.image);
      await sut.getAssetById(authStub.admin, assetEntityStub.image.id);
      expect(accessMock.asset.hasAlbumAccess).toHaveBeenCalledWith(authStub.admin.id, assetEntityStub.image.id);
    });

    it('should throw an error for no access', async () => {
      accessMock.asset.hasOwnerAccess.mockResolvedValue(false);
      accessMock.asset.hasPartnerAccess.mockResolvedValue(false);
      accessMock.asset.hasSharedLinkAccess.mockResolvedValue(false);
      accessMock.asset.hasAlbumAccess.mockResolvedValue(false);
      await expect(sut.getAssetById(authStub.admin, assetEntityStub.image.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(assetRepositoryMock.getById).not.toHaveBeenCalled();
    });

    it('should throw an error for an invalid shared link', async () => {
      accessMock.asset.hasSharedLinkAccess.mockResolvedValue(false);
      await expect(sut.getAssetById(authStub.adminSharedLink, assetEntityStub.image.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(accessMock.asset.hasOwnerAccess).not.toHaveBeenCalled();
      expect(assetRepositoryMock.getById).not.toHaveBeenCalled();
    });
  });
});

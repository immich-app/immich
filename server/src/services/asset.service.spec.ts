import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { AssetJobName, AssetStatsResponseDto, UploadFieldName } from 'src/dtos/asset.dto';
import { AssetEntity, AssetType } from 'src/entities/asset.entity';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { IAssetStackRepository } from 'src/interfaces/asset-stack.interface';
import { AssetStats, IAssetRepository } from 'src/interfaces/asset.interface';
import { ClientEvent, IEventRepository } from 'src/interfaces/event.interface';
import { IJobRepository, JobName } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { AssetService } from 'src/services/asset.service';
import { assetStackStub, assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { faceStub } from 'test/fixtures/face.stub';
import { partnerStub } from 'test/fixtures/partner.stub';
import { userStub } from 'test/fixtures/user.stub';
import { IAccessRepositoryMock, newAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newAlbumRepositoryMock } from 'test/repositories/album.repository.mock';
import { newAssetStackRepositoryMock } from 'test/repositories/asset-stack.repository.mock';
import { newAssetRepositoryMock } from 'test/repositories/asset.repository.mock';
import { newEventRepositoryMock } from 'test/repositories/event.repository.mock';
import { newJobRepositoryMock } from 'test/repositories/job.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newPartnerRepositoryMock } from 'test/repositories/partner.repository.mock';
import { newStorageRepositoryMock } from 'test/repositories/storage.repository.mock';
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { newUserRepositoryMock } from 'test/repositories/user.repository.mock';
import { Mocked, vitest } from 'vitest';

const file1 = Buffer.from('d2947b871a706081be194569951b7db246907957', 'hex');

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
    label: 'live photo',
    fieldName: UploadFieldName.LIVE_PHOTO_DATA,
    valid: validVideos,
    invalid: ['.html', '.jpeg', '.jpg', '.xml'],
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

describe(AssetService.name, () => {
  let sut: AssetService;
  let accessMock: IAccessRepositoryMock;
  let assetMock: Mocked<IAssetRepository>;
  let jobMock: Mocked<IJobRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let userMock: Mocked<IUserRepository>;
  let eventMock: Mocked<IEventRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let partnerMock: Mocked<IPartnerRepository>;
  let assetStackMock: Mocked<IAssetStackRepository>;
  let albumMock: Mocked<IAlbumRepository>;
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
    storageMock = newStorageRepositoryMock();
    userMock = newUserRepositoryMock();
    systemMock = newSystemMetadataRepositoryMock();
    partnerMock = newPartnerRepositoryMock();
    assetStackMock = newAssetStackRepositoryMock();
    albumMock = newAlbumRepositoryMock();
    loggerMock = newLoggerRepositoryMock();

    sut = new AssetService(
      accessMock,
      assetMock,
      jobMock,
      systemMock,
      storageMock,
      userMock,
      eventMock,
      partnerMock,
      assetStackMock,
      albumMock,
      loggerMock,
    );

    mockGetById([assetStub.livePhotoStillAsset, assetStub.livePhotoMotionAsset]);
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
        duplicate: true,
      });
      expect(assetMock.getUploadAssetIdByChecksum).toHaveBeenCalledWith(authStub.admin.user.id, file1);
    });

    it('should find an existing asset by base64', async () => {
      assetMock.getUploadAssetIdByChecksum.mockResolvedValue('asset-id');
      await expect(sut.getUploadAssetIdByChecksum(authStub.admin, file1.toString('base64'))).resolves.toEqual({
        id: 'asset-id',
        duplicate: true,
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
        'upload/upload/admin_id/ra/nd',
      );
      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/upload/admin_id/ra/nd');
    });
  });

  describe('getMapMarkers', () => {
    it('should get geo information of assets', async () => {
      const asset = assetStub.withLocation;
      const marker = {
        id: asset.id,
        lat: asset.exifInfo!.latitude!,
        lon: asset.exifInfo!.longitude!,
        city: asset.exifInfo!.city,
        state: asset.exifInfo!.state,
        country: asset.exifInfo!.country,
      };
      partnerMock.getAll.mockResolvedValue([]);
      assetMock.getMapMarkers.mockResolvedValue([marker]);

      const markers = await sut.getMapMarkers(authStub.user1, {});

      expect(markers).toHaveLength(1);
      expect(markers[0]).toEqual(marker);
    });
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
          stack: assetStackStub('stack-1', [{ id: 'parent' } as AssetEntity, { id: 'child-1' } as AssetEntity]),
        } as AssetEntity,
      ]);
      assetStackMock.getById.mockResolvedValue(assetStackStub('stack-1', [{ id: 'parent' } as AssetEntity]));

      await sut.updateAll(authStub.user1, {
        ids: ['child-1'],
        removeParent: true,
      });
      expect(assetMock.updateAll).toHaveBeenCalledWith(expect.arrayContaining(['child-1']), { stack: null });
      expect(assetMock.updateAll).toHaveBeenCalledWith(expect.arrayContaining(['parent']), {
        updatedAt: expect.any(Date),
      });
      expect(assetStackMock.delete).toHaveBeenCalledWith('stack-1');
    });

    it('update parentId for new children', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValueOnce(new Set(['child-1', 'child-2']));
      accessMock.asset.checkOwnerAccess.mockResolvedValueOnce(new Set(['parent']));
      const stack = assetStackStub('stack-1', [
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

      expect(assetStackMock.update).toHaveBeenCalledWith({
        ...assetStackStub('stack-1', [
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
          stack: assetStackStub('stack-1', [{ id: 'child-1' } as AssetEntity, { id: 'child-2' } as AssetEntity]),
        } as AssetEntity,
      ]);
      assetStackMock.getById.mockResolvedValue(assetStackStub('stack-1', [{ id: 'parent' } as AssetEntity]));

      await sut.updateAll(authStub.user1, {
        ids: ['child-1'],
        stackParentId: 'parent',
      });

      expect(assetStackMock.delete).toHaveBeenCalledWith('stack-1');
      expect(assetStackMock.create).toHaveBeenCalledWith({
        assets: [{ id: 'child-1' }, { id: 'parent' }, { id: 'child-1' }, { id: 'child-2' }],
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
        { name: JobName.ASSET_DELETION, data: { id: 'asset1' } },
        { name: JobName.ASSET_DELETION, data: { id: 'asset2' } },
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

      await sut.handleAssetDeletion({ id: assetWithFace.id });

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

      await sut.handleAssetDeletion({ id: assetStub.primaryImage.id });

      expect(assetStackMock.update).toHaveBeenCalledWith({
        id: 'stack-1',
        primaryAssetId: 'stack-child-asset-1',
      });
    });

    it('should delete a live photo', async () => {
      assetMock.getById.mockResolvedValue(assetStub.livePhotoStillAsset);

      await sut.handleAssetDeletion({ id: assetStub.livePhotoStillAsset.id });

      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.ASSET_DELETION, data: { id: assetStub.livePhotoMotionAsset.id } }],
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
      await sut.handleAssetDeletion({ id: assetStub.image.id });
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

      expect(assetStackMock.update).toBeCalledWith({ id: 'stack-1', primaryAssetId: 'new' });
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

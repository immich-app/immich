import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  albumStub,
  assetEntityStub,
  authStub,
  newAccessRepositoryMock,
  newCryptoRepositoryMock,
  newSharedLinkRepositoryMock,
  sharedLinkResponseStub,
  sharedLinkStub,
} from '@test';
import { when } from 'jest-when';
import _ from 'lodash';
import { SharedLinkType } from '../../infra/entities/shared-link.entity';
import { AssetIdErrorReason, IAccessRepository, ICryptoRepository } from '../index';
import { ISharedLinkRepository } from './shared-link.repository';
import { SharedLinkService } from './shared-link.service';

describe(SharedLinkService.name, () => {
  let sut: SharedLinkService;
  let accessMock: jest.Mocked<IAccessRepository>;
  let cryptoMock: jest.Mocked<ICryptoRepository>;
  let shareMock: jest.Mocked<ISharedLinkRepository>;

  beforeEach(async () => {
    accessMock = newAccessRepositoryMock();
    cryptoMock = newCryptoRepositoryMock();
    shareMock = newSharedLinkRepositoryMock();

    sut = new SharedLinkService(accessMock, cryptoMock, shareMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all shared links for a user', async () => {
      shareMock.getAll.mockResolvedValue([sharedLinkStub.expired, sharedLinkStub.valid]);
      await expect(sut.getAll(authStub.user1)).resolves.toEqual([
        sharedLinkResponseStub.expired,
        sharedLinkResponseStub.valid,
      ]);
      expect(shareMock.getAll).toHaveBeenCalledWith(authStub.user1.id);
    });
  });

  describe('getMine', () => {
    it('should only work for a public user', async () => {
      await expect(sut.getMine(authStub.admin)).rejects.toBeInstanceOf(ForbiddenException);
      expect(shareMock.get).not.toHaveBeenCalled();
    });

    it('should return the shared link for the public user', async () => {
      const authDto = authStub.adminSharedLink;
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      await expect(sut.getMine(authDto)).resolves.toEqual(sharedLinkResponseStub.valid);
      expect(shareMock.get).toHaveBeenCalledWith(authDto.id, authDto.sharedLinkId);
    });

    it('should return not return exif', async () => {
      const authDto = authStub.adminSharedLinkNoExif;
      shareMock.get.mockResolvedValue(sharedLinkStub.readonlyNoExif);
      await expect(sut.getMine(authDto)).resolves.toEqual(sharedLinkResponseStub.readonlyNoExif);
      expect(shareMock.get).toHaveBeenCalledWith(authDto.id, authDto.sharedLinkId);
    });
  });

  describe('get', () => {
    it('should throw an error for an invalid shared link', async () => {
      shareMock.get.mockResolvedValue(null);
      await expect(sut.get(authStub.user1, 'missing-id')).rejects.toBeInstanceOf(BadRequestException);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, 'missing-id');
      expect(shareMock.update).not.toHaveBeenCalled();
    });

    it('should get a shared link by id', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      await expect(sut.get(authStub.user1, sharedLinkStub.valid.id)).resolves.toEqual(sharedLinkResponseStub.valid);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, sharedLinkStub.valid.id);
    });
  });

  describe('create', () => {
    it('should not allow an album shared link without an albumId', async () => {
      await expect(sut.create(authStub.admin, { type: SharedLinkType.ALBUM, assetIds: [] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should not allow non-owners to create album shared links', async () => {
      accessMock.hasAlbumOwnerAccess.mockResolvedValue(false);
      await expect(
        sut.create(authStub.admin, { type: SharedLinkType.ALBUM, assetIds: [], albumId: 'album-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should not allow individual shared links with no assets', async () => {
      await expect(
        sut.create(authStub.admin, { type: SharedLinkType.INDIVIDUAL, assetIds: [] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should require asset ownership to make an individual shared link', async () => {
      accessMock.hasOwnerAssetAccess.mockResolvedValue(false);
      await expect(
        sut.create(authStub.admin, { type: SharedLinkType.INDIVIDUAL, assetIds: ['asset-1'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create an album shared link', async () => {
      accessMock.hasAlbumOwnerAccess.mockResolvedValue(true);
      shareMock.create.mockResolvedValue(sharedLinkStub.valid);

      await sut.create(authStub.admin, { type: SharedLinkType.ALBUM, albumId: albumStub.oneAsset.id });

      expect(accessMock.hasAlbumOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, albumStub.oneAsset.id);
      expect(shareMock.create).toHaveBeenCalledWith({
        type: SharedLinkType.ALBUM,
        userId: authStub.admin.id,
        albumId: albumStub.oneAsset.id,
        allowDownload: true,
        allowUpload: true,
        assets: [],
        description: null,
        expiresAt: null,
        showExif: true,
        key: Buffer.from('random-bytes', 'utf8'),
      });
    });

    it('should create an individual shared link', async () => {
      accessMock.hasOwnerAssetAccess.mockResolvedValue(true);
      shareMock.create.mockResolvedValue(sharedLinkStub.individual);

      await sut.create(authStub.admin, {
        type: SharedLinkType.INDIVIDUAL,
        assetIds: [assetEntityStub.image.id],
        showExif: true,
        allowDownload: true,
        allowUpload: true,
      });

      expect(accessMock.hasOwnerAssetAccess).toHaveBeenCalledWith(authStub.admin.id, assetEntityStub.image.id);
      expect(shareMock.create).toHaveBeenCalledWith({
        type: SharedLinkType.INDIVIDUAL,
        userId: authStub.admin.id,
        albumId: null,
        allowDownload: true,
        allowUpload: true,
        assets: [{ id: assetEntityStub.image.id }],
        description: null,
        expiresAt: null,
        showExif: true,
        key: Buffer.from('random-bytes', 'utf8'),
      });
    });
  });

  describe('update', () => {
    it('should throw an error for an invalid shared link', async () => {
      shareMock.get.mockResolvedValue(null);
      await expect(sut.update(authStub.user1, 'missing-id', {})).rejects.toBeInstanceOf(BadRequestException);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, 'missing-id');
      expect(shareMock.update).not.toHaveBeenCalled();
    });

    it('should update a shared link', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      shareMock.update.mockResolvedValue(sharedLinkStub.valid);
      await sut.update(authStub.user1, sharedLinkStub.valid.id, { allowDownload: false });
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, sharedLinkStub.valid.id);
      expect(shareMock.update).toHaveBeenCalledWith({
        id: sharedLinkStub.valid.id,
        userId: authStub.user1.id,
        allowDownload: false,
      });
    });
  });

  describe('remove', () => {
    it('should throw an error for an invalid shared link', async () => {
      shareMock.get.mockResolvedValue(null);
      await expect(sut.remove(authStub.user1, 'missing-id')).rejects.toBeInstanceOf(BadRequestException);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, 'missing-id');
      expect(shareMock.update).not.toHaveBeenCalled();
    });

    it('should remove a key', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      await sut.remove(authStub.user1, sharedLinkStub.valid.id);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, sharedLinkStub.valid.id);
      expect(shareMock.remove).toHaveBeenCalledWith(sharedLinkStub.valid);
    });
  });

  describe('addAssets', () => {
    it('should not work on album shared links', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      await expect(sut.addAssets(authStub.admin, 'link-1', { assetIds: ['asset-1'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should add assets to a shared link', async () => {
      shareMock.get.mockResolvedValue(_.cloneDeep(sharedLinkStub.individual));
      shareMock.create.mockResolvedValue(sharedLinkStub.individual);

      when(accessMock.hasOwnerAssetAccess).calledWith(authStub.admin.id, 'asset-2').mockResolvedValue(false);
      when(accessMock.hasOwnerAssetAccess).calledWith(authStub.admin.id, 'asset-3').mockResolvedValue(true);

      await expect(
        sut.addAssets(authStub.admin, 'link-1', { assetIds: [assetEntityStub.image.id, 'asset-2', 'asset-3'] }),
      ).resolves.toEqual([
        { assetId: assetEntityStub.image.id, success: false, error: AssetIdErrorReason.DUPLICATE },
        { assetId: 'asset-2', success: false, error: AssetIdErrorReason.NO_PERMISSION },
        { assetId: 'asset-3', success: true },
      ]);

      expect(accessMock.hasOwnerAssetAccess).toHaveBeenCalledTimes(2);
      expect(shareMock.update).toHaveBeenCalledWith({
        ...sharedLinkStub.individual,
        assets: [assetEntityStub.image, { id: 'asset-3' }],
      });
    });
  });

  describe('removeAssets', () => {
    it('should not work on album shared links', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      await expect(sut.removeAssets(authStub.admin, 'link-1', { assetIds: ['asset-1'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should remove assets from a shared link', async () => {
      shareMock.get.mockResolvedValue(_.cloneDeep(sharedLinkStub.individual));
      shareMock.create.mockResolvedValue(sharedLinkStub.individual);

      await expect(
        sut.removeAssets(authStub.admin, 'link-1', { assetIds: [assetEntityStub.image.id, 'asset-2'] }),
      ).resolves.toEqual([
        { assetId: assetEntityStub.image.id, success: true },
        { assetId: 'asset-2', success: false, error: AssetIdErrorReason.NOT_FOUND },
      ]);

      expect(shareMock.update).toHaveBeenCalledWith({ ...sharedLinkStub.individual, assets: [] });
    });
  });
});

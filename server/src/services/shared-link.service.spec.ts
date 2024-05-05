import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import _ from 'lodash';
import { AssetIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { SharedLinkType } from 'src/entities/shared-link.entity';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { ISharedLinkRepository } from 'src/interfaces/shared-link.interface';
import { SharedLinkService } from 'src/services/shared-link.service';
import { albumStub } from 'test/fixtures/album.stub';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { sharedLinkResponseStub, sharedLinkStub } from 'test/fixtures/shared-link.stub';
import { IAccessRepositoryMock, newAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newCryptoRepositoryMock } from 'test/repositories/crypto.repository.mock';
import { newSharedLinkRepositoryMock } from 'test/repositories/shared-link.repository.mock';
import { Mocked } from 'vitest';

describe(SharedLinkService.name, () => {
  let sut: SharedLinkService;
  let accessMock: IAccessRepositoryMock;
  let cryptoMock: Mocked<ICryptoRepository>;
  let shareMock: Mocked<ISharedLinkRepository>;

  beforeEach(() => {
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
      expect(shareMock.getAll).toHaveBeenCalledWith(authStub.user1.user.id);
    });
  });

  describe('getMine', () => {
    it('should only work for a public user', async () => {
      await expect(sut.getMine(authStub.admin, {})).rejects.toBeInstanceOf(ForbiddenException);
      expect(shareMock.get).not.toHaveBeenCalled();
    });

    it('should return the shared link for the public user', async () => {
      const authDto = authStub.adminSharedLink;
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      await expect(sut.getMine(authDto, {})).resolves.toEqual(sharedLinkResponseStub.valid);
      expect(shareMock.get).toHaveBeenCalledWith(authDto.user.id, authDto.sharedLink?.id);
    });

    it('should not return metadata', async () => {
      const authDto = authStub.adminSharedLinkNoExif;
      shareMock.get.mockResolvedValue(sharedLinkStub.readonlyNoExif);
      await expect(sut.getMine(authDto, {})).resolves.toEqual(sharedLinkResponseStub.readonlyNoMetadata);
      expect(shareMock.get).toHaveBeenCalledWith(authDto.user.id, authDto.sharedLink?.id);
    });

    it('should throw an error for an password protected shared link', async () => {
      const authDto = authStub.adminSharedLink;
      shareMock.get.mockResolvedValue(sharedLinkStub.passwordRequired);
      await expect(sut.getMine(authDto, {})).rejects.toBeInstanceOf(UnauthorizedException);
      expect(shareMock.get).toHaveBeenCalledWith(authDto.user.id, authDto.sharedLink?.id);
    });
  });

  describe('get', () => {
    it('should throw an error for an invalid shared link', async () => {
      shareMock.get.mockResolvedValue(null);
      await expect(sut.get(authStub.user1, 'missing-id')).rejects.toBeInstanceOf(BadRequestException);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.user.id, 'missing-id');
      expect(shareMock.update).not.toHaveBeenCalled();
    });

    it('should get a shared link by id', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      await expect(sut.get(authStub.user1, sharedLinkStub.valid.id)).resolves.toEqual(sharedLinkResponseStub.valid);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.user.id, sharedLinkStub.valid.id);
    });
  });

  describe('create', () => {
    it('should not allow an album shared link without an albumId', async () => {
      await expect(sut.create(authStub.admin, { type: SharedLinkType.ALBUM, assetIds: [] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should not allow non-owners to create album shared links', async () => {
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
      await expect(
        sut.create(authStub.admin, { type: SharedLinkType.INDIVIDUAL, assetIds: ['asset-1'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create an album shared link', async () => {
      accessMock.album.checkOwnerAccess.mockResolvedValue(new Set([albumStub.oneAsset.id]));
      shareMock.create.mockResolvedValue(sharedLinkStub.valid);

      await sut.create(authStub.admin, { type: SharedLinkType.ALBUM, albumId: albumStub.oneAsset.id });

      expect(accessMock.album.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set([albumStub.oneAsset.id]),
      );
      expect(shareMock.create).toHaveBeenCalledWith({
        type: SharedLinkType.ALBUM,
        userId: authStub.admin.user.id,
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
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      shareMock.create.mockResolvedValue(sharedLinkStub.individual);

      await sut.create(authStub.admin, {
        type: SharedLinkType.INDIVIDUAL,
        assetIds: [assetStub.image.id],
        showMetadata: true,
        allowDownload: true,
        allowUpload: true,
      });

      expect(accessMock.asset.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set([assetStub.image.id]),
      );
      expect(shareMock.create).toHaveBeenCalledWith({
        type: SharedLinkType.INDIVIDUAL,
        userId: authStub.admin.user.id,
        albumId: null,
        allowDownload: true,
        allowUpload: true,
        assets: [{ id: assetStub.image.id }],
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
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.user.id, 'missing-id');
      expect(shareMock.update).not.toHaveBeenCalled();
    });

    it('should update a shared link', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      shareMock.update.mockResolvedValue(sharedLinkStub.valid);
      await sut.update(authStub.user1, sharedLinkStub.valid.id, { allowDownload: false });
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.user.id, sharedLinkStub.valid.id);
      expect(shareMock.update).toHaveBeenCalledWith({
        id: sharedLinkStub.valid.id,
        userId: authStub.user1.user.id,
        allowDownload: false,
      });
    });
  });

  describe('remove', () => {
    it('should throw an error for an invalid shared link', async () => {
      shareMock.get.mockResolvedValue(null);
      await expect(sut.remove(authStub.user1, 'missing-id')).rejects.toBeInstanceOf(BadRequestException);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.user.id, 'missing-id');
      expect(shareMock.update).not.toHaveBeenCalled();
    });

    it('should remove a key', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      await sut.remove(authStub.user1, sharedLinkStub.valid.id);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.user.id, sharedLinkStub.valid.id);
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
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-3']));

      await expect(
        sut.addAssets(authStub.admin, 'link-1', { assetIds: [assetStub.image.id, 'asset-2', 'asset-3'] }),
      ).resolves.toEqual([
        { assetId: assetStub.image.id, success: false, error: AssetIdErrorReason.DUPLICATE },
        { assetId: 'asset-2', success: false, error: AssetIdErrorReason.NO_PERMISSION },
        { assetId: 'asset-3', success: true },
      ]);

      expect(accessMock.asset.checkOwnerAccess).toHaveBeenCalledTimes(1);
      expect(shareMock.update).toHaveBeenCalledWith({
        ...sharedLinkStub.individual,
        assets: [assetStub.image, { id: 'asset-3' }],
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
        sut.removeAssets(authStub.admin, 'link-1', { assetIds: [assetStub.image.id, 'asset-2'] }),
      ).resolves.toEqual([
        { assetId: assetStub.image.id, success: true },
        { assetId: 'asset-2', success: false, error: AssetIdErrorReason.NOT_FOUND },
      ]);

      expect(shareMock.update).toHaveBeenCalledWith({ ...sharedLinkStub.individual, assets: [] });
    });
  });

  describe('getMetadataTags', () => {
    it('should return null when auth is not a shared link', async () => {
      await expect(sut.getMetadataTags(authStub.admin)).resolves.toBe(null);
      expect(shareMock.get).not.toHaveBeenCalled();
    });

    it('should return null when shared link has a password', async () => {
      await expect(sut.getMetadataTags(authStub.passwordSharedLink)).resolves.toBe(null);
      expect(shareMock.get).not.toHaveBeenCalled();
    });

    it('should return metadata tags', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.individual);
      await expect(sut.getMetadataTags(authStub.adminSharedLink)).resolves.toEqual({
        description: '1 shared photos & videos',
        imageUrl:
          '/api/asset/thumbnail/asset-id?key=LCtkaJX4R1O_9D-2lq0STzsPryoL1UdAbyb6Sna1xxmQCSuqU2J1ZUsqt6GR-yGm1s0',
        title: 'Public Share',
      });
      expect(shareMock.get).toHaveBeenCalled();
    });
  });
});

import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import _ from 'lodash';
import { AssetIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { SharedLinkType } from 'src/enum';
import { SharedLinkService } from 'src/services/shared-link.service';
import { albumStub } from 'test/fixtures/album.stub';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { sharedLinkResponseStub, sharedLinkStub } from 'test/fixtures/shared-link.stub';
import { newTestService, ServiceMocks } from 'test/utils';

describe(SharedLinkService.name, () => {
  let sut: SharedLinkService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(SharedLinkService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all shared links for a user', async () => {
      mocks.sharedLink.getAll.mockResolvedValue([sharedLinkStub.expired, sharedLinkStub.valid]);
      await expect(sut.getAll(authStub.user1, {})).resolves.toEqual([
        sharedLinkResponseStub.expired,
        sharedLinkResponseStub.valid,
      ]);
      expect(mocks.sharedLink.getAll).toHaveBeenCalledWith({ userId: authStub.user1.user.id });
    });
  });

  describe('getMine', () => {
    it('should only work for a public user', async () => {
      await expect(sut.getMine(authStub.admin, {})).rejects.toBeInstanceOf(ForbiddenException);
      expect(mocks.sharedLink.get).not.toHaveBeenCalled();
    });

    it('should return the shared link for the public user', async () => {
      const authDto = authStub.adminSharedLink;
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.valid);
      await expect(sut.getMine(authDto, {})).resolves.toEqual(sharedLinkResponseStub.valid);
      expect(mocks.sharedLink.get).toHaveBeenCalledWith(authDto.user.id, authDto.sharedLink?.id);
    });

    it('should not return metadata', async () => {
      const authDto = authStub.adminSharedLinkNoExif;
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.readonlyNoExif);
      await expect(sut.getMine(authDto, {})).resolves.toEqual(sharedLinkResponseStub.readonlyNoMetadata);
      expect(mocks.sharedLink.get).toHaveBeenCalledWith(authDto.user.id, authDto.sharedLink?.id);
    });

    it('should throw an error for an invalid password protected shared link', async () => {
      const authDto = authStub.adminSharedLink;
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.passwordRequired);
      await expect(sut.getMine(authDto, {})).rejects.toBeInstanceOf(UnauthorizedException);
      expect(mocks.sharedLink.get).toHaveBeenCalledWith(authDto.user.id, authDto.sharedLink?.id);
    });

    it('should allow a correct password on a password protected shared link', async () => {
      mocks.sharedLink.get.mockResolvedValue({ ...sharedLinkStub.individual, password: '123' });
      await expect(sut.getMine(authStub.adminSharedLink, { password: '123' })).resolves.toBeDefined();
      expect(mocks.sharedLink.get).toHaveBeenCalledWith(
        authStub.adminSharedLink.user.id,
        authStub.adminSharedLink.sharedLink?.id,
      );
    });
  });

  describe('get', () => {
    it('should throw an error for an invalid shared link', async () => {
      mocks.sharedLink.get.mockResolvedValue(void 0);

      await expect(sut.get(authStub.user1, 'missing-id')).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.sharedLink.get).toHaveBeenCalledWith(authStub.user1.user.id, 'missing-id');
      expect(mocks.sharedLink.update).not.toHaveBeenCalled();
    });

    it('should get a shared link by id', async () => {
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.valid);
      await expect(sut.get(authStub.user1, sharedLinkStub.valid.id)).resolves.toEqual(sharedLinkResponseStub.valid);
      expect(mocks.sharedLink.get).toHaveBeenCalledWith(authStub.user1.user.id, sharedLinkStub.valid.id);
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
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumStub.oneAsset.id]));
      mocks.sharedLink.create.mockResolvedValue(sharedLinkStub.valid);

      await sut.create(authStub.admin, { type: SharedLinkType.ALBUM, albumId: albumStub.oneAsset.id });

      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set([albumStub.oneAsset.id]),
      );
      expect(mocks.sharedLink.create).toHaveBeenCalledWith({
        type: SharedLinkType.ALBUM,
        userId: authStub.admin.user.id,
        albumId: albumStub.oneAsset.id,
        allowDownload: true,
        allowUpload: true,
        description: null,
        expiresAt: null,
        showExif: true,
        key: Buffer.from('random-bytes', 'utf8'),
      });
    });

    it('should create an individual shared link', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      mocks.sharedLink.create.mockResolvedValue(sharedLinkStub.individual);

      await sut.create(authStub.admin, {
        type: SharedLinkType.INDIVIDUAL,
        assetIds: [assetStub.image.id],
        showMetadata: true,
        allowDownload: true,
        allowUpload: true,
      });

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set([assetStub.image.id]),
      );
      expect(mocks.sharedLink.create).toHaveBeenCalledWith({
        type: SharedLinkType.INDIVIDUAL,
        userId: authStub.admin.user.id,
        albumId: null,
        allowDownload: true,
        allowUpload: true,
        assetIds: [assetStub.image.id],
        description: null,
        expiresAt: null,
        showExif: true,
        key: Buffer.from('random-bytes', 'utf8'),
      });
    });

    it('should create a shared link with allowDownload set to false when showMetadata is false', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetStub.image.id]));
      mocks.sharedLink.create.mockResolvedValue(sharedLinkStub.individual);

      await sut.create(authStub.admin, {
        type: SharedLinkType.INDIVIDUAL,
        assetIds: [assetStub.image.id],
        showMetadata: false,
        allowDownload: true,
        allowUpload: true,
      });

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set([assetStub.image.id]),
      );
      expect(mocks.sharedLink.create).toHaveBeenCalledWith({
        type: SharedLinkType.INDIVIDUAL,
        userId: authStub.admin.user.id,
        albumId: null,
        allowDownload: false,
        allowUpload: true,
        assetIds: [assetStub.image.id],
        description: null,
        expiresAt: null,
        showExif: false,
        key: Buffer.from('random-bytes', 'utf8'),
      });
    });
  });

  describe('update', () => {
    it('should throw an error for an invalid shared link', async () => {
      mocks.sharedLink.get.mockResolvedValue(void 0);

      await expect(sut.update(authStub.user1, 'missing-id', {})).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.sharedLink.get).toHaveBeenCalledWith(authStub.user1.user.id, 'missing-id');
      expect(mocks.sharedLink.update).not.toHaveBeenCalled();
    });

    it('should update a shared link', async () => {
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.valid);
      mocks.sharedLink.update.mockResolvedValue(sharedLinkStub.valid);
      await sut.update(authStub.user1, sharedLinkStub.valid.id, { allowDownload: false });
      expect(mocks.sharedLink.get).toHaveBeenCalledWith(authStub.user1.user.id, sharedLinkStub.valid.id);
      expect(mocks.sharedLink.update).toHaveBeenCalledWith({
        id: sharedLinkStub.valid.id,
        userId: authStub.user1.user.id,
        allowDownload: false,
      });
    });
  });

  describe('remove', () => {
    it('should throw an error for an invalid shared link', async () => {
      mocks.sharedLink.get.mockResolvedValue(void 0);

      await expect(sut.remove(authStub.user1, 'missing-id')).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.sharedLink.get).toHaveBeenCalledWith(authStub.user1.user.id, 'missing-id');
      expect(mocks.sharedLink.update).not.toHaveBeenCalled();
    });

    it('should remove a key', async () => {
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.valid);
      mocks.sharedLink.remove.mockResolvedValue();

      await sut.remove(authStub.user1, sharedLinkStub.valid.id);

      expect(mocks.sharedLink.get).toHaveBeenCalledWith(authStub.user1.user.id, sharedLinkStub.valid.id);
      expect(mocks.sharedLink.remove).toHaveBeenCalledWith(sharedLinkStub.valid);
    });
  });

  describe('addAssets', () => {
    it('should not work on album shared links', async () => {
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.valid);
      await expect(sut.addAssets(authStub.admin, 'link-1', { assetIds: ['asset-1'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should add assets to a shared link', async () => {
      mocks.sharedLink.get.mockResolvedValue(_.cloneDeep(sharedLinkStub.individual));
      mocks.sharedLink.create.mockResolvedValue(sharedLinkStub.individual);
      mocks.sharedLink.update.mockResolvedValue(sharedLinkStub.individual);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-3']));

      await expect(
        sut.addAssets(authStub.admin, 'link-1', { assetIds: [assetStub.image.id, 'asset-2', 'asset-3'] }),
      ).resolves.toEqual([
        { assetId: assetStub.image.id, success: false, error: AssetIdErrorReason.DUPLICATE },
        { assetId: 'asset-2', success: false, error: AssetIdErrorReason.NO_PERMISSION },
        { assetId: 'asset-3', success: true },
      ]);

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledTimes(1);
      expect(mocks.sharedLink.update).toHaveBeenCalled();
      expect(mocks.sharedLink.update).toHaveBeenCalledWith({
        ...sharedLinkStub.individual,
        assetIds: ['asset-3'],
      });
    });
  });

  describe('removeAssets', () => {
    it('should not work on album shared links', async () => {
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.valid);
      await expect(sut.removeAssets(authStub.admin, 'link-1', { assetIds: ['asset-1'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should remove assets from a shared link', async () => {
      mocks.sharedLink.get.mockResolvedValue(_.cloneDeep(sharedLinkStub.individual));
      mocks.sharedLink.create.mockResolvedValue(sharedLinkStub.individual);
      mocks.sharedLink.update.mockResolvedValue(sharedLinkStub.individual);

      await expect(
        sut.removeAssets(authStub.admin, 'link-1', { assetIds: [assetStub.image.id, 'asset-2'] }),
      ).resolves.toEqual([
        { assetId: assetStub.image.id, success: true },
        { assetId: 'asset-2', success: false, error: AssetIdErrorReason.NOT_FOUND },
      ]);

      expect(mocks.sharedLink.update).toHaveBeenCalledWith({ ...sharedLinkStub.individual, assets: [] });
    });
  });

  describe('getMetadataTags', () => {
    it('should return null when auth is not a shared link', async () => {
      await expect(sut.getMetadataTags(authStub.admin)).resolves.toBe(null);
      expect(mocks.sharedLink.get).not.toHaveBeenCalled();
    });

    it('should return null when shared link has a password', async () => {
      await expect(sut.getMetadataTags(authStub.passwordSharedLink)).resolves.toBe(null);
      expect(mocks.sharedLink.get).not.toHaveBeenCalled();
    });

    it('should return metadata tags', async () => {
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.individual);
      await expect(sut.getMetadataTags(authStub.adminSharedLink)).resolves.toEqual({
        description: '1 shared photos & videos',
        imageUrl: `http://localhost:2283/api/assets/asset-id/thumbnail?key=LCtkaJX4R1O_9D-2lq0STzsPryoL1UdAbyb6Sna1xxmQCSuqU2J1ZUsqt6GR-yGm1s0`,
        title: 'Public Share',
      });
      expect(mocks.sharedLink.get).toHaveBeenCalled();
    });

    it('should return metadata tags with a default image path if the asset id is not set', async () => {
      mocks.sharedLink.get.mockResolvedValue({ ...sharedLinkStub.individual, album: undefined, assets: [] });
      await expect(sut.getMetadataTags(authStub.adminSharedLink)).resolves.toEqual({
        description: '0 shared photos & videos',
        imageUrl: `http://localhost:2283/feature-panel.png`,
        title: 'Public Share',
      });
      expect(mocks.sharedLink.get).toHaveBeenCalled();
    });
  });
});

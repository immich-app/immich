import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AssetIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { SharedLinkType } from 'src/enum';
import { SharedLinkService } from 'src/services/shared-link.service';
import { AlbumFactory } from 'test/factories/album.factory';
import { AssetFactory } from 'test/factories/asset.factory';
import { SharedLinkFactory } from 'test/factories/shared-link.factory';
import { authStub } from 'test/fixtures/auth.stub';
import { sharedLinkResponseStub, sharedLinkStub } from 'test/fixtures/shared-link.stub';
import { factory, newUuid } from 'test/small.factory';
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

    it('should pass id filter to getAll', async () => {
      mocks.sharedLink.getAll.mockResolvedValue([sharedLinkStub.valid]);

      await sut.getAll(authStub.user1, { id: 'link-id' });

      expect(mocks.sharedLink.getAll).toHaveBeenCalledWith({ userId: authStub.user1.user.id, id: 'link-id' });
    });

    it('should pass albumId filter to getAll', async () => {
      mocks.sharedLink.getAll.mockResolvedValue([sharedLinkStub.valid]);

      await sut.getAll(authStub.user1, { albumId: 'album-id' });

      expect(mocks.sharedLink.getAll).toHaveBeenCalledWith({ userId: authStub.user1.user.id, albumId: 'album-id' });
    });
  });

  describe('login', () => {
    it('should throw ForbiddenException when not a shared link', async () => {
      await expect(sut.login(authStub.admin, { password: 'test' })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw BadRequestException when shared link is not password protected', async () => {
      mocks.sharedLink.get.mockResolvedValue({ ...sharedLinkStub.valid, password: null });

      await expect(sut.login(authStub.adminSharedLink, { password: 'test' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mocks.sharedLink.get.mockResolvedValue({ ...sharedLinkStub.individual, password: 'correct-password' });

      await expect(sut.login(authStub.adminSharedLink, { password: 'wrong-password' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('should return shared link and token for valid password', async () => {
      const sharedLink = { ...sharedLinkStub.individual, password: 'correct-password' };
      mocks.sharedLink.get.mockResolvedValue(sharedLink);
      mocks.crypto.hashSha256.mockReturnValue(Buffer.from('hashed-token'));

      const result = await sut.login(authStub.adminSharedLink, { password: 'correct-password' });

      expect(result).toHaveProperty('sharedLink');
      expect(result).toHaveProperty('token');
      expect(mocks.sharedLink.get).toHaveBeenCalledWith(
        authStub.adminSharedLink.user.id,
        authStub.adminSharedLink.sharedLink?.id,
      );
    });
  });

  describe('getMine', () => {
    it('should only work for a public user', async () => {
      await expect(sut.getMine(authStub.admin, [])).rejects.toBeInstanceOf(ForbiddenException);
      expect(mocks.sharedLink.get).not.toHaveBeenCalled();
    });

    it('should return the shared link for the public user', async () => {
      const authDto = authStub.adminSharedLink;
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.valid);
      await expect(sut.getMine(authDto, [])).resolves.toEqual(sharedLinkResponseStub.valid);
      expect(mocks.sharedLink.get).toHaveBeenCalledWith(authDto.user.id, authDto.sharedLink?.id);
    });

    it('should not return metadata', async () => {
      const authDto = factory.auth({
        sharedLink: {
          showExif: false,
          allowDownload: true,
          allowUpload: true,
        },
      });
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.readonlyNoExif);
      const response = await sut.getMine(authDto, []);
      expect(response.assets[0]).toMatchObject({ hasMetadata: false });
      expect(mocks.sharedLink.get).toHaveBeenCalledWith(authDto.user.id, authDto.sharedLink?.id);
    });

    it('should throw an error for a request without a shared link auth token', async () => {
      const authDto = authStub.adminSharedLink;
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.passwordRequired);
      await expect(sut.getMine(authDto, [])).rejects.toBeInstanceOf(UnauthorizedException);
      expect(mocks.sharedLink.get).toHaveBeenCalledWith(authDto.user.id, authDto.sharedLink?.id);
    });

    it('should accept a valid shared link auth token', async () => {
      mocks.sharedLink.get.mockResolvedValue({ ...sharedLinkStub.individual, password: '123' });
      const secret = Buffer.from('auth-token-123');
      mocks.crypto.hashSha256.mockReturnValue(secret);
      await expect(sut.getMine(authStub.adminSharedLink, [secret.toString('base64')])).resolves.toBeDefined();
      expect(mocks.sharedLink.get).toHaveBeenCalledWith(
        authStub.adminSharedLink.user.id,
        authStub.adminSharedLink.sharedLink?.id,
      );
    });

    it('should throw UnauthorizedException for invalid token on password-protected link', async () => {
      mocks.sharedLink.get.mockResolvedValue({ ...sharedLinkStub.individual, password: '123' });
      const secret = Buffer.from('auth-token-123');
      mocks.crypto.hashSha256.mockReturnValue(secret);

      await expect(sut.getMine(authStub.adminSharedLink, ['invalid-token'])).rejects.toBeInstanceOf(
        UnauthorizedException,
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
      await expect(sut.create(authStub.admin, { type: SharedLinkType.Album, assetIds: [] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should not allow non-owners to create album shared links', async () => {
      await expect(
        sut.create(authStub.admin, { type: SharedLinkType.Album, assetIds: [], albumId: 'album-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should not allow individual shared links with no assets', async () => {
      await expect(
        sut.create(authStub.admin, { type: SharedLinkType.Individual, assetIds: [] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should require asset ownership to make an individual shared link', async () => {
      await expect(
        sut.create(authStub.admin, { type: SharedLinkType.Individual, assetIds: ['asset-1'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create an album shared link', async () => {
      const album = AlbumFactory.from().asset().build();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.sharedLink.create.mockResolvedValue(sharedLinkStub.valid);

      await sut.create(authStub.admin, { type: SharedLinkType.Album, albumId: album.id });

      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set([album.id]));
      expect(mocks.sharedLink.create).toHaveBeenCalledWith({
        type: SharedLinkType.Album,
        userId: authStub.admin.user.id,
        albumId: album.id,
        allowDownload: true,
        allowUpload: true,
        description: null,
        expiresAt: null,
        slug: null,
        showExif: true,
        key: Buffer.from('random-bytes', 'utf8'),
      });
    });

    it('should create an individual shared link', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.sharedLink.create.mockResolvedValue(sharedLinkStub.individual);

      await sut.create(authStub.admin, {
        type: SharedLinkType.Individual,
        assetIds: [asset.id],
        showMetadata: true,
        allowDownload: true,
        allowUpload: true,
      });

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set([asset.id]),
        false,
      );
      expect(mocks.sharedLink.create).toHaveBeenCalledWith({
        type: SharedLinkType.Individual,
        userId: authStub.admin.user.id,
        albumId: null,
        allowDownload: true,
        slug: null,
        allowUpload: true,
        assetIds: [asset.id],
        description: null,
        expiresAt: null,
        showExif: true,
        key: Buffer.from('random-bytes', 'utf8'),
      });
    });

    it('should create a shared link with allowDownload set to false when showMetadata is false', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.sharedLink.create.mockResolvedValue(sharedLinkStub.individual);

      await sut.create(authStub.admin, {
        type: SharedLinkType.Individual,
        assetIds: [asset.id],
        showMetadata: false,
        allowDownload: true,
        allowUpload: true,
      });

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set([asset.id]),
        false,
      );
      expect(mocks.sharedLink.create).toHaveBeenCalledWith({
        type: SharedLinkType.Individual,
        userId: authStub.admin.user.id,
        albumId: null,
        allowDownload: false,
        allowUpload: true,
        assetIds: [asset.id],
        description: null,
        expiresAt: null,
        showExif: false,
        slug: null,
        key: Buffer.from('random-bytes', 'utf8'),
      });
    });

    it('should create a shared link with custom description and expiry', async () => {
      const asset = AssetFactory.create();
      const expiresAt = new Date('2025-12-31');
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.sharedLink.create.mockResolvedValue(sharedLinkStub.individual);

      await sut.create(authStub.admin, {
        type: SharedLinkType.Individual,
        assetIds: [asset.id],
        description: 'My shared photos',
        expiresAt: expiresAt.toISOString() as any,
      });

      expect(mocks.sharedLink.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'My shared photos',
          expiresAt: expiresAt.toISOString(),
        }),
      );
    });

    it('should create a shared link with a password', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.sharedLink.create.mockResolvedValue(sharedLinkStub.individual);

      await sut.create(authStub.admin, {
        type: SharedLinkType.Individual,
        assetIds: [asset.id],
        password: 'secret123',
      });

      expect(mocks.sharedLink.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'secret123' }),
      );
    });

    it('should throw BadRequestException for duplicate slug', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      const error = new Error('duplicate slug');
      (error as any).constraint_name = 'shared_link_slug_uq';
      mocks.sharedLink.create.mockRejectedValue(error);

      await expect(
        sut.create(authStub.admin, {
          type: SharedLinkType.Individual,
          assetIds: [asset.id],
          slug: 'duplicate-slug',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should rethrow unknown errors', async () => {
      const asset = AssetFactory.create();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      const error = new Error('unknown error');
      mocks.sharedLink.create.mockRejectedValue(error);

      await expect(
        sut.create(authStub.admin, {
          type: SharedLinkType.Individual,
          assetIds: [asset.id],
        }),
      ).rejects.toThrow('unknown error');
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
        slug: null,
        userId: authStub.user1.user.id,
        allowDownload: false,
      });
    });

    it('should set expiresAt to null when changeExpiryTime is true and expiresAt is not provided', async () => {
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.valid);
      mocks.sharedLink.update.mockResolvedValue(sharedLinkStub.valid);

      await sut.update(authStub.user1, sharedLinkStub.valid.id, { changeExpiryTime: true });

      expect(mocks.sharedLink.update).toHaveBeenCalledWith(
        expect.objectContaining({ expiresAt: null }),
      );
    });

    it('should use provided expiresAt when both changeExpiryTime and expiresAt are set', async () => {
      const expiresAt = new Date('2025-12-31');
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.valid);
      mocks.sharedLink.update.mockResolvedValue(sharedLinkStub.valid);

      await sut.update(authStub.user1, sharedLinkStub.valid.id, {
        changeExpiryTime: true,
        expiresAt: expiresAt.toISOString() as any,
      });

      expect(mocks.sharedLink.update).toHaveBeenCalledWith(
        expect.objectContaining({ expiresAt: expiresAt.toISOString() }),
      );
    });

    it('should update shared link with showMetadata', async () => {
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.valid);
      mocks.sharedLink.update.mockResolvedValue(sharedLinkStub.valid);

      await sut.update(authStub.user1, sharedLinkStub.valid.id, { showMetadata: false });

      expect(mocks.sharedLink.update).toHaveBeenCalledWith(
        expect.objectContaining({ showExif: false }),
      );
    });

    it('should update shared link with password', async () => {
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.valid);
      mocks.sharedLink.update.mockResolvedValue(sharedLinkStub.valid);

      await sut.update(authStub.user1, sharedLinkStub.valid.id, { password: 'new-password' });

      expect(mocks.sharedLink.update).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'new-password' }),
      );
    });

    it('should update shared link description', async () => {
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.valid);
      mocks.sharedLink.update.mockResolvedValue(sharedLinkStub.valid);

      await sut.update(authStub.user1, sharedLinkStub.valid.id, { description: 'Updated description' });

      expect(mocks.sharedLink.update).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Updated description' }),
      );
    });

    it('should throw BadRequestException for duplicate slug on update', async () => {
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.valid);
      const error = new Error('duplicate slug');
      (error as any).constraint_name = 'shared_link_slug_uq';
      mocks.sharedLink.update.mockRejectedValue(error);

      await expect(
        sut.update(authStub.user1, sharedLinkStub.valid.id, { slug: 'duplicate-slug' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should rethrow unknown errors on update', async () => {
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.valid);
      const error = new Error('unknown error');
      mocks.sharedLink.update.mockRejectedValue(error);

      await expect(sut.update(authStub.user1, sharedLinkStub.valid.id, {})).rejects.toThrow('unknown error');
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
      expect(mocks.sharedLink.remove).toHaveBeenCalledWith(sharedLinkStub.valid.id);
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
      const asset = AssetFactory.create();
      const sharedLink = SharedLinkFactory.from().asset(asset).build();
      const newAsset = AssetFactory.create();
      mocks.sharedLink.get.mockResolvedValue(sharedLink);
      mocks.sharedLink.create.mockResolvedValue(sharedLink);
      mocks.sharedLink.update.mockResolvedValue(sharedLink);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([newAsset.id]));

      await expect(
        sut.addAssets(authStub.admin, sharedLink.id, { assetIds: [asset.id, 'asset-2', newAsset.id] }),
      ).resolves.toEqual([
        { assetId: asset.id, success: false, error: AssetIdErrorReason.DUPLICATE },
        { assetId: 'asset-2', success: false, error: AssetIdErrorReason.NO_PERMISSION },
        { assetId: newAsset.id, success: true },
      ]);

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledTimes(1);
      expect(mocks.sharedLink.update).toHaveBeenCalled();
      expect(mocks.sharedLink.update).toHaveBeenCalledWith({
        ...sharedLink,
        slug: null,
        assetIds: [newAsset.id],
      });
    });

    it('should handle all assets being duplicates', async () => {
      const asset = AssetFactory.create();
      const sharedLink = SharedLinkFactory.from().asset(asset).build();
      mocks.sharedLink.get.mockResolvedValue(sharedLink);
      mocks.sharedLink.update.mockResolvedValue(sharedLink);

      const result = await sut.addAssets(authStub.admin, sharedLink.id, { assetIds: [asset.id] });

      expect(result).toEqual([{ assetId: asset.id, success: false, error: AssetIdErrorReason.DUPLICATE }]);
      expect(mocks.sharedLink.update).toHaveBeenCalled();
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
      const asset = AssetFactory.create();
      const sharedLink = SharedLinkFactory.from().asset(asset).build();
      mocks.sharedLink.get.mockResolvedValue(sharedLink);
      mocks.sharedLink.create.mockResolvedValue(sharedLink);
      mocks.sharedLink.update.mockResolvedValue(sharedLink);
      mocks.sharedLinkAsset.remove.mockResolvedValue([asset.id]);

      await expect(
        sut.removeAssets(authStub.admin, sharedLink.id, { assetIds: [asset.id, 'asset-2'] }),
      ).resolves.toEqual([
        { assetId: asset.id, success: true },
        { assetId: 'asset-2', success: false, error: AssetIdErrorReason.NOT_FOUND },
      ]);

      expect(mocks.sharedLinkAsset.remove).toHaveBeenCalledWith(sharedLink.id, [asset.id, 'asset-2']);
      expect(mocks.sharedLink.update).toHaveBeenCalledWith(expect.objectContaining({ assets: [] }));
    });

    it('should handle all assets not found', async () => {
      const sharedLink = SharedLinkFactory.from().build();
      mocks.sharedLink.get.mockResolvedValue(sharedLink);
      mocks.sharedLinkAsset.remove.mockResolvedValue([]);
      mocks.sharedLink.update.mockResolvedValue(sharedLink);

      const result = await sut.removeAssets(authStub.admin, sharedLink.id, { assetIds: ['missing-1', 'missing-2'] });

      expect(result).toEqual([
        { assetId: 'missing-1', success: false, error: AssetIdErrorReason.NOT_FOUND },
        { assetId: 'missing-2', success: false, error: AssetIdErrorReason.NOT_FOUND },
      ]);
    });
  });

  describe('getMetadataTags', () => {
    it('should return null when auth is not a shared link', async () => {
      await expect(sut.getMetadataTags(authStub.admin)).resolves.toBe(null);

      expect(mocks.sharedLink.get).not.toHaveBeenCalled();
    });

    it('should return null when shared link has a password', async () => {
      const auth = factory.auth({ user: {}, sharedLink: { password: 'password' } });

      await expect(sut.getMetadataTags(auth)).resolves.toBe(null);

      expect(mocks.sharedLink.get).not.toHaveBeenCalled();
    });

    it('should return metadata tags', async () => {
      mocks.sharedLink.get.mockResolvedValue(sharedLinkStub.individual);

      await expect(sut.getMetadataTags(authStub.adminSharedLink)).resolves.toEqual({
        description: '1 shared photos & videos',
        imageUrl: `https://my.immich.app/api/assets/${sharedLinkStub.individual.assets[0].id}/thumbnail?key=LCtkaJX4R1O_9D-2lq0STzsPryoL1UdAbyb6Sna1xxmQCSuqU2J1ZUsqt6GR-yGm1s0`,
        title: 'Public Share',
      });

      expect(mocks.sharedLink.get).toHaveBeenCalled();
    });

    it('should return metadata tags with a default image path if the asset id is not set', async () => {
      mocks.sharedLink.get.mockResolvedValue({ ...sharedLinkStub.individual, album: null, assets: [] });
      await expect(sut.getMetadataTags(authStub.adminSharedLink)).resolves.toEqual({
        description: '0 shared photos & videos',
        imageUrl: `https://my.immich.app/feature-panel.png`,
        title: 'Public Share',
      });

      expect(mocks.sharedLink.get).toHaveBeenCalled();
    });

    it('should return album name as title when shared link has an album', async () => {
      const album = AlbumFactory.from({ albumName: 'Vacation Photos' }).build();
      const sharedLink = {
        ...sharedLinkStub.individual,
        album: { ...album, albumThumbnailAssetId: null },
        assets: [],
      };
      mocks.sharedLink.get.mockResolvedValue(sharedLink);

      const result = await sut.getMetadataTags(authStub.adminSharedLink);

      expect(result).toMatchObject({ title: 'Vacation Photos' });
    });

    it('should use album thumbnail asset for image URL when available', async () => {
      const thumbnailAssetId = newUuid();
      const album = AlbumFactory.from({ albumName: 'Test Album' }).build();
      const sharedLink = {
        ...sharedLinkStub.individual,
        album: { ...album, albumThumbnailAssetId: thumbnailAssetId, assets: [] },
        assets: [],
      };
      mocks.sharedLink.get.mockResolvedValue(sharedLink);

      const result = await sut.getMetadataTags(authStub.adminSharedLink);

      expect(result?.imageUrl).toContain(`/api/assets/${thumbnailAssetId}/thumbnail`);
    });

    it('should use shared link description when available', async () => {
      const sharedLink = {
        ...sharedLinkStub.individual,
        description: 'My custom description',
        album: null,
        assets: [],
      };
      mocks.sharedLink.get.mockResolvedValue(sharedLink);

      const result = await sut.getMetadataTags(authStub.adminSharedLink);

      expect(result).toMatchObject({ description: 'My custom description' });
    });

    it('should use album assets count when shared link has an album', async () => {
      const album = AlbumFactory.from({ albumName: 'Test Album' }).build();
      const assets = [AssetFactory.create(), AssetFactory.create(), AssetFactory.create()];
      const sharedLink = {
        ...sharedLinkStub.individual,
        album: { ...album, albumThumbnailAssetId: null, assets },
        assets: [],
      };
      mocks.sharedLink.get.mockResolvedValue(sharedLink);

      const result = await sut.getMetadataTags(authStub.adminSharedLink);

      expect(result).toMatchObject({ description: '3 shared photos & videos' });
    });

    it('should use defaultDomain when provided', async () => {
      mocks.sharedLink.get.mockResolvedValue({ ...sharedLinkStub.individual, album: null, assets: [] });

      const result = await sut.getMetadataTags(authStub.adminSharedLink, 'https://custom.domain.com');

      expect(result?.imageUrl).toContain('custom.domain.com');
    });
  });
});

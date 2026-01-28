import { BadRequestException } from '@nestjs/common';
import _ from 'lodash';
import { BulkIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { AlbumUserRole, AssetOrder, UserMetadataKey } from 'src/enum';
import { AlbumService } from 'src/services/album.service';
import { albumStub } from 'test/fixtures/album.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { factory } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe(AlbumService.name, () => {
  let sut: AlbumService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AlbumService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getStatistics', () => {
    it('should get the album count', async () => {
      mocks.album.getOwned.mockResolvedValue([]);
      mocks.album.getShared.mockResolvedValue([]);
      mocks.album.getNotShared.mockResolvedValue([]);
      await expect(sut.getStatistics(authStub.admin)).resolves.toEqual({
        owned: 0,
        shared: 0,
        notShared: 0,
      });

      expect(mocks.album.getOwned).toHaveBeenCalledWith(authStub.admin.user.id);
      expect(mocks.album.getShared).toHaveBeenCalledWith(authStub.admin.user.id);
      expect(mocks.album.getNotShared).toHaveBeenCalledWith(authStub.admin.user.id);
    });
  });

  describe('getAll', () => {
    it('gets list of albums for auth user', async () => {
      const owner = factory.userAdmin();
      const album = { ...factory.album({ ownerId: owner.id }), owner };
      const sharedWithUserAlbum = {
        ...factory.album({ ownerId: owner.id }),
        owner,
        albumUsers: [{ user: factory.user(), role: AlbumUserRole.Editor }],
      };
      mocks.album.getOwned.mockResolvedValue([album, sharedWithUserAlbum]);
      mocks.album.getMetadataForIds.mockResolvedValue([
        {
          albumId: album.id,
          assetCount: 0,
          startDate: null,
          endDate: null,
          lastModifiedAssetTimestamp: null,
        },
        {
          albumId: sharedWithUserAlbum.id,
          assetCount: 0,
          startDate: null,
          endDate: null,
          lastModifiedAssetTimestamp: null,
        },
      ]);

      const result = await sut.getAll(factory.auth({ user: owner }), {});
      expect(result).toHaveLength(2);
      expect(result[0].id).toEqual(album.id);
      expect(result[1].id).toEqual(sharedWithUserAlbum.id);
    });

    it('gets list of albums that have a specific asset', async () => {
      const owner = factory.userAdmin();
      const asset = factory.asset({ ownerId: owner.id });
      const album = { ...factory.album({ ownerId: owner.id }), owner, assets: [asset] };
      mocks.album.getByAssetId.mockResolvedValue([album]);
      mocks.album.getMetadataForIds.mockResolvedValue([
        {
          albumId: album.id,
          assetCount: 1,
          startDate: new Date('1970-01-01'),
          endDate: new Date('1970-01-01'),
          lastModifiedAssetTimestamp: new Date('1970-01-01'),
        },
      ]);

      const result = await sut.getAll(factory.auth({ user: owner }), { assetId: asset.id });
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(album.id);
      expect(mocks.album.getByAssetId).toHaveBeenCalledTimes(1);
    });

    it('gets list of albums that are shared', async () => {
      const owner = factory.userAdmin();
      const album = {
        ...factory.album({ ownerId: owner.id }),
        owner,
        albumUsers: [{ user: factory.user(), role: AlbumUserRole.Editor }],
      };
      mocks.album.getShared.mockResolvedValue([album]);
      mocks.album.getMetadataForIds.mockResolvedValue([
        {
          albumId: album.id,
          assetCount: 0,
          startDate: null,
          endDate: null,
          lastModifiedAssetTimestamp: null,
        },
      ]);

      const result = await sut.getAll(factory.auth({ user: owner }), { shared: true });
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(album.id);
      expect(mocks.album.getShared).toHaveBeenCalledTimes(1);
    });

    it('gets list of albums that are NOT shared', async () => {
      const owner = factory.userAdmin();
      const album = { ...factory.album({ ownerId: owner.id }), owner };
      mocks.album.getNotShared.mockResolvedValue([album]);
      mocks.album.getMetadataForIds.mockResolvedValue([
        {
          albumId: album.id,
          assetCount: 0,
          startDate: null,
          endDate: null,
          lastModifiedAssetTimestamp: null,
        },
      ]);

      const result = await sut.getAll(factory.auth({ user: owner }), { shared: false });
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(album.id);
      expect(mocks.album.getNotShared).toHaveBeenCalledTimes(1);
    });
  });

  it('counts assets correctly', async () => {
    const owner = factory.userAdmin();
    const asset = factory.asset({ ownerId: owner.id });
    const album = { ...factory.album({ ownerId: owner.id }), owner, assets: [asset] };
    mocks.album.getOwned.mockResolvedValue([album]);
    mocks.album.getMetadataForIds.mockResolvedValue([
      {
        albumId: album.id,
        assetCount: 1,
        startDate: new Date('1970-01-01'),
        endDate: new Date('1970-01-01'),
        lastModifiedAssetTimestamp: new Date('1970-01-01'),
      },
    ]);

    const result = await sut.getAll(factory.auth({ user: owner }), {});

    expect(result).toHaveLength(1);
    expect(result[0].assetCount).toEqual(1);
    expect(mocks.album.getOwned).toHaveBeenCalledTimes(1);
  });

  describe('create', () => {
    it('creates album', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const asset = { ...factory.asset({ ownerId: owner.id }), exifInfo: factory.exif() };
      const album = {
        ...factory.album({ ownerId: owner.id, albumName: 'Empty album' }),
        owner,
        assets: [asset],
        albumUsers: [{ user, role: AlbumUserRole.Editor }],
      };
      mocks.album.create.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue(user);
      mocks.user.getMetadata.mockResolvedValue([]);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));

      await sut.create(factory.auth({ user: owner }), {
        albumName: 'Empty album',
        albumUsers: [{ userId: user.id, role: AlbumUserRole.Editor }],
        description: 'Album description',
        assetIds: [asset.id],
      });

      expect(mocks.album.create).toHaveBeenCalledWith(
        {
          ownerId: owner.id,
          albumName: album.albumName,
          description: album.description,
          order: album.order,
          albumThumbnailAssetId: asset.id,
        },
        [asset.id],
        [{ userId: user.id, role: AlbumUserRole.Editor }],
      );

      expect(mocks.user.get).toHaveBeenCalledWith(user.id, {});
      expect(mocks.user.getMetadata).toHaveBeenCalledWith(owner.id);
      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(owner.id, new Set([asset.id]), false);
      expect(mocks.event.emit).toHaveBeenCalledWith('AlbumInvite', {
        id: album.id,
        userId: user.id,
      });
    });

    it('creates album with assetOrder from user preferences', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const asset = { ...factory.asset({ ownerId: owner.id }), exifInfo: factory.exif() };
      const album = {
        ...factory.album({ ownerId: owner.id, albumName: 'Empty album' }),
        owner,
        assets: [asset],
        albumUsers: [{ user, role: AlbumUserRole.Editor }],
      };
      mocks.album.create.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue(user);
      mocks.user.getMetadata.mockResolvedValue([
        {
          key: UserMetadataKey.Preferences,
          value: {
            albums: {
              defaultAssetOrder: AssetOrder.Asc,
            },
          },
        },
      ]);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));

      await sut.create(factory.auth({ user: owner }), {
        albumName: 'Empty album',
        albumUsers: [{ userId: user.id, role: AlbumUserRole.Editor }],
        description: 'Album description',
        assetIds: [asset.id],
      });

      expect(mocks.album.create).toHaveBeenCalledWith(
        {
          ownerId: owner.id,
          albumName: album.albumName,
          description: album.description,
          order: 'asc',
          albumThumbnailAssetId: asset.id,
        },
        [asset.id],
        [{ userId: user.id, role: AlbumUserRole.Editor }],
      );

      expect(mocks.user.get).toHaveBeenCalledWith(user.id, {});
      expect(mocks.user.getMetadata).toHaveBeenCalledWith(owner.id);
      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(owner.id, new Set([asset.id]), false);
      expect(mocks.event.emit).toHaveBeenCalledWith('AlbumInvite', {
        id: album.id,
        userId: user.id,
      });
    });

    it('should require valid userIds', async () => {
      mocks.user.get.mockResolvedValue(void 0);
      await expect(
        sut.create(factory.auth(), {
          albumName: 'Empty album',
          albumUsers: [{ userId: 'unknown-user', role: AlbumUserRole.Editor }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.user.get).toHaveBeenCalledWith('unknown-user', {});
      expect(mocks.album.create).not.toHaveBeenCalled();
    });

    it('should only add assets the user is allowed to access', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const asset = { ...factory.asset({ ownerId: owner.id }), exifInfo: factory.exif() };
      const album = {
        ...factory.album({ ownerId: owner.id, albumName: 'Test album' }),
        owner,
        assets: [asset],
        albumUsers: [{ user, role: AlbumUserRole.Editor }],
      };
      mocks.user.get.mockResolvedValue(user);
      mocks.album.create.mockResolvedValue(album);
      mocks.user.getMetadata.mockResolvedValue([]);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));

      await sut.create(factory.auth({ user: owner }), {
        albumName: 'Test album',
        description: 'Album description',
        assetIds: [asset.id, 'asset-2'],
      });

      expect(mocks.album.create).toHaveBeenCalledWith(
        {
          ownerId: owner.id,
          albumName: album.albumName,
          description: album.description,
          order: 'desc',
          albumThumbnailAssetId: asset.id,
        },
        [asset.id],
        [],
      );
      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(owner.id, new Set([asset.id, 'asset-2']), false);
    });

    it('should throw an error if the userId is the ownerId', async () => {
      const owner = factory.userAdmin();
      mocks.user.get.mockResolvedValue(owner);
      await expect(
        sut.create(factory.auth({ user: owner }), {
          albumName: 'Empty album',
          albumUsers: [{ userId: owner.id, role: AlbumUserRole.Editor }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.album.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should prevent updating an album that does not exist', async () => {
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set());
      mocks.album.getById.mockResolvedValue(void 0);

      await expect(
        sut.update(factory.auth(), 'invalid-id', {
          albumName: 'Album',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should prevent updating a not owned album (shared with auth user)', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const album = { ...factory.album({ ownerId: user.id }), user };
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set());
      await expect(
        sut.update(factory.auth({ user: owner }), album.id, {
          albumName: 'new album name',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should require a valid thumbnail asset id', async () => {
      const owner = factory.userAdmin();
      const album = { ...factory.album({ ownerId: owner.id }), owner };
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.album.getAssetIds.mockResolvedValue(new Set());

      await expect(
        sut.update(factory.auth({ user: owner }), album.id, {
          albumThumbnailAssetId: 'not-in-album',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.album.getAssetIds).toHaveBeenCalledWith(album.id, ['not-in-album']);
      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should allow the owner to update the album', async () => {
      const owner = factory.userAdmin();
      const album = { ...factory.album({ ownerId: owner.id }), owner };
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));

      mocks.album.getById.mockResolvedValue(album);
      mocks.album.update.mockResolvedValue(album);

      await sut.update(factory.auth({ user: owner }), album.id, {
        albumName: 'new album name',
      });

      expect(mocks.album.update).toHaveBeenCalledTimes(1);
      expect(mocks.album.update).toHaveBeenCalledWith(album.id, {
        id: album.id,
        albumName: 'new album name',
      });
    });
  });

  describe('delete', () => {
    it('should require permissions', async () => {
      const album = factory.album();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set());

      await expect(sut.delete(factory.auth(), album.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.album.delete).not.toHaveBeenCalled();
    });

    it('should not let a shared user delete the album', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const album = { ...factory.album({ ownerId: user.id }), owner: user };
      mocks.album.getById.mockResolvedValue(album);
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set());

      await expect(sut.delete(factory.auth({ user: owner }), album.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.album.delete).not.toHaveBeenCalled();
    });

    it('should let the owner delete an album', async () => {
      const owner = factory.userAdmin();
      const album = { ...factory.album({ ownerId: owner.id }), owner };
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);

      await sut.delete(factory.auth({ user: owner }), album.id);

      expect(mocks.album.delete).toHaveBeenCalledTimes(1);
      expect(mocks.album.delete).toHaveBeenCalledWith(album.id);
    });
  });

  describe('addUsers', () => {
    it('should throw an error if the auth user is not the owner', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const album = { ...factory.album({ ownerId: owner.id }), owner };
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set());
      await expect(
        sut.addUsers(factory.auth({ user }), album.id, { albumUsers: [{ userId: owner.id }] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should throw an error if the userId is already added', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const album = {
        ...factory.album({ ownerId: owner.id }),
        owner,
        albumUsers: [{ user, role: AlbumUserRole.Editor }],
      };
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);
      await expect(
        sut.addUsers(factory.auth({ user: owner }), album.id, { albumUsers: [{ userId: user.id }] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.album.update).not.toHaveBeenCalled();
      expect(mocks.user.get).not.toHaveBeenCalled();
    });

    it('should throw an error if the userId does not exist', async () => {
      const owner = factory.userAdmin();
      const album = {
        ...factory.album({ ownerId: owner.id }),
        owner,
      };
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue(void 0);
      await expect(
        sut.addUsers(factory.auth({ user: owner }), album.id, { albumUsers: [{ userId: 'unknown-user' }] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.album.update).not.toHaveBeenCalled();
      expect(mocks.user.get).toHaveBeenCalledWith('unknown-user', {});
    });

    it('should throw an error if the userId is the ownerId', async () => {
      const owner = factory.userAdmin();
      const album = {
        ...factory.album({ ownerId: owner.id }),
        owner,
      };
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);
      await expect(
        sut.addUsers(factory.auth({ user: owner }), album.id, {
          albumUsers: [{ userId: owner.id }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.album.update).not.toHaveBeenCalled();
      expect(mocks.user.get).not.toHaveBeenCalled();
    });

    it('should add valid shared users', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const album = {
        ...factory.album({ ownerId: owner.id }),
        owner,
      };
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.album.update.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue(user);
      mocks.albumUser.create.mockResolvedValue({
        userId: user.id,
        albumId: album.id,
        role: AlbumUserRole.Editor,
      });
      await sut.addUsers(factory.auth({ user: owner }), album.id, {
        albumUsers: [{ userId: user.id }],
      });
      expect(mocks.albumUser.create).toHaveBeenCalledWith({
        userId: user.id,
        albumId: album.id,
      });
      expect(mocks.event.emit).toHaveBeenCalledWith('AlbumInvite', {
        id: album.id,
        userId: user.id,
      });
    });
  });

  describe('removeUser', () => {
    it('should require a valid album id', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-1']));
      mocks.album.getById.mockResolvedValue(void 0);
      await expect(sut.removeUser(factory.auth(), 'album-1', 'user-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should remove a shared user from an owned album', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const album = {
        ...factory.album({ ownerId: owner.id }),
        owner,
        albumUsers: [{ user, role: AlbumUserRole.Editor }],
      };
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.albumUser.delete.mockResolvedValue();

      await expect(sut.removeUser(factory.auth({ user: owner }), album.id, user.id)).resolves.toBeUndefined();

      expect(mocks.albumUser.delete).toHaveBeenCalledTimes(1);
      expect(mocks.albumUser.delete).toHaveBeenCalledWith({
        albumId: album.id,
        userId: user.id,
      });
      expect(mocks.album.getById).toHaveBeenCalledWith(album.id, { withAssets: false });
    });

    it('should prevent removing a shared user from a not-owned album (shared with auth user)', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const user2 = factory.userAdmin();
      const album = {
        ...factory.album({ ownerId: user.id }),
        owner: user,
        albumUsers: [
          { user: owner, role: AlbumUserRole.Editor },
          { user: user2, role: AlbumUserRole.Editor },
        ],
      };
      mocks.album.getById.mockResolvedValue(album);

      await expect(sut.removeUser(factory.auth({ user: owner }), album.id, user2.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.albumUser.delete).not.toHaveBeenCalled();
      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(owner.id, new Set([album.id]));
    });

    it('should allow a shared user to remove themselves', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const album = {
        ...factory.album({ ownerId: user.id }),
        owner: user,
        albumUsers: [{ user: owner, role: AlbumUserRole.Editor }],
      };
      mocks.album.getById.mockResolvedValue(album);
      mocks.albumUser.delete.mockResolvedValue();

      await sut.removeUser(factory.auth({ user: owner }), album.id, owner.id);

      expect(mocks.albumUser.delete).toHaveBeenCalledTimes(1);
      expect(mocks.albumUser.delete).toHaveBeenCalledWith({
        albumId: album.id,
        userId: owner.id,
      });
    });

    it('should allow a shared user to remove themselves using "me"', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const album = {
        ...factory.album({ ownerId: owner.id }),
        owner,
        albumUsers: [{ user, role: AlbumUserRole.Editor }],
      };
      mocks.album.getById.mockResolvedValue(album);
      mocks.albumUser.delete.mockResolvedValue();

      await sut.removeUser(factory.auth({ user }), album.id, 'me');

      expect(mocks.albumUser.delete).toHaveBeenCalledTimes(1);
      expect(mocks.albumUser.delete).toHaveBeenCalledWith({
        albumId: album.id,
        userId: user.id,
      });
    });

    it('should not allow the owner to be removed', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const album = {
        ...factory.album({ ownerId: owner.id }),
        owner,
        albumUsers: [{ user, role: AlbumUserRole.Editor }],
      };
      mocks.album.getById.mockResolvedValue(album);

      await expect(sut.removeUser(factory.auth({ user: owner }), album.id, owner.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should throw an error for a user not in the album', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const album = {
        ...factory.album({ ownerId: owner.id }),
        owner,
        albumUsers: [{ user, role: AlbumUserRole.Editor }],
      };
      mocks.album.getById.mockResolvedValue(album);

      await expect(sut.removeUser(factory.auth({ user: owner }), album.id, 'user-3')).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.album.update).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user role', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const album = {
        ...factory.album({ ownerId: owner.id }),
        owner,
        albumUsers: [{ user, role: AlbumUserRole.Editor }],
      };
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.albumUser.update.mockResolvedValue();

      await sut.updateUser(factory.auth({ user: owner }), album.id, user.id, {
        role: AlbumUserRole.Viewer,
      });
      expect(mocks.albumUser.update).toHaveBeenCalledWith(
        { albumId: album.id, userId: user.id },
        { role: AlbumUserRole.Viewer },
      );
    });
  });

  describe('getAlbumInfo', () => {
    it('should get a shared album', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const album = {
        ...factory.album({ ownerId: owner.id }),
        owner,
        albumUsers: [{ user, role: AlbumUserRole.Editor }],
      };
      mocks.album.getById.mockResolvedValue(album);
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getMetadataForIds.mockResolvedValue([
        {
          albumId: album.id,
          assetCount: 1,
          startDate: new Date('1970-01-01'),
          endDate: new Date('1970-01-01'),
          lastModifiedAssetTimestamp: new Date('1970-01-01'),
        },
      ]);

      await sut.get(factory.auth({ user: owner }), album.id, {});

      expect(mocks.album.getById).toHaveBeenCalledWith(album.id, { withAssets: true });
      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(owner.id, new Set([album.id]));
    });

    it('should get a shared album via a shared link', async () => {
      const owner = factory.userAdmin();
      const user = factory.userAdmin();
      const album = {
        ...factory.album({ ownerId: owner.id }),
        owner,
        albumUsers: [{ user, role: AlbumUserRole.Editor }],
      };
      mocks.album.getById.mockResolvedValue(album);
      mocks.access.album.checkSharedLinkAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getMetadataForIds.mockResolvedValue([
        {
          albumId: album.id,
          assetCount: 1,
          startDate: new Date('1970-01-01'),
          endDate: new Date('1970-01-01'),
          lastModifiedAssetTimestamp: new Date('1970-01-01'),
        },
      ]);

      const auth = factory.auth({ sharedLink: {} });
      await sut.get(auth, album.id, {});

      expect(mocks.album.getById).toHaveBeenCalledWith(album.id, { withAssets: true });
      expect(mocks.access.album.checkSharedLinkAccess).toHaveBeenCalledWith(auth.sharedLink!.id, new Set([album.id]));
    });

    it('should get a shared album via shared with user', async () => {
      mocks.album.getById.mockResolvedValue(albumStub.oneAsset);
      mocks.access.album.checkSharedAlbumAccess.mockResolvedValue(new Set(['album-123']));
      mocks.album.getMetadataForIds.mockResolvedValue([
        {
          albumId: albumStub.oneAsset.id,
          assetCount: 1,
          startDate: new Date('1970-01-01'),
          endDate: new Date('1970-01-01'),
          lastModifiedAssetTimestamp: new Date('1970-01-01'),
        },
      ]);

      await sut.get(authStub.user1, 'album-123', {});

      expect(mocks.album.getById).toHaveBeenCalledWith('album-123', { withAssets: true });
      expect(mocks.access.album.checkSharedAlbumAccess).toHaveBeenCalledWith(
        authStub.user1.user.id,
        new Set(['album-123']),
        AlbumUserRole.Viewer,
      );
    });

    it('should throw an error for no access', async () => {
      await expect(sut.get(authStub.admin, 'album-123', {})).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['album-123']));
      expect(mocks.access.album.checkSharedAlbumAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set(['album-123']),
        AlbumUserRole.Viewer,
      );
    });
  });

  describe('addAssets', () => {
    it('should allow the owner to add assets', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-123']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2', 'asset-3']));
      mocks.album.getById.mockResolvedValue(_.cloneDeep(albumStub.oneAsset));
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssets(authStub.admin, 'album-123', { ids: ['asset-1', 'asset-2', 'asset-3'] }),
      ).resolves.toEqual([
        { success: true, id: 'asset-1' },
        { success: true, id: 'asset-2' },
        { success: true, id: 'asset-3' },
      ]);

      expect(mocks.album.update).toHaveBeenCalledWith('album-123', {
        id: 'album-123',
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: 'asset-1',
      });
      expect(mocks.album.addAssetIds).toHaveBeenCalledWith('album-123', ['asset-1', 'asset-2', 'asset-3']);
    });

    it('should not set the thumbnail if the album has one already', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-123']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      mocks.album.getById.mockResolvedValue(_.cloneDeep({ ...albumStub.empty, albumThumbnailAssetId: 'asset-id' }));
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set());

      await expect(sut.addAssets(authStub.admin, 'album-123', { ids: ['asset-1'] })).resolves.toEqual([
        { success: true, id: 'asset-1' },
      ]);

      expect(mocks.album.update).toHaveBeenCalledWith('album-123', {
        id: 'album-123',
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: 'asset-id',
      });
      expect(mocks.album.addAssetIds).toHaveBeenCalled();
    });

    it('should allow a shared user to add assets', async () => {
      mocks.access.album.checkSharedAlbumAccess.mockResolvedValue(new Set(['album-123']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2', 'asset-3']));
      mocks.album.getById.mockResolvedValue(_.cloneDeep(albumStub.sharedWithUser));
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssets(authStub.user1, 'album-123', { ids: ['asset-1', 'asset-2', 'asset-3'] }),
      ).resolves.toEqual([
        { success: true, id: 'asset-1' },
        { success: true, id: 'asset-2' },
        { success: true, id: 'asset-3' },
      ]);

      expect(mocks.album.update).toHaveBeenCalledWith('album-123', {
        id: 'album-123',
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: 'asset-1',
      });
      expect(mocks.album.addAssetIds).toHaveBeenCalledWith('album-123', ['asset-1', 'asset-2', 'asset-3']);
      expect(mocks.event.emit).toHaveBeenCalledWith('AlbumUpdate', {
        id: 'album-123',
        recipientId: 'admin_id',
      });
    });

    it('should not allow a shared user with viewer access to add assets', async () => {
      mocks.access.album.checkSharedAlbumAccess.mockResolvedValue(new Set());
      mocks.album.getById.mockResolvedValue(_.cloneDeep(albumStub.sharedWithUser));

      await expect(
        sut.addAssets(authStub.user2, 'album-123', { ids: ['asset-1', 'asset-2', 'asset-3'] }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should allow a shared link user to add assets', async () => {
      mocks.access.album.checkSharedLinkAccess.mockResolvedValue(new Set(['album-123']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2', 'asset-3']));
      mocks.album.getById.mockResolvedValue(_.cloneDeep(albumStub.oneAsset));
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssets(authStub.adminSharedLink, 'album-123', { ids: ['asset-1', 'asset-2', 'asset-3'] }),
      ).resolves.toEqual([
        { success: true, id: 'asset-1' },
        { success: true, id: 'asset-2' },
        { success: true, id: 'asset-3' },
      ]);

      expect(mocks.album.update).toHaveBeenCalledWith('album-123', {
        id: 'album-123',
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: 'asset-1',
      });
      expect(mocks.album.addAssetIds).toHaveBeenCalledWith('album-123', ['asset-1', 'asset-2', 'asset-3']);

      expect(mocks.access.album.checkSharedLinkAccess).toHaveBeenCalledWith(
        authStub.adminSharedLink.sharedLink?.id,
        new Set(['album-123']),
      );
    });

    it('should allow adding assets shared via partner sharing', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-123']));
      mocks.access.asset.checkPartnerAccess.mockResolvedValue(new Set(['asset-1']));
      mocks.album.getById.mockResolvedValue(_.cloneDeep(albumStub.oneAsset));
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set());

      await expect(sut.addAssets(authStub.admin, 'album-123', { ids: ['asset-1'] })).resolves.toEqual([
        { success: true, id: 'asset-1' },
      ]);

      expect(mocks.album.update).toHaveBeenCalledWith('album-123', {
        id: 'album-123',
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: 'asset-1',
      });
      expect(mocks.access.asset.checkPartnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['asset-1']));
    });

    it('should skip duplicate assets', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-123']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-id']));
      mocks.album.getById.mockResolvedValue(_.cloneDeep(albumStub.oneAsset));
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set(['asset-id']));

      await expect(sut.addAssets(authStub.admin, 'album-123', { ids: ['asset-id'] })).resolves.toEqual([
        { success: false, id: 'asset-id', error: BulkIdErrorReason.DUPLICATE },
      ]);

      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should skip assets not shared with user', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-123']));
      mocks.album.getById.mockResolvedValue(albumStub.oneAsset);
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set());

      await expect(sut.addAssets(authStub.admin, 'album-123', { ids: ['asset-1'] })).resolves.toEqual([
        { success: false, id: 'asset-1', error: BulkIdErrorReason.NO_PERMISSION },
      ]);

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set(['asset-1']),
        false,
      );
      expect(mocks.access.asset.checkPartnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['asset-1']));
    });

    it('should not allow unauthorized access to the album', async () => {
      mocks.album.getById.mockResolvedValue(albumStub.oneAsset);

      await expect(
        sut.addAssets(authStub.admin, 'album-123', { ids: ['asset-1', 'asset-2', 'asset-3'] }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalled();
      expect(mocks.access.album.checkSharedAlbumAccess).toHaveBeenCalled();
    });

    it('should not allow unauthorized shared link access to the album', async () => {
      mocks.album.getById.mockResolvedValue(albumStub.oneAsset);

      await expect(
        sut.addAssets(authStub.adminSharedLink, 'album-123', { ids: ['asset-1', 'asset-2', 'asset-3'] }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.access.album.checkSharedLinkAccess).toHaveBeenCalled();
    });
  });

  describe('addAssetsToAlbums', () => {
    it('should allow the owner to add assets', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValueOnce(new Set(['album-123', 'album-321']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2', 'asset-3']));
      mocks.album.getById
        .mockResolvedValueOnce(_.cloneDeep(albumStub.empty))
        .mockResolvedValueOnce(_.cloneDeep(albumStub.oneAsset));
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssetsToAlbums(authStub.admin, {
          albumIds: ['album-123', 'album-321'],
          assetIds: ['asset-1', 'asset-2', 'asset-3'],
        }),
      ).resolves.toEqual({ success: true, error: undefined });

      expect(mocks.album.update).toHaveBeenCalledTimes(2);
      expect(mocks.album.update).toHaveBeenNthCalledWith(1, 'album-123', {
        id: 'album-123',
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: 'asset-1',
      });
      expect(mocks.album.update).toHaveBeenNthCalledWith(2, 'album-321', {
        id: 'album-321',
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: 'asset-1',
      });
      expect(mocks.album.addAssetIdsToAlbums).toHaveBeenCalledWith([
        { albumId: 'album-123', assetId: 'asset-1' },
        { albumId: 'album-123', assetId: 'asset-2' },
        { albumId: 'album-123', assetId: 'asset-3' },
        { albumId: 'album-321', assetId: 'asset-1' },
        { albumId: 'album-321', assetId: 'asset-2' },
        { albumId: 'album-321', assetId: 'asset-3' },
      ]);
    });

    it('should not set the thumbnail if the album has one already', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValueOnce(new Set(['album-123', 'album-321']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2', 'asset-3']));
      mocks.album.getById
        .mockResolvedValueOnce(_.cloneDeep({ ...albumStub.empty, albumThumbnailAssetId: 'asset-id' }))
        .mockResolvedValueOnce(_.cloneDeep({ ...albumStub.oneAsset, albumThumbnailAssetId: 'asset-id' }));
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssetsToAlbums(authStub.admin, {
          albumIds: ['album-123', 'album-321'],
          assetIds: ['asset-1', 'asset-2', 'asset-3'],
        }),
      ).resolves.toEqual({ success: true, error: undefined });

      expect(mocks.album.update).toHaveBeenCalledTimes(2);
      expect(mocks.album.update).toHaveBeenNthCalledWith(1, 'album-123', {
        id: 'album-123',
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: 'asset-id',
      });
      expect(mocks.album.update).toHaveBeenNthCalledWith(2, 'album-321', {
        id: 'album-321',
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: 'asset-id',
      });
      expect(mocks.album.addAssetIdsToAlbums).toHaveBeenCalledWith([
        { albumId: 'album-123', assetId: 'asset-1' },
        { albumId: 'album-123', assetId: 'asset-2' },
        { albumId: 'album-123', assetId: 'asset-3' },
        { albumId: 'album-321', assetId: 'asset-1' },
        { albumId: 'album-321', assetId: 'asset-2' },
        { albumId: 'album-321', assetId: 'asset-3' },
      ]);
    });

    it('should allow a shared user to add assets', async () => {
      mocks.access.album.checkSharedAlbumAccess.mockResolvedValueOnce(new Set(['album-123', 'album-321']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2', 'asset-3']));
      mocks.album.getById
        .mockResolvedValueOnce(_.cloneDeep(albumStub.sharedWithUser))
        .mockResolvedValueOnce(_.cloneDeep(albumStub.sharedWithMultiple));
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssetsToAlbums(authStub.user1, {
          albumIds: ['album-123', 'album-321'],
          assetIds: ['asset-1', 'asset-2', 'asset-3'],
        }),
      ).resolves.toEqual({ success: true, error: undefined });

      expect(mocks.album.update).toHaveBeenCalledTimes(2);
      expect(mocks.album.update).toHaveBeenNthCalledWith(1, 'album-123', {
        id: 'album-123',
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: 'asset-1',
      });
      expect(mocks.album.update).toHaveBeenNthCalledWith(2, 'album-321', {
        id: 'album-321',
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: 'asset-1',
      });
      expect(mocks.album.addAssetIdsToAlbums).toHaveBeenCalledWith([
        { albumId: 'album-123', assetId: 'asset-1' },
        { albumId: 'album-123', assetId: 'asset-2' },
        { albumId: 'album-123', assetId: 'asset-3' },
        { albumId: 'album-321', assetId: 'asset-1' },
        { albumId: 'album-321', assetId: 'asset-2' },
        { albumId: 'album-321', assetId: 'asset-3' },
      ]);
      expect(mocks.event.emit).toHaveBeenCalledWith('AlbumUpdate', {
        id: 'album-123',
        recipientId: 'admin_id',
      });
      expect(mocks.event.emit).toHaveBeenCalledWith('AlbumUpdate', {
        id: 'album-321',
        recipientId: 'admin_id',
      });
    });

    it('should not allow a shared user with viewer access to add assets', async () => {
      mocks.access.album.checkSharedAlbumAccess.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2', 'asset-3']));
      mocks.album.getById
        .mockResolvedValueOnce(_.cloneDeep(albumStub.sharedWithUser))
        .mockResolvedValueOnce(_.cloneDeep(albumStub.sharedWithAdmin));
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssetsToAlbums(authStub.user2, {
          albumIds: ['album-123', 'album-321'],
          assetIds: ['asset-1', 'asset-2', 'asset-3'],
        }),
      ).resolves.toEqual({
        success: false,
        error: BulkIdErrorReason.NO_PERMISSION,
      });

      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should not allow a shared link user to add assets to multiple albums', async () => {
      mocks.access.album.checkSharedLinkAccess.mockResolvedValueOnce(new Set(['album-123']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2', 'asset-3']));
      mocks.album.getById
        .mockResolvedValueOnce(_.cloneDeep(albumStub.sharedWithUser))
        .mockResolvedValueOnce(_.cloneDeep(albumStub.sharedWithMultiple));
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssetsToAlbums(authStub.adminSharedLink, {
          albumIds: ['album-123', 'album-321'],
          assetIds: ['asset-1', 'asset-2', 'asset-3'],
        }),
      ).resolves.toEqual({ success: true, error: undefined });

      expect(mocks.album.update).toHaveBeenCalledTimes(1);
      expect(mocks.album.update).toHaveBeenNthCalledWith(1, 'album-123', {
        id: 'album-123',
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: 'asset-1',
      });
      expect(mocks.album.addAssetIdsToAlbums).toHaveBeenCalledWith([
        { albumId: 'album-123', assetId: 'asset-1' },
        { albumId: 'album-123', assetId: 'asset-2' },
        { albumId: 'album-123', assetId: 'asset-3' },
      ]);
      expect(mocks.event.emit).toHaveBeenCalledWith('AlbumUpdate', {
        id: 'album-123',
        recipientId: 'user-id',
      });
      expect(mocks.access.album.checkSharedLinkAccess).toHaveBeenCalledWith(
        authStub.adminSharedLink.sharedLink?.id,
        new Set(['album-123', 'album-321']),
      );
    });

    it('should allow adding assets shared via partner sharing', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValueOnce(new Set(['album-123', 'album-321']));
      mocks.access.asset.checkPartnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2', 'asset-3']));
      mocks.album.getById
        .mockResolvedValueOnce(_.cloneDeep(albumStub.empty))
        .mockResolvedValueOnce(_.cloneDeep(albumStub.oneAsset));
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssetsToAlbums(authStub.admin, {
          albumIds: ['album-123', 'album-321'],
          assetIds: ['asset-1', 'asset-2', 'asset-3'],
        }),
      ).resolves.toEqual({ success: true, error: undefined });

      expect(mocks.album.update).toHaveBeenCalledTimes(2);
      expect(mocks.album.update).toHaveBeenNthCalledWith(1, 'album-123', {
        id: 'album-123',
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: 'asset-1',
      });
      expect(mocks.album.update).toHaveBeenNthCalledWith(2, 'album-321', {
        id: 'album-321',
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: 'asset-1',
      });
      expect(mocks.album.addAssetIdsToAlbums).toHaveBeenCalledWith([
        { albumId: 'album-123', assetId: 'asset-1' },
        { albumId: 'album-123', assetId: 'asset-2' },
        { albumId: 'album-123', assetId: 'asset-3' },
        { albumId: 'album-321', assetId: 'asset-1' },
        { albumId: 'album-321', assetId: 'asset-2' },
        { albumId: 'album-321', assetId: 'asset-3' },
      ]);
      expect(mocks.access.asset.checkPartnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set(['asset-1', 'asset-2', 'asset-3']),
      );
    });

    it('should skip some duplicate assets', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValueOnce(new Set(['album-123', 'album-321']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2', 'asset-3']));
      mocks.album.getAssetIds
        .mockResolvedValueOnce(new Set(['asset-1', 'asset-2', 'asset-3']))
        .mockResolvedValueOnce(new Set());
      mocks.album.getById
        .mockResolvedValueOnce(_.cloneDeep(albumStub.empty))
        .mockResolvedValueOnce(_.cloneDeep(albumStub.oneAsset));

      await expect(
        sut.addAssetsToAlbums(authStub.admin, {
          albumIds: ['album-123', 'album-321'],
          assetIds: ['asset-1', 'asset-2', 'asset-3'],
        }),
      ).resolves.toEqual({ success: true, error: undefined });

      expect(mocks.album.update).toHaveBeenCalledTimes(1);
      expect(mocks.album.update).toHaveBeenNthCalledWith(1, 'album-321', {
        id: 'album-321',
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: 'asset-1',
      });
      expect(mocks.album.addAssetIdsToAlbums).toHaveBeenCalledWith([
        { albumId: 'album-321', assetId: 'asset-1' },
        { albumId: 'album-321', assetId: 'asset-2' },
        { albumId: 'album-321', assetId: 'asset-3' },
      ]);
    });

    it('should skip all duplicate assets', async () => {
      mocks.access.album.checkOwnerAccess
        .mockResolvedValueOnce(new Set(['album-123']))
        .mockResolvedValueOnce(new Set(['album-321']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));
      mocks.album.getById
        .mockResolvedValueOnce(_.cloneDeep(albumStub.empty))
        .mockResolvedValueOnce(_.cloneDeep(albumStub.oneAsset));
      mocks.album.getAssetIds.mockResolvedValue(new Set(['asset-1', 'asset-2']));

      await expect(
        sut.addAssetsToAlbums(authStub.admin, {
          albumIds: ['album-123', 'album-321'],
          assetIds: ['asset-1', 'asset-2'],
        }),
      ).resolves.toEqual({
        success: false,
        error: BulkIdErrorReason.DUPLICATE,
      });

      expect(mocks.album.update).not.toHaveBeenCalled();
      expect(mocks.album.addAssetIds).not.toHaveBeenCalled();
    });

    it('should skip assets not shared with user', async () => {
      mocks.access.album.checkSharedAlbumAccess
        .mockResolvedValueOnce(new Set(['album-123']))
        .mockResolvedValueOnce(new Set(['album-321']));
      mocks.album.getById
        .mockResolvedValueOnce(_.cloneDeep(albumStub.sharedWithUser))
        .mockResolvedValueOnce(_.cloneDeep(albumStub.sharedWithMultiple));
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssetsToAlbums(authStub.admin, {
          albumIds: ['album-123', 'album-321'],
          assetIds: ['asset-1', 'asset-2', 'asset-3'],
        }),
      ).resolves.toEqual({
        success: false,
        error: BulkIdErrorReason.NO_PERMISSION,
      });

      expect(mocks.album.update).not.toHaveBeenCalled();
      expect(mocks.album.addAssetIds).not.toHaveBeenCalled();
      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set(['asset-1', 'asset-2', 'asset-3']),
        false,
      );
      expect(mocks.access.asset.checkPartnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set(['asset-1', 'asset-2', 'asset-3']),
      );
    });

    it('should not allow unauthorized access to the albums', async () => {
      mocks.album.getById
        .mockResolvedValueOnce(_.cloneDeep(albumStub.sharedWithUser))
        .mockResolvedValueOnce(_.cloneDeep(albumStub.sharedWithMultiple));

      await expect(
        sut.addAssetsToAlbums(authStub.admin, {
          albumIds: ['album-123', 'album-321'],
          assetIds: ['asset-1', 'asset-2', 'asset-3'],
        }),
      ).resolves.toEqual({
        success: false,
        error: BulkIdErrorReason.NO_PERMISSION,
      });

      expect(mocks.album.update).not.toHaveBeenCalled();
      expect(mocks.album.addAssetIds).not.toHaveBeenCalled();
      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalled();
      expect(mocks.access.album.checkSharedAlbumAccess).toHaveBeenCalled();
    });

    it('should not allow unauthorized shared link access to the album', async () => {
      mocks.album.getById
        .mockResolvedValueOnce(_.cloneDeep(albumStub.empty))
        .mockResolvedValueOnce(_.cloneDeep(albumStub.oneAsset));

      await expect(
        sut.addAssetsToAlbums(authStub.adminSharedLink, {
          albumIds: ['album-123', 'album-321'],
          assetIds: ['asset-1', 'asset-2', 'asset-3'],
        }),
      ).resolves.toEqual({
        success: false,
        error: BulkIdErrorReason.NO_PERMISSION,
      });

      expect(mocks.access.album.checkSharedLinkAccess).toHaveBeenCalled();
    });
  });

  describe('removeAssets', () => {
    it('should allow the owner to remove assets', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-123']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-id']));
      mocks.album.getById.mockResolvedValue(_.cloneDeep(albumStub.oneAsset));
      mocks.album.getAssetIds.mockResolvedValue(new Set(['asset-id']));

      await expect(sut.removeAssets(authStub.admin, 'album-123', { ids: ['asset-id'] })).resolves.toEqual([
        { success: true, id: 'asset-id' },
      ]);

      expect(mocks.album.removeAssetIds).toHaveBeenCalledWith('album-123', ['asset-id']);
    });

    it('should skip assets not in the album', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-123']));
      mocks.album.getById.mockResolvedValue(_.cloneDeep(albumStub.empty));
      mocks.album.getAssetIds.mockResolvedValue(new Set());

      await expect(sut.removeAssets(authStub.admin, 'album-123', { ids: ['asset-id'] })).resolves.toEqual([
        { success: false, id: 'asset-id', error: BulkIdErrorReason.NOT_FOUND },
      ]);

      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should allow owner to remove all assets from the album', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-123']));
      mocks.album.getById.mockResolvedValue(_.cloneDeep(albumStub.oneAsset));
      mocks.album.getAssetIds.mockResolvedValue(new Set(['asset-id']));

      await expect(sut.removeAssets(authStub.admin, 'album-123', { ids: ['asset-id'] })).resolves.toEqual([
        { success: true, id: 'asset-id' },
      ]);
    });

    it('should reset the thumbnail if it is removed', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-123']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-id']));
      mocks.album.getById.mockResolvedValue(_.cloneDeep(albumStub.twoAssets));
      mocks.album.getAssetIds.mockResolvedValue(new Set(['asset-id']));

      await expect(sut.removeAssets(authStub.admin, 'album-123', { ids: ['asset-id'] })).resolves.toEqual([
        { success: true, id: 'asset-id' },
      ]);

      expect(mocks.album.updateThumbnails).toHaveBeenCalled();
    });
  });

  // // it('removes assets from shared album (shared with auth user)', async () => {
  // //   const albumEntity = _getOwnedSharedAlbum();
  // //   albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
  // //   albumRepositoryMock.removeAssets.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));

  // //   await expect(
  // //     sut.removeAssetsFromAlbum(
  // //       auth,
  // //       {
  // //         ids: ['1'],
  // //       },
  // //       albumEntity.id,
  // //     ),
  // //   ).resolves.toBeUndefined();
  // //   expect(albumRepositoryMock.removeAssets).toHaveBeenCalledTimes(1);
  // //   expect(albumRepositoryMock.removeAssets).toHaveBeenCalledWith(albumEntity, {
  // //     ids: ['1'],
  // //   });
  // // });

  // it('prevents removing assets from a not owned / shared album', async () => {
  //   const albumEntity = _getNotOwnedNotSharedAlbum();

  //   const albumResponse: AddAssetsResponseDto = {
  //     alreadyInAlbum: [],
  //     successfullyAdded: 1,
  //   };

  //   const albumId = albumEntity.id;

  //   albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
  //   albumRepositoryMock.addAssets.mockImplementation(() => Promise.resolve<AddAssetsResponseDto>(albumResponse));

  //   await expect(sut.removeAssets(auth, albumId, { ids: ['1'] })).rejects.toBeInstanceOf(ForbiddenException);
  // });
});

import { BadRequestException } from '@nestjs/common';
import _ from 'lodash';
import { BulkIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { AlbumUserRole, AssetOrder, UserMetadataKey } from 'src/enum';
import { AlbumService } from 'src/services/album.service';
import { AlbumUserFactory } from 'test/factories/album-user.factory';
import { AlbumFactory } from 'test/factories/album.factory';
import { AssetFactory } from 'test/factories/asset.factory';
import { AuthFactory } from 'test/factories/auth.factory';
import { UserFactory } from 'test/factories/user.factory';
import { authStub } from 'test/fixtures/auth.stub';
import { newUuid } from 'test/small.factory';
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
      const album = AlbumFactory.from().albumUser().build();
      const sharedWithUserAlbum = AlbumFactory.from().owner(album.owner).albumUser().build();
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

      const result = await sut.getAll(AuthFactory.create(album.owner), {});
      expect(result).toHaveLength(2);
      expect(result[0].id).toEqual(album.id);
      expect(result[1].id).toEqual(sharedWithUserAlbum.id);
    });

    it('gets list of albums that have a specific asset', async () => {
      const album = AlbumFactory.from().owner({ isAdmin: true }).albumUser().asset().asset().build();
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

      const result = await sut.getAll(AuthFactory.create(album.owner), { assetId: album.assets[0].id });
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(album.id);
      expect(mocks.album.getByAssetId).toHaveBeenCalledTimes(1);
    });

    it('gets list of albums that are shared', async () => {
      const album = AlbumFactory.from().albumUser().build();
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

      const result = await sut.getAll(AuthFactory.create(album.owner), { shared: true });
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(album.id);
      expect(mocks.album.getShared).toHaveBeenCalledTimes(1);
    });

    it('gets list of albums that are NOT shared', async () => {
      const album = AlbumFactory.create();
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

      const result = await sut.getAll(AuthFactory.create(album.owner), { shared: false });
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(album.id);
      expect(mocks.album.getNotShared).toHaveBeenCalledTimes(1);
    });
  });

  it('counts assets correctly', async () => {
    const album = AlbumFactory.create();
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

    const result = await sut.getAll(AuthFactory.create(album.owner), {});
    expect(result).toHaveLength(1);
    expect(result[0].assetCount).toEqual(1);
    expect(mocks.album.getOwned).toHaveBeenCalledTimes(1);
  });

  describe('create', () => {
    it('creates album', async () => {
      const assetId = newUuid();
      const albumUser = { userId: newUuid(), role: AlbumUserRole.Editor };
      const album = AlbumFactory.from({ albumName: 'test', description: 'description' })
        .asset({ id: assetId }, (asset) => asset.exif())
        .albumUser(albumUser)
        .build();

      mocks.album.create.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue(UserFactory.create(album.albumUsers[0].user));
      mocks.user.getMetadata.mockResolvedValue([]);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));

      await sut.create(AuthFactory.create(album.owner), {
        albumName: 'test',
        albumUsers: [albumUser],
        description: 'description',
        assetIds: [assetId],
      });

      expect(mocks.album.create).toHaveBeenCalledWith(
        {
          ownerId: album.owner.id,
          albumName: 'test',
          description: 'description',
          order: album.order,
          albumThumbnailAssetId: assetId,
        },
        [assetId],
        [{ userId: albumUser.userId, role: AlbumUserRole.Editor }],
      );

      expect(mocks.user.get).toHaveBeenCalledWith(albumUser.userId, {});
      expect(mocks.user.getMetadata).toHaveBeenCalledWith(album.owner.id);
      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(album.owner.id, new Set([assetId]), false);
      expect(mocks.event.emit).toHaveBeenCalledWith('AlbumInvite', { id: album.id, userId: albumUser.userId });
    });

    it('creates album with assetOrder from user preferences', async () => {
      const assetId = newUuid();
      const albumUser = { userId: newUuid(), role: AlbumUserRole.Editor };
      const album = AlbumFactory.from()
        .asset({ id: assetId }, (asset) => asset.exif())
        .albumUser(albumUser)
        .build();
      mocks.album.create.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue(album.albumUsers[0].user);
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
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));

      await sut.create(AuthFactory.create(album.owner), {
        albumName: album.albumName,
        albumUsers: [albumUser],
        description: album.description,
        assetIds: [assetId],
      });

      expect(mocks.album.create).toHaveBeenCalledWith(
        {
          ownerId: album.owner.id,
          albumName: album.albumName,
          description: album.description,
          order: 'asc',
          albumThumbnailAssetId: assetId,
        },
        [assetId],
        [albumUser],
      );

      expect(mocks.user.get).toHaveBeenCalledWith(albumUser.userId, {});
      expect(mocks.user.getMetadata).toHaveBeenCalledWith(album.owner.id);
      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(album.owner.id, new Set([assetId]), false);
      expect(mocks.event.emit).toHaveBeenCalledWith('AlbumInvite', { id: album.id, userId: albumUser.userId });
    });

    it('should require valid userIds', async () => {
      mocks.user.get.mockResolvedValue(void 0);
      await expect(
        sut.create(AuthFactory.create(), {
          albumName: 'Empty album',
          albumUsers: [{ userId: 'unknown-user', role: AlbumUserRole.Editor }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.user.get).toHaveBeenCalledWith('unknown-user', {});
      expect(mocks.album.create).not.toHaveBeenCalled();
    });

    it('should only add assets the user is allowed to access', async () => {
      const assetId = newUuid();
      const album = AlbumFactory.from()
        .asset({ id: assetId }, (asset) => asset.exif())
        .albumUser()
        .build();
      mocks.user.get.mockResolvedValue(album.albumUsers[0].user);
      mocks.album.create.mockResolvedValue(album);
      mocks.user.getMetadata.mockResolvedValue([]);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));

      await sut.create(AuthFactory.create(album.owner), {
        albumName: album.albumName,
        description: album.description,
        assetIds: [assetId, 'asset-2'],
      });

      expect(mocks.album.create).toHaveBeenCalledWith(
        {
          ownerId: album.owner.id,
          albumName: album.albumName,
          description: album.description,
          order: 'desc',
          albumThumbnailAssetId: assetId,
        },
        [assetId],
        [],
      );
      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(
        album.owner.id,
        new Set([assetId, 'asset-2']),
        false,
      );
    });

    it('should throw an error if the userId is the ownerId', async () => {
      const album = AlbumFactory.create();
      mocks.user.get.mockResolvedValue(album.owner);
      await expect(
        sut.create(AuthFactory.create(album.owner), {
          albumName: 'Empty album',
          albumUsers: [{ userId: album.owner.id, role: AlbumUserRole.Editor }],
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
        sut.update(AuthFactory.create(), 'invalid-id', {
          albumName: 'Album',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should prevent updating a not owned album (shared with auth user)', async () => {
      const album = AlbumFactory.from().albumUser().build();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set());
      await expect(
        sut.update(AuthFactory.create(album.owner), album.id, { albumName: 'new album name' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should require a valid thumbnail asset id', async () => {
      const album = AlbumFactory.create();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.album.getAssetIds.mockResolvedValue(new Set());

      await expect(
        sut.update(AuthFactory.create(album.owner), album.id, { albumThumbnailAssetId: 'not-in-album' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.album.getAssetIds).toHaveBeenCalledWith(album.id, ['not-in-album']);
      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should allow the owner to update the album', async () => {
      const album = AlbumFactory.create();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.album.update.mockResolvedValue(album);

      await sut.update(AuthFactory.create(album.owner), album.id, { albumName: 'new album name' });

      expect(mocks.album.update).toHaveBeenCalledTimes(1);
      expect(mocks.album.update).toHaveBeenCalledWith(album.id, { id: album.id, albumName: 'new album name' });
    });
  });

  describe('delete', () => {
    it('should require permissions', async () => {
      const album = AlbumFactory.create();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set());

      await expect(sut.delete(AuthFactory.create(album.owner), album.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.album.delete).not.toHaveBeenCalled();
    });

    it('should not let a shared user delete the album', async () => {
      const album = AlbumFactory.create();
      mocks.album.getById.mockResolvedValue(album);
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set());

      await expect(sut.delete(AuthFactory.create(album.owner), album.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.album.delete).not.toHaveBeenCalled();
    });

    it('should let the owner delete an album', async () => {
      const album = AlbumFactory.create();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);

      await sut.delete(AuthFactory.create(album.owner), album.id);

      expect(mocks.album.delete).toHaveBeenCalledTimes(1);
      expect(mocks.album.delete).toHaveBeenCalledWith(album.id);
    });
  });

  describe('addUsers', () => {
    it('should throw an error if the auth user is not the owner', async () => {
      const album = AlbumFactory.create();
      const user = UserFactory.create();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set());
      await expect(
        sut.addUsers(AuthFactory.create(user), album.id, { albumUsers: [{ userId: newUuid() }] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should throw an error if the userId is already added', async () => {
      const userId = newUuid();
      const album = AlbumFactory.from().albumUser({ userId }).build();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);
      await expect(
        sut.addUsers(AuthFactory.create(album.owner), album.id, { albumUsers: [{ userId }] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.album.update).not.toHaveBeenCalled();
      expect(mocks.user.get).not.toHaveBeenCalled();
    });

    it('should throw an error if the userId does not exist', async () => {
      const album = AlbumFactory.create();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue(void 0);
      await expect(
        sut.addUsers(AuthFactory.create(album.owner), album.id, { albumUsers: [{ userId: 'unknown-user' }] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.album.update).not.toHaveBeenCalled();
      expect(mocks.user.get).toHaveBeenCalledWith('unknown-user', {});
    });

    it('should throw an error if the userId is the ownerId', async () => {
      const album = AlbumFactory.create();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);
      await expect(
        sut.addUsers(AuthFactory.create(album.owner), album.id, {
          albumUsers: [{ userId: album.owner.id }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.album.update).not.toHaveBeenCalled();
      expect(mocks.user.get).not.toHaveBeenCalled();
    });

    it('should add valid shared users', async () => {
      const album = AlbumFactory.create();
      const user = UserFactory.create();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.album.update.mockResolvedValue(album);
      mocks.user.get.mockResolvedValue(user);
      mocks.albumUser.create.mockResolvedValue(AlbumUserFactory.from().album(album).user(user).build());

      await sut.addUsers(AuthFactory.create(album.owner), album.id, { albumUsers: [{ userId: user.id }] });

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
      await expect(sut.removeUser(AuthFactory.create(), 'album-1', 'user-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should remove a shared user from an owned album', async () => {
      const userId = newUuid();
      const album = AlbumFactory.from().albumUser({ userId }).build();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.albumUser.delete.mockResolvedValue();

      await expect(sut.removeUser(AuthFactory.create(album.owner), album.id, userId)).resolves.toBeUndefined();

      expect(mocks.albumUser.delete).toHaveBeenCalledTimes(1);
      expect(mocks.albumUser.delete).toHaveBeenCalledWith({ albumId: album.id, userId });
      expect(mocks.album.getById).toHaveBeenCalledWith(album.id, { withAssets: false });
    });

    it('should prevent removing a shared user from a not-owned album (shared with auth user)', async () => {
      const user1 = UserFactory.create();
      const user2 = UserFactory.create();
      const album = AlbumFactory.from().albumUser({ userId: user1.id }).albumUser({ userId: user2.id }).build();
      mocks.album.getById.mockResolvedValue(album);

      await expect(sut.removeUser(AuthFactory.create(user1), album.id, user2.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.albumUser.delete).not.toHaveBeenCalled();
      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(user1.id, new Set([album.id]));
    });

    it('should allow a shared user to remove themselves', async () => {
      const user1 = UserFactory.create();
      const album = AlbumFactory.from().albumUser({ userId: user1.id }).build();
      mocks.album.getById.mockResolvedValue(album);
      mocks.albumUser.delete.mockResolvedValue();

      await sut.removeUser(AuthFactory.create(user1), album.id, user1.id);

      expect(mocks.albumUser.delete).toHaveBeenCalledTimes(1);
      expect(mocks.albumUser.delete).toHaveBeenCalledWith({ albumId: album.id, userId: user1.id });
    });

    it('should allow a shared user to remove themselves using "me"', async () => {
      const user = UserFactory.create();
      const album = AlbumFactory.from().albumUser({ userId: user.id }).build();
      mocks.album.getById.mockResolvedValue(album);
      mocks.albumUser.delete.mockResolvedValue();

      await sut.removeUser(AuthFactory.create(user), album.id, 'me');

      expect(mocks.albumUser.delete).toHaveBeenCalledTimes(1);
      expect(mocks.albumUser.delete).toHaveBeenCalledWith({ albumId: album.id, userId: user.id });
    });

    it('should not allow the owner to be removed', async () => {
      const album = AlbumFactory.from().albumUser().build();
      mocks.album.getById.mockResolvedValue(album);

      await expect(sut.removeUser(AuthFactory.create(album.owner), album.id, album.owner.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should throw an error for a user not in the album', async () => {
      const album = AlbumFactory.from().albumUser().build();
      mocks.album.getById.mockResolvedValue(album);

      await expect(sut.removeUser(AuthFactory.create(album.owner), album.id, 'user-3')).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.album.update).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user role', async () => {
      const user = UserFactory.create();
      const album = AlbumFactory.from().albumUser({ userId: user.id }).build();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.albumUser.update.mockResolvedValue();

      await sut.updateUser(AuthFactory.create(album.owner), album.id, user.id, { role: AlbumUserRole.Viewer });

      expect(mocks.albumUser.update).toHaveBeenCalledWith(
        { albumId: album.id, userId: user.id },
        { role: AlbumUserRole.Viewer },
      );
    });
  });

  describe('getAlbumInfo', () => {
    it('should get a shared album', async () => {
      const album = AlbumFactory.from().albumUser().build();
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

      await sut.get(AuthFactory.create(album.owner), album.id, {});

      expect(mocks.album.getById).toHaveBeenCalledWith(album.id, { withAssets: true });
      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(album.owner.id, new Set([album.id]));
    });

    it('should get a shared album via a shared link', async () => {
      const album = AlbumFactory.from().albumUser().build();
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

      const auth = AuthFactory.from().sharedLink().build();
      await sut.get(auth, album.id, {});

      expect(mocks.album.getById).toHaveBeenCalledWith(album.id, { withAssets: true });
      expect(mocks.access.album.checkSharedLinkAccess).toHaveBeenCalledWith(auth.sharedLink!.id, new Set([album.id]));
    });

    it('should get a shared album via shared with user', async () => {
      const user = UserFactory.create();
      const album = AlbumFactory.from().albumUser({ userId: user.id }).build();
      mocks.album.getById.mockResolvedValue(album);
      mocks.access.album.checkSharedAlbumAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getMetadataForIds.mockResolvedValue([
        {
          albumId: album.id,
          assetCount: 1,
          startDate: new Date('1970-01-01'),
          endDate: new Date('1970-01-01'),
          lastModifiedAssetTimestamp: new Date('1970-01-01'),
        },
      ]);

      await sut.get(AuthFactory.create(user), album.id, {});

      expect(mocks.album.getById).toHaveBeenCalledWith(album.id, { withAssets: true });
      expect(mocks.access.album.checkSharedAlbumAccess).toHaveBeenCalledWith(
        user.id,
        new Set([album.id]),
        AlbumUserRole.Viewer,
      );
    });

    it('should throw an error for no access', async () => {
      const auth = AuthFactory.create();
      await expect(sut.get(auth, 'album-123', {})).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set(['album-123']));
      expect(mocks.access.album.checkSharedAlbumAccess).toHaveBeenCalledWith(
        auth.user.id,
        new Set(['album-123']),
        AlbumUserRole.Viewer,
      );
    });
  });

  describe('addAssets', () => {
    it('should allow the owner to add assets', async () => {
      const owner = UserFactory.create({ isAdmin: true });
      const album = AlbumFactory.from({ ownerId: owner.id }).owner(owner).build();
      const [asset1, asset2, asset3] = [AssetFactory.create(), AssetFactory.create(), AssetFactory.create()];
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset1.id, asset2.id, asset3.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssets(AuthFactory.create(owner), album.id, { ids: [asset1.id, asset2.id, asset3.id] }),
      ).resolves.toEqual([
        { success: true, id: asset1.id },
        { success: true, id: asset2.id },
        { success: true, id: asset3.id },
      ]);

      expect(mocks.album.update).toHaveBeenCalledWith(album.id, {
        id: album.id,
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: asset1.id,
      });
      expect(mocks.album.addAssetIds).toHaveBeenCalledWith(album.id, [asset1.id, asset2.id, asset3.id]);
    });

    it('should not set the thumbnail if the album has one already', async () => {
      const [asset1, asset2] = [AssetFactory.create(), AssetFactory.create()];
      const album = AlbumFactory.from({ albumThumbnailAssetId: asset1.id }).build();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset2.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set());

      await expect(sut.addAssets(AuthFactory.create(album.owner), album.id, { ids: [asset2.id] })).resolves.toEqual([
        { success: true, id: asset2.id },
      ]);

      expect(mocks.album.update).toHaveBeenCalledWith(album.id, {
        id: album.id,
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: asset1.id,
      });
      expect(mocks.album.addAssetIds).toHaveBeenCalled();
    });

    it('should allow a shared user to add assets', async () => {
      const user = UserFactory.create();
      const album = AlbumFactory.from().albumUser({ userId: user.id, role: AlbumUserRole.Editor }).build();
      const [asset1, asset2, asset3] = [AssetFactory.create(), AssetFactory.create(), AssetFactory.create()];
      mocks.access.album.checkSharedAlbumAccess.mockResolvedValue(new Set([album.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset1.id, asset2.id, asset3.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssets(AuthFactory.create(user), album.id, { ids: [asset1.id, asset2.id, asset3.id] }),
      ).resolves.toEqual([
        { success: true, id: asset1.id },
        { success: true, id: asset2.id },
        { success: true, id: asset3.id },
      ]);

      expect(mocks.album.update).toHaveBeenCalledWith(album.id, {
        id: album.id,
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: asset1.id,
      });
      expect(mocks.album.addAssetIds).toHaveBeenCalledWith(album.id, [asset1.id, asset2.id, asset3.id]);
      expect(mocks.event.emit).toHaveBeenCalledWith('AlbumUpdate', {
        id: album.id,
        recipientId: album.ownerId,
      });
    });

    it('should not allow a shared user with viewer access to add assets', async () => {
      const user = UserFactory.create();
      const album = AlbumFactory.from().albumUser({ userId: user.id, role: AlbumUserRole.Viewer }).build();
      const [asset1, asset2, asset3] = [AssetFactory.create(), AssetFactory.create(), AssetFactory.create()];
      mocks.access.album.checkSharedAlbumAccess.mockResolvedValue(new Set());
      mocks.album.getById.mockResolvedValue(album);

      await expect(
        sut.addAssets(AuthFactory.create(user), album.id, { ids: [asset1.id, asset2.id, asset3.id] }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should allow a shared link user to add assets', async () => {
      const album = AlbumFactory.create();
      const [asset1, asset2, asset3] = [AssetFactory.create(), AssetFactory.create(), AssetFactory.create()];
      const auth = AuthFactory.from(album.owner).sharedLink({ allowUpload: true, userId: album.ownerId }).build();
      mocks.access.album.checkSharedLinkAccess.mockResolvedValue(new Set([album.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset1.id, asset2.id, asset3.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set());

      await expect(sut.addAssets(auth, album.id, { ids: [asset1.id, asset2.id, asset3.id] })).resolves.toEqual([
        { success: true, id: asset1.id },
        { success: true, id: asset2.id },
        { success: true, id: asset3.id },
      ]);

      expect(mocks.album.update).toHaveBeenCalledWith(album.id, {
        id: album.id,
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: asset1.id,
      });
      expect(mocks.album.addAssetIds).toHaveBeenCalledWith(album.id, [asset1.id, asset2.id, asset3.id]);

      expect(mocks.access.album.checkSharedLinkAccess).toHaveBeenCalledWith(auth.sharedLink?.id, new Set([album.id]));
    });

    it('should allow adding assets shared via partner sharing', async () => {
      const album = AlbumFactory.create();
      const asset = AssetFactory.create();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.access.asset.checkPartnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set());

      await expect(sut.addAssets(AuthFactory.create(album.owner), album.id, { ids: [asset.id] })).resolves.toEqual([
        { success: true, id: asset.id },
      ]);

      expect(mocks.album.update).toHaveBeenCalledWith(album.id, {
        id: album.id,
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: asset.id,
      });
      expect(mocks.access.asset.checkPartnerAccess).toHaveBeenCalledWith(album.ownerId, new Set([asset.id]));
    });

    it('should skip duplicate assets', async () => {
      const asset = AssetFactory.create();
      const album = AlbumFactory.create();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set([asset.id]));

      await expect(sut.addAssets(AuthFactory.create(album.owner), album.id, { ids: [asset.id] })).resolves.toEqual([
        { success: false, id: asset.id, error: BulkIdErrorReason.DUPLICATE },
      ]);

      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should skip assets not shared with user', async () => {
      const asset = AssetFactory.create();
      const album = AlbumFactory.create();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set());

      await expect(sut.addAssets(AuthFactory.create(album.owner), album.id, { ids: [asset.id] })).resolves.toEqual([
        { success: false, id: asset.id, error: BulkIdErrorReason.NO_PERMISSION },
      ]);

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(album.ownerId, new Set([asset.id]), false);
      expect(mocks.access.asset.checkPartnerAccess).toHaveBeenCalledWith(album.ownerId, new Set([asset.id]));
    });

    it('should not allow unauthorized access to the album', async () => {
      const user = UserFactory.create();
      const album = AlbumFactory.create();
      const asset = AssetFactory.create({ ownerId: user.id });
      mocks.album.getById.mockResolvedValue(album);

      await expect(sut.addAssets(AuthFactory.create(user), album.id, { ids: [asset.id] })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalled();
      expect(mocks.access.album.checkSharedAlbumAccess).toHaveBeenCalled();
    });

    it('should not allow unauthorized shared link access to the album', async () => {
      const album = AlbumFactory.create();
      const asset = AssetFactory.create();
      mocks.album.getById.mockResolvedValue(album);

      await expect(
        sut.addAssets(AuthFactory.from().sharedLink({ allowUpload: true }).build(), album.id, { ids: [asset.id] }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.access.album.checkSharedLinkAccess).toHaveBeenCalled();
    });
  });

  describe('addAssetsToAlbums', () => {
    it('should allow the owner to add assets', async () => {
      const album1 = AlbumFactory.create();
      const album2 = AlbumFactory.create();
      const [asset1, asset2, asset3] = [AssetFactory.create(), AssetFactory.create(), AssetFactory.create()];
      mocks.access.album.checkOwnerAccess.mockResolvedValueOnce(new Set([album1.id, album2.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset1.id, asset2.id, asset3.id]));
      mocks.album.getById.mockResolvedValueOnce(album1).mockResolvedValueOnce(album2);
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssetsToAlbums(AuthFactory.create(album1.owner), {
          albumIds: [album1.id, album2.id],
          assetIds: [asset1.id, asset2.id, asset3.id],
        }),
      ).resolves.toEqual({ success: true, error: undefined });

      expect(mocks.album.update).toHaveBeenCalledTimes(2);
      expect(mocks.album.update).toHaveBeenNthCalledWith(1, album1.id, {
        id: album1.id,
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: asset1.id,
      });
      expect(mocks.album.update).toHaveBeenNthCalledWith(2, album2.id, {
        id: album2.id,
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: asset1.id,
      });
      expect(mocks.album.addAssetIdsToAlbums).toHaveBeenCalledWith([
        { albumId: album1.id, assetId: asset1.id },
        { albumId: album1.id, assetId: asset2.id },
        { albumId: album1.id, assetId: asset3.id },
        { albumId: album2.id, assetId: asset1.id },
        { albumId: album2.id, assetId: asset2.id },
        { albumId: album2.id, assetId: asset3.id },
      ]);
    });

    it('should not set the thumbnail if the album has one already', async () => {
      const asset = AssetFactory.create();
      const album1 = AlbumFactory.from({ albumThumbnailAssetId: asset.id }).build();
      const album2 = AlbumFactory.from({ albumThumbnailAssetId: asset.id }).build();
      const [asset1, asset2, asset3] = [AssetFactory.create(), AssetFactory.create(), AssetFactory.create()];
      mocks.access.album.checkOwnerAccess.mockResolvedValueOnce(new Set([album1.id, album2.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset1.id, asset2.id, asset3.id]));
      mocks.album.getById.mockResolvedValueOnce(album1).mockResolvedValueOnce(album2);
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssetsToAlbums(AuthFactory.create(album1.owner), {
          albumIds: [album1.id, album2.id],
          assetIds: [asset1.id, asset2.id, asset3.id],
        }),
      ).resolves.toEqual({ success: true, error: undefined });

      expect(mocks.album.update).toHaveBeenCalledTimes(2);
      expect(mocks.album.update).toHaveBeenNthCalledWith(1, album1.id, {
        id: album1.id,
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: asset.id,
      });
      expect(mocks.album.update).toHaveBeenNthCalledWith(2, album2.id, {
        id: album2.id,
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: asset.id,
      });
      expect(mocks.album.addAssetIdsToAlbums).toHaveBeenCalledWith([
        { albumId: album1.id, assetId: asset1.id },
        { albumId: album1.id, assetId: asset2.id },
        { albumId: album1.id, assetId: asset3.id },
        { albumId: album2.id, assetId: asset1.id },
        { albumId: album2.id, assetId: asset2.id },
        { albumId: album2.id, assetId: asset3.id },
      ]);
    });

    it('should allow a shared user to add assets', async () => {
      const user = UserFactory.create();
      const album1 = AlbumFactory.from().albumUser({ userId: user.id, role: AlbumUserRole.Editor }).build();
      const album2 = AlbumFactory.from().albumUser({ userId: user.id, role: AlbumUserRole.Editor }).build();
      const [asset1, asset2, asset3] = [AssetFactory.create(), AssetFactory.create(), AssetFactory.create()];
      mocks.access.album.checkSharedAlbumAccess.mockResolvedValueOnce(new Set([album1.id, album2.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset1.id, asset2.id, asset3.id]));
      mocks.album.getById.mockResolvedValueOnce(album1).mockResolvedValueOnce(album2);
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssetsToAlbums(AuthFactory.create(user), {
          albumIds: [album1.id, album2.id],
          assetIds: [asset1.id, asset2.id, asset3.id],
        }),
      ).resolves.toEqual({ success: true, error: undefined });

      expect(mocks.album.update).toHaveBeenCalledTimes(2);
      expect(mocks.album.update).toHaveBeenNthCalledWith(1, album1.id, {
        id: album1.id,
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: asset1.id,
      });
      expect(mocks.album.update).toHaveBeenNthCalledWith(2, album2.id, {
        id: album2.id,
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: asset1.id,
      });
      expect(mocks.album.addAssetIdsToAlbums).toHaveBeenCalledWith([
        { albumId: album1.id, assetId: asset1.id },
        { albumId: album1.id, assetId: asset2.id },
        { albumId: album1.id, assetId: asset3.id },
        { albumId: album2.id, assetId: asset1.id },
        { albumId: album2.id, assetId: asset2.id },
        { albumId: album2.id, assetId: asset3.id },
      ]);
      expect(mocks.event.emit).toHaveBeenCalledWith('AlbumUpdate', {
        id: album1.id,
        recipientId: album1.ownerId,
      });
      expect(mocks.event.emit).toHaveBeenCalledWith('AlbumUpdate', {
        id: album2.id,
        recipientId: album2.ownerId,
      });
    });

    it('should not allow a shared user with viewer access to add assets', async () => {
      const user = UserFactory.create();
      const album1 = AlbumFactory.from().albumUser({ userId: user.id, role: AlbumUserRole.Viewer }).build();
      const album2 = AlbumFactory.from().albumUser({ userId: user.id, role: AlbumUserRole.Viewer }).build();
      const [asset1, asset2, asset3] = [AssetFactory.create(), AssetFactory.create(), AssetFactory.create()];
      mocks.access.album.checkSharedAlbumAccess.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset1.id, asset2.id, asset3.id]));
      mocks.album.getById.mockResolvedValueOnce(album1).mockResolvedValueOnce(album2);
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssetsToAlbums(AuthFactory.create(user), {
          albumIds: [album1.id, album2.id],
          assetIds: [asset1.id, asset2.id, asset3.id],
        }),
      ).resolves.toEqual({
        success: false,
        error: BulkIdErrorReason.NO_PERMISSION,
      });

      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should not allow a shared link user to add assets to multiple albums', async () => {
      const album1 = AlbumFactory.create();
      const album2 = AlbumFactory.create();
      const [asset1, asset2, asset3] = [AssetFactory.create(), AssetFactory.create(), AssetFactory.create()];
      mocks.access.album.checkSharedLinkAccess.mockResolvedValueOnce(new Set([album1.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset1.id, asset2.id, asset3.id]));
      mocks.album.getById.mockResolvedValueOnce(album1).mockResolvedValueOnce(album2);
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());

      const auth = AuthFactory.from(album1.owner).sharedLink({ allowUpload: true }).build();
      await expect(
        sut.addAssetsToAlbums(auth, {
          albumIds: [album1.id, album2.id],
          assetIds: [asset1.id, asset2.id, asset3.id],
        }),
      ).resolves.toEqual({ success: true, error: undefined });

      expect(mocks.album.update).toHaveBeenCalledTimes(1);
      expect(mocks.album.update).toHaveBeenNthCalledWith(1, album1.id, {
        id: album1.id,
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: asset1.id,
      });
      expect(mocks.album.addAssetIdsToAlbums).toHaveBeenCalledWith([
        { albumId: album1.id, assetId: asset1.id },
        { albumId: album1.id, assetId: asset2.id },
        { albumId: album1.id, assetId: asset3.id },
      ]);
      expect(mocks.access.album.checkSharedLinkAccess).toHaveBeenCalledWith(
        auth.sharedLink?.id,
        new Set([album1.id, album2.id]),
      );
    });

    it('should allow adding assets shared via partner sharing', async () => {
      const user = UserFactory.create();
      const album1 = AlbumFactory.create();
      const album2 = AlbumFactory.create();
      const [asset1, asset2, asset3] = [
        AssetFactory.create({ ownerId: user.id }),
        AssetFactory.create({ ownerId: user.id }),
        AssetFactory.create({ ownerId: user.id }),
      ];
      mocks.access.album.checkOwnerAccess.mockResolvedValueOnce(new Set([album1.id, album2.id]));
      mocks.access.asset.checkPartnerAccess.mockResolvedValue(new Set([asset1.id, asset2.id, asset3.id]));
      mocks.album.getById.mockResolvedValueOnce(album1).mockResolvedValueOnce(album2);
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssetsToAlbums(AuthFactory.create(album1.owner), {
          albumIds: [album1.id, album2.id],
          assetIds: [asset1.id, asset2.id, asset3.id],
        }),
      ).resolves.toEqual({ success: true, error: undefined });

      expect(mocks.album.update).toHaveBeenCalledTimes(2);
      expect(mocks.album.update).toHaveBeenNthCalledWith(1, album1.id, {
        id: album1.id,
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: asset1.id,
      });
      expect(mocks.album.update).toHaveBeenNthCalledWith(2, album2.id, {
        id: album2.id,
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: asset1.id,
      });
      expect(mocks.album.addAssetIdsToAlbums).toHaveBeenCalledWith([
        { albumId: album1.id, assetId: asset1.id },
        { albumId: album1.id, assetId: asset2.id },
        { albumId: album1.id, assetId: asset3.id },
        { albumId: album2.id, assetId: asset1.id },
        { albumId: album2.id, assetId: asset2.id },
        { albumId: album2.id, assetId: asset3.id },
      ]);
      expect(mocks.access.asset.checkPartnerAccess).toHaveBeenCalledWith(
        album1.ownerId,
        new Set([asset1.id, asset2.id, asset3.id]),
      );
    });

    it('should skip some duplicate assets', async () => {
      const [asset1, asset2, asset3] = [AssetFactory.create(), AssetFactory.create(), AssetFactory.create()];
      const album1 = AlbumFactory.create();
      const album2 = AlbumFactory.create();
      mocks.access.album.checkOwnerAccess.mockResolvedValueOnce(new Set([album1.id, album2.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset1.id, asset2.id, asset3.id]));
      mocks.album.getAssetIds
        .mockResolvedValueOnce(new Set([asset1.id, asset2.id, asset3.id]))
        .mockResolvedValueOnce(new Set());
      mocks.album.getById.mockResolvedValueOnce(album1).mockResolvedValueOnce(album2);

      await expect(
        sut.addAssetsToAlbums(AuthFactory.create(album1.owner), {
          albumIds: [album1.id, album2.id],
          assetIds: [asset1.id, asset2.id, asset3.id],
        }),
      ).resolves.toEqual({ success: true, error: undefined });

      expect(mocks.album.update).toHaveBeenCalledTimes(1);
      expect(mocks.album.update).toHaveBeenNthCalledWith(1, album2.id, {
        id: album2.id,
        updatedAt: expect.any(Date),
        albumThumbnailAssetId: asset1.id,
      });
      expect(mocks.album.addAssetIdsToAlbums).toHaveBeenCalledWith([
        { albumId: album2.id, assetId: asset1.id },
        { albumId: album2.id, assetId: asset2.id },
        { albumId: album2.id, assetId: asset3.id },
      ]);
    });

    it('should skip all duplicate assets', async () => {
      const [asset1, asset2, asset3] = [AssetFactory.create(), AssetFactory.create(), AssetFactory.create()];
      const album1 = AlbumFactory.create();
      const album2 = AlbumFactory.create();
      mocks.access.album.checkOwnerAccess
        .mockResolvedValueOnce(new Set([album1.id]))
        .mockResolvedValueOnce(new Set([album2.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset1.id, asset2.id, asset3.id]));
      mocks.album.getById.mockResolvedValueOnce(album1).mockResolvedValueOnce(album2);
      mocks.album.getAssetIds.mockResolvedValue(new Set([asset1.id, asset2.id, asset3.id]));

      await expect(
        sut.addAssetsToAlbums(AuthFactory.create(album1.owner), {
          albumIds: [album1.id, album2.id],
          assetIds: [asset1.id, asset2.id, asset3.id],
        }),
      ).resolves.toEqual({
        success: false,
        error: BulkIdErrorReason.DUPLICATE,
      });

      expect(mocks.album.update).not.toHaveBeenCalled();
      expect(mocks.album.addAssetIds).not.toHaveBeenCalled();
    });

    it('should skip assets not shared with user', async () => {
      const user = UserFactory.create();
      const album1 = AlbumFactory.create();
      const album2 = AlbumFactory.create();
      const [asset1, asset2, asset3] = [
        AssetFactory.create({ ownerId: user.id }),
        AssetFactory.create({ ownerId: user.id }),
        AssetFactory.create({ ownerId: user.id }),
      ];
      mocks.access.album.checkSharedAlbumAccess
        .mockResolvedValueOnce(new Set([album1.id]))
        .mockResolvedValueOnce(new Set([album2.id]));
      mocks.album.getById.mockResolvedValueOnce(_.cloneDeep(album1)).mockResolvedValueOnce(_.cloneDeep(album2));
      mocks.album.getAssetIds.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set());

      await expect(
        sut.addAssetsToAlbums(AuthFactory.create(album1.owner), {
          albumIds: [album1.id, album2.id],
          assetIds: [asset1.id, asset2.id, asset3.id],
        }),
      ).resolves.toEqual({
        success: false,
        error: BulkIdErrorReason.NO_PERMISSION,
      });

      expect(mocks.album.update).not.toHaveBeenCalled();
      expect(mocks.album.addAssetIds).not.toHaveBeenCalled();
      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(
        album1.ownerId,
        new Set([asset1.id, asset2.id, asset3.id]),
        false,
      );
      expect(mocks.access.asset.checkPartnerAccess).toHaveBeenCalledWith(
        album1.ownerId,
        new Set([asset1.id, asset2.id, asset3.id]),
      );
    });

    it('should not allow unauthorized access to the albums', async () => {
      const user = UserFactory.create();
      const album1 = AlbumFactory.create();
      const album2 = AlbumFactory.create();
      const [asset1, asset2, asset3] = [AssetFactory.create(), AssetFactory.create(), AssetFactory.create()];
      mocks.album.getById.mockResolvedValueOnce(album1).mockResolvedValueOnce(album2);

      await expect(
        sut.addAssetsToAlbums(AuthFactory.create(user), {
          albumIds: [album1.id, album2.id],
          assetIds: [asset1.id, asset2.id, asset3.id],
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
      const album1 = AlbumFactory.create();
      const album2 = AlbumFactory.create();
      const [asset1, asset2, asset3] = [AssetFactory.create(), AssetFactory.create(), AssetFactory.create()];
      mocks.album.getById.mockResolvedValueOnce(album1).mockResolvedValueOnce(album2);

      await expect(
        sut.addAssetsToAlbums(AuthFactory.from().sharedLink({ allowUpload: true }).build(), {
          albumIds: [album1.id, album2.id],
          assetIds: [asset1.id, asset2.id, asset3.id],
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
      const asset = AssetFactory.create();
      const album = AlbumFactory.create();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.album.getAssetIds.mockResolvedValue(new Set([asset.id]));

      await expect(sut.removeAssets(AuthFactory.create(album.owner), album.id, { ids: [asset.id] })).resolves.toEqual([
        { success: true, id: asset.id },
      ]);

      expect(mocks.album.removeAssetIds).toHaveBeenCalledWith(album.id, [asset.id]);
    });

    it('should skip assets not in the album', async () => {
      const asset = AssetFactory.create();
      const album = AlbumFactory.create();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.album.getAssetIds.mockResolvedValue(new Set());

      await expect(sut.removeAssets(AuthFactory.create(album.owner), album.id, { ids: [asset.id] })).resolves.toEqual([
        { success: false, id: asset.id, error: BulkIdErrorReason.NOT_FOUND },
      ]);

      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should allow owner to remove all assets from the album', async () => {
      const asset = AssetFactory.create();
      const album = AlbumFactory.create();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.album.getAssetIds.mockResolvedValue(new Set([asset.id]));

      await expect(sut.removeAssets(AuthFactory.create(album.owner), album.id, { ids: [asset.id] })).resolves.toEqual([
        { success: true, id: asset.id },
      ]);
    });

    it('should reset the thumbnail if it is removed', async () => {
      const asset1 = AssetFactory.create();
      const asset2 = AssetFactory.create();
      const album = AlbumFactory.from({ albumThumbnailAssetId: asset1.id }).build();
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([album.id]));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset1.id]));
      mocks.album.getById.mockResolvedValue(album);
      mocks.album.getAssetIds.mockResolvedValue(new Set([asset1.id, asset2.id]));

      await expect(sut.removeAssets(AuthFactory.create(album.owner), album.id, { ids: [asset1.id] })).resolves.toEqual([
        { success: true, id: asset1.id },
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

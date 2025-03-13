import { BadRequestException } from '@nestjs/common';
import _ from 'lodash';
import { BulkIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { AlbumUserRole } from 'src/enum';
import { AlbumService } from 'src/services/album.service';
import { albumStub } from 'test/fixtures/album.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { userStub } from 'test/fixtures/user.stub';
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
      mocks.album.getOwned.mockResolvedValue([albumStub.empty, albumStub.sharedWithUser]);
      mocks.album.getMetadataForIds.mockResolvedValue([
        { albumId: albumStub.empty.id, assetCount: 0, startDate: null, endDate: null },
        { albumId: albumStub.sharedWithUser.id, assetCount: 0, startDate: null, endDate: null },
      ]);

      const result = await sut.getAll(authStub.admin, {});
      expect(result).toHaveLength(2);
      expect(result[0].id).toEqual(albumStub.empty.id);
      expect(result[1].id).toEqual(albumStub.sharedWithUser.id);
    });

    it('gets list of albums that have a specific asset', async () => {
      mocks.album.getByAssetId.mockResolvedValue([albumStub.oneAsset]);
      mocks.album.getMetadataForIds.mockResolvedValue([
        {
          albumId: albumStub.oneAsset.id,
          assetCount: 1,
          startDate: new Date('1970-01-01'),
          endDate: new Date('1970-01-01'),
        },
      ]);

      const result = await sut.getAll(authStub.admin, { assetId: albumStub.oneAsset.id });
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(albumStub.oneAsset.id);
      expect(mocks.album.getByAssetId).toHaveBeenCalledTimes(1);
    });

    it('gets list of albums that are shared', async () => {
      mocks.album.getShared.mockResolvedValue([albumStub.sharedWithUser]);
      mocks.album.getMetadataForIds.mockResolvedValue([
        { albumId: albumStub.sharedWithUser.id, assetCount: 0, startDate: null, endDate: null },
      ]);

      const result = await sut.getAll(authStub.admin, { shared: true });
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(albumStub.sharedWithUser.id);
      expect(mocks.album.getShared).toHaveBeenCalledTimes(1);
    });

    it('gets list of albums that are NOT shared', async () => {
      mocks.album.getNotShared.mockResolvedValue([albumStub.empty]);
      mocks.album.getMetadataForIds.mockResolvedValue([
        { albumId: albumStub.empty.id, assetCount: 0, startDate: null, endDate: null },
      ]);

      const result = await sut.getAll(authStub.admin, { shared: false });
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(albumStub.empty.id);
      expect(mocks.album.getNotShared).toHaveBeenCalledTimes(1);
    });
  });

  it('counts assets correctly', async () => {
    mocks.album.getOwned.mockResolvedValue([albumStub.oneAsset]);
    mocks.album.getMetadataForIds.mockResolvedValue([
      {
        albumId: albumStub.oneAsset.id,
        assetCount: 1,
        startDate: new Date('1970-01-01'),
        endDate: new Date('1970-01-01'),
      },
    ]);

    const result = await sut.getAll(authStub.admin, {});

    expect(result).toHaveLength(1);
    expect(result[0].assetCount).toEqual(1);
    expect(mocks.album.getOwned).toHaveBeenCalledTimes(1);
  });

  describe('create', () => {
    it('creates album', async () => {
      mocks.album.create.mockResolvedValue(albumStub.empty);
      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['123']));

      await sut.create(authStub.admin, {
        albumName: 'Empty album',
        albumUsers: [{ userId: 'user-id', role: AlbumUserRole.EDITOR }],
        description: '',
        assetIds: ['123'],
      });

      expect(mocks.album.create).toHaveBeenCalledWith(
        {
          ownerId: authStub.admin.user.id,
          albumName: albumStub.empty.albumName,
          description: albumStub.empty.description,

          albumThumbnailAssetId: '123',
        },
        ['123'],
        [{ userId: 'user-id', role: AlbumUserRole.EDITOR }],
      );

      expect(mocks.user.get).toHaveBeenCalledWith('user-id', {});
      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['123']));
      expect(mocks.event.emit).toHaveBeenCalledWith('album.invite', {
        id: albumStub.empty.id,
        userId: 'user-id',
      });
    });

    it('should require valid userIds', async () => {
      mocks.user.get.mockResolvedValue(void 0);
      await expect(
        sut.create(authStub.admin, {
          albumName: 'Empty album',
          albumUsers: [{ userId: 'user-3', role: AlbumUserRole.EDITOR }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.user.get).toHaveBeenCalledWith('user-3', {});
      expect(mocks.album.create).not.toHaveBeenCalled();
    });

    it('should only add assets the user is allowed to access', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.album.create.mockResolvedValue(albumStub.oneAsset);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));

      await sut.create(authStub.admin, {
        albumName: 'Test album',
        description: '',
        assetIds: ['asset-1', 'asset-2'],
      });

      expect(mocks.album.create).toHaveBeenCalledWith(
        {
          ownerId: authStub.admin.user.id,
          albumName: 'Test album',
          description: '',

          albumThumbnailAssetId: 'asset-1',
        },
        ['asset-1'],
        [],
      );
      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set(['asset-1', 'asset-2']),
      );
    });
  });

  describe('update', () => {
    it('should prevent updating an album that does not exist', async () => {
      mocks.album.getById.mockResolvedValue(void 0);

      await expect(
        sut.update(authStub.user1, 'invalid-id', {
          albumName: 'new album name',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should prevent updating a not owned album (shared with auth user)', async () => {
      await expect(
        sut.update(authStub.admin, albumStub.sharedWithAdmin.id, {
          albumName: 'new album name',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should require a valid thumbnail asset id', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-4']));
      mocks.album.getById.mockResolvedValue(albumStub.oneAsset);
      mocks.album.update.mockResolvedValue(albumStub.oneAsset);
      mocks.album.getAssetIds.mockResolvedValue(new Set());

      await expect(
        sut.update(authStub.admin, albumStub.oneAsset.id, {
          albumThumbnailAssetId: 'not-in-album',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.album.getAssetIds).toHaveBeenCalledWith('album-4', ['not-in-album']);
      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should allow the owner to update the album', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-4']));

      mocks.album.getById.mockResolvedValue(albumStub.oneAsset);
      mocks.album.update.mockResolvedValue(albumStub.oneAsset);

      await sut.update(authStub.admin, albumStub.oneAsset.id, {
        albumName: 'new album name',
      });

      expect(mocks.album.update).toHaveBeenCalledTimes(1);
      expect(mocks.album.update).toHaveBeenCalledWith('album-4', {
        id: 'album-4',
        albumName: 'new album name',
      });
    });
  });

  describe('delete', () => {
    it('should throw an error for an album not found', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set());

      await expect(sut.delete(authStub.admin, albumStub.sharedWithAdmin.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.album.delete).not.toHaveBeenCalled();
    });

    it('should not let a shared user delete the album', async () => {
      mocks.album.getById.mockResolvedValue(albumStub.sharedWithAdmin);

      await expect(sut.delete(authStub.admin, albumStub.sharedWithAdmin.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.album.delete).not.toHaveBeenCalled();
    });

    it('should let the owner delete an album', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumStub.empty.id]));
      mocks.album.getById.mockResolvedValue(albumStub.empty);

      await sut.delete(authStub.admin, albumStub.empty.id);

      expect(mocks.album.delete).toHaveBeenCalledTimes(1);
      expect(mocks.album.delete).toHaveBeenCalledWith(albumStub.empty.id);
    });
  });

  describe('addUsers', () => {
    it('should throw an error if the auth user is not the owner', async () => {
      await expect(
        sut.addUsers(authStub.admin, albumStub.sharedWithAdmin.id, { albumUsers: [{ userId: 'user-1' }] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should throw an error if the userId is already added', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumStub.sharedWithAdmin.id]));
      mocks.album.getById.mockResolvedValue(albumStub.sharedWithAdmin);
      await expect(
        sut.addUsers(authStub.user1, albumStub.sharedWithAdmin.id, {
          albumUsers: [{ userId: authStub.admin.user.id }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should throw an error if the userId does not exist', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumStub.sharedWithAdmin.id]));
      mocks.album.getById.mockResolvedValue(albumStub.sharedWithAdmin);
      mocks.user.get.mockResolvedValue(void 0);
      await expect(
        sut.addUsers(authStub.user1, albumStub.sharedWithAdmin.id, { albumUsers: [{ userId: 'user-3' }] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should throw an error if the userId is the ownerId', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumStub.sharedWithAdmin.id]));
      mocks.album.getById.mockResolvedValue(albumStub.sharedWithAdmin);
      await expect(
        sut.addUsers(authStub.user1, albumStub.sharedWithAdmin.id, {
          albumUsers: [{ userId: userStub.user1.id }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should add valid shared users', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumStub.sharedWithAdmin.id]));
      mocks.album.getById.mockResolvedValue(_.cloneDeep(albumStub.sharedWithAdmin));
      mocks.album.update.mockResolvedValue(albumStub.sharedWithAdmin);
      mocks.user.get.mockResolvedValue(userStub.user2);
      mocks.albumUser.create.mockResolvedValue({
        usersId: userStub.user2.id,
        albumsId: albumStub.sharedWithAdmin.id,
        role: AlbumUserRole.EDITOR,
      });
      await sut.addUsers(authStub.user1, albumStub.sharedWithAdmin.id, {
        albumUsers: [{ userId: authStub.user2.user.id }],
      });
      expect(mocks.albumUser.create).toHaveBeenCalledWith({
        usersId: authStub.user2.user.id,
        albumsId: albumStub.sharedWithAdmin.id,
      });
      expect(mocks.event.emit).toHaveBeenCalledWith('album.invite', {
        id: albumStub.sharedWithAdmin.id,
        userId: userStub.user2.id,
      });
    });
  });

  describe('removeUser', () => {
    it('should require a valid album id', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-1']));
      mocks.album.getById.mockResolvedValue(void 0);
      await expect(sut.removeUser(authStub.admin, 'album-1', 'user-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should remove a shared user from an owned album', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumStub.sharedWithUser.id]));
      mocks.album.getById.mockResolvedValue(albumStub.sharedWithUser);
      mocks.albumUser.delete.mockResolvedValue();

      await expect(
        sut.removeUser(authStub.admin, albumStub.sharedWithUser.id, userStub.user1.id),
      ).resolves.toBeUndefined();

      expect(mocks.albumUser.delete).toHaveBeenCalledTimes(1);
      expect(mocks.albumUser.delete).toHaveBeenCalledWith({
        albumsId: albumStub.sharedWithUser.id,
        usersId: userStub.user1.id,
      });
      expect(mocks.album.getById).toHaveBeenCalledWith(albumStub.sharedWithUser.id, { withAssets: false });
    });

    it('should prevent removing a shared user from a not-owned album (shared with auth user)', async () => {
      mocks.album.getById.mockResolvedValue(albumStub.sharedWithMultiple);

      await expect(
        sut.removeUser(authStub.user1, albumStub.sharedWithMultiple.id, authStub.user2.user.id),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.albumUser.delete).not.toHaveBeenCalled();
      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.user1.user.id,
        new Set([albumStub.sharedWithMultiple.id]),
      );
    });

    it('should allow a shared user to remove themselves', async () => {
      mocks.album.getById.mockResolvedValue(albumStub.sharedWithUser);
      mocks.albumUser.delete.mockResolvedValue();

      await sut.removeUser(authStub.user1, albumStub.sharedWithUser.id, authStub.user1.user.id);

      expect(mocks.albumUser.delete).toHaveBeenCalledTimes(1);
      expect(mocks.albumUser.delete).toHaveBeenCalledWith({
        albumsId: albumStub.sharedWithUser.id,
        usersId: authStub.user1.user.id,
      });
    });

    it('should allow a shared user to remove themselves using "me"', async () => {
      mocks.album.getById.mockResolvedValue(albumStub.sharedWithUser);
      mocks.albumUser.delete.mockResolvedValue();

      await sut.removeUser(authStub.user1, albumStub.sharedWithUser.id, 'me');

      expect(mocks.albumUser.delete).toHaveBeenCalledTimes(1);
      expect(mocks.albumUser.delete).toHaveBeenCalledWith({
        albumsId: albumStub.sharedWithUser.id,
        usersId: authStub.user1.user.id,
      });
    });

    it('should not allow the owner to be removed', async () => {
      mocks.album.getById.mockResolvedValue(albumStub.empty);

      await expect(sut.removeUser(authStub.admin, albumStub.empty.id, authStub.admin.user.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.album.update).not.toHaveBeenCalled();
    });

    it('should throw an error for a user not in the album', async () => {
      mocks.album.getById.mockResolvedValue(albumStub.empty);

      await expect(sut.removeUser(authStub.admin, albumStub.empty.id, 'user-3')).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.album.update).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user role', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumStub.sharedWithAdmin.id]));
      mocks.albumUser.update.mockResolvedValue(null as any);

      await sut.updateUser(authStub.user1, albumStub.sharedWithAdmin.id, userStub.admin.id, {
        role: AlbumUserRole.EDITOR,
      });
      expect(mocks.albumUser.update).toHaveBeenCalledWith(
        { albumsId: albumStub.sharedWithAdmin.id, usersId: userStub.admin.id },
        { role: AlbumUserRole.EDITOR },
      );
    });
  });

  describe('getAlbumInfo', () => {
    it('should get a shared album', async () => {
      mocks.album.getById.mockResolvedValue(albumStub.oneAsset);
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumStub.oneAsset.id]));
      mocks.album.getMetadataForIds.mockResolvedValue([
        {
          albumId: albumStub.oneAsset.id,
          assetCount: 1,
          startDate: new Date('1970-01-01'),
          endDate: new Date('1970-01-01'),
        },
      ]);

      await sut.get(authStub.admin, albumStub.oneAsset.id, {});

      expect(mocks.album.getById).toHaveBeenCalledWith(albumStub.oneAsset.id, { withAssets: true });
      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set([albumStub.oneAsset.id]),
      );
    });

    it('should get a shared album via a shared link', async () => {
      mocks.album.getById.mockResolvedValue(albumStub.oneAsset);
      mocks.access.album.checkSharedLinkAccess.mockResolvedValue(new Set(['album-123']));
      mocks.album.getMetadataForIds.mockResolvedValue([
        {
          albumId: albumStub.oneAsset.id,
          assetCount: 1,
          startDate: new Date('1970-01-01'),
          endDate: new Date('1970-01-01'),
        },
      ]);

      await sut.get(authStub.adminSharedLink, 'album-123', {});

      expect(mocks.album.getById).toHaveBeenCalledWith('album-123', { withAssets: true });
      expect(mocks.access.album.checkSharedLinkAccess).toHaveBeenCalledWith(
        authStub.adminSharedLink.sharedLink?.id,
        new Set(['album-123']),
      );
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
        },
      ]);

      await sut.get(authStub.user1, 'album-123', {});

      expect(mocks.album.getById).toHaveBeenCalledWith('album-123', { withAssets: true });
      expect(mocks.access.album.checkSharedAlbumAccess).toHaveBeenCalledWith(
        authStub.user1.user.id,
        new Set(['album-123']),
        AlbumUserRole.VIEWER,
      );
    });

    it('should throw an error for no access', async () => {
      await expect(sut.get(authStub.admin, 'album-123', {})).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['album-123']));
      expect(mocks.access.album.checkSharedAlbumAccess).toHaveBeenCalledWith(
        authStub.admin.user.id,
        new Set(['album-123']),
        AlbumUserRole.VIEWER,
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
      expect(mocks.event.emit).toHaveBeenCalledWith('album.update', {
        id: 'album-123',
        recipientIds: ['admin_id'],
      });
    });

    it('should not allow a shared user with viewer access to add assets', async () => {
      mocks.access.album.checkSharedAlbumAccess.mockResolvedValue(new Set([]));
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

      expect(mocks.access.asset.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['asset-1']));
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

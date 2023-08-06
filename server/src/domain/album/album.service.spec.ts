import { BadRequestException } from '@nestjs/common';
import {
  albumStub,
  assetStub,
  authStub,
  IAccessRepositoryMock,
  newAccessRepositoryMock,
  newAlbumRepositoryMock,
  newAssetRepositoryMock,
  newJobRepositoryMock,
  newUserRepositoryMock,
  userStub,
} from '@test';
import _ from 'lodash';
import { BulkIdErrorReason, IAssetRepository } from '../asset';
import { IJobRepository, JobName } from '../job';
import { IUserRepository } from '../user';
import { IAlbumRepository } from './album.repository';
import { AlbumService } from './album.service';

describe(AlbumService.name, () => {
  let sut: AlbumService;
  let accessMock: IAccessRepositoryMock;
  let albumMock: jest.Mocked<IAlbumRepository>;
  let assetMock: jest.Mocked<IAssetRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let userMock: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    accessMock = newAccessRepositoryMock();
    albumMock = newAlbumRepositoryMock();
    assetMock = newAssetRepositoryMock();
    jobMock = newJobRepositoryMock();
    userMock = newUserRepositoryMock();

    sut = new AlbumService(accessMock, albumMock, assetMock, jobMock, userMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getCount', () => {
    it('should get the album count', async () => {
      albumMock.getOwned.mockResolvedValue([]),
        albumMock.getShared.mockResolvedValue([]),
        albumMock.getNotShared.mockResolvedValue([]),
        await expect(sut.getCount(authStub.admin)).resolves.toEqual({
          owned: 0,
          shared: 0,
          notShared: 0,
        });

      expect(albumMock.getOwned).toHaveBeenCalledWith(authStub.admin.id);
      expect(albumMock.getShared).toHaveBeenCalledWith(authStub.admin.id);
      expect(albumMock.getNotShared).toHaveBeenCalledWith(authStub.admin.id);
    });
  });

  describe('getAll', () => {
    it('gets list of albums for auth user', async () => {
      albumMock.getOwned.mockResolvedValue([albumStub.empty, albumStub.sharedWithUser]);
      albumMock.getAssetCountForIds.mockResolvedValue([
        { albumId: albumStub.empty.id, assetCount: 0 },
        { albumId: albumStub.sharedWithUser.id, assetCount: 0 },
      ]);
      albumMock.getInvalidThumbnail.mockResolvedValue([]);

      const result = await sut.getAll(authStub.admin, {});
      expect(result).toHaveLength(2);
      expect(result[0].id).toEqual(albumStub.empty.id);
      expect(result[1].id).toEqual(albumStub.sharedWithUser.id);
    });

    it('gets list of albums that have a specific asset', async () => {
      albumMock.getByAssetId.mockResolvedValue([albumStub.oneAsset]);
      albumMock.getAssetCountForIds.mockResolvedValue([{ albumId: albumStub.oneAsset.id, assetCount: 1 }]);
      albumMock.getInvalidThumbnail.mockResolvedValue([]);

      const result = await sut.getAll(authStub.admin, { assetId: albumStub.oneAsset.id });
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(albumStub.oneAsset.id);
      expect(albumMock.getByAssetId).toHaveBeenCalledTimes(1);
    });

    it('gets list of albums that are shared', async () => {
      albumMock.getShared.mockResolvedValue([albumStub.sharedWithUser]);
      albumMock.getAssetCountForIds.mockResolvedValue([{ albumId: albumStub.sharedWithUser.id, assetCount: 0 }]);
      albumMock.getInvalidThumbnail.mockResolvedValue([]);

      const result = await sut.getAll(authStub.admin, { shared: true });
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(albumStub.sharedWithUser.id);
      expect(albumMock.getShared).toHaveBeenCalledTimes(1);
    });

    it('gets list of albums that are NOT shared', async () => {
      albumMock.getNotShared.mockResolvedValue([albumStub.empty]);
      albumMock.getAssetCountForIds.mockResolvedValue([{ albumId: albumStub.empty.id, assetCount: 0 }]);
      albumMock.getInvalidThumbnail.mockResolvedValue([]);

      const result = await sut.getAll(authStub.admin, { shared: false });
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(albumStub.empty.id);
      expect(albumMock.getNotShared).toHaveBeenCalledTimes(1);
    });
  });

  it('counts assets correctly', async () => {
    albumMock.getOwned.mockResolvedValue([albumStub.oneAsset]);
    albumMock.getAssetCountForIds.mockResolvedValue([{ albumId: albumStub.oneAsset.id, assetCount: 1 }]);
    albumMock.getInvalidThumbnail.mockResolvedValue([]);

    const result = await sut.getAll(authStub.admin, {});

    expect(result).toHaveLength(1);
    expect(result[0].assetCount).toEqual(1);
    expect(albumMock.getOwned).toHaveBeenCalledTimes(1);
  });

  it('updates the album thumbnail by listing all albums', async () => {
    albumMock.getOwned.mockResolvedValue([albumStub.oneAssetInvalidThumbnail]);
    albumMock.getAssetCountForIds.mockResolvedValue([
      { albumId: albumStub.oneAssetInvalidThumbnail.id, assetCount: 1 },
    ]);
    albumMock.getInvalidThumbnail.mockResolvedValue([albumStub.oneAssetInvalidThumbnail.id]);
    albumMock.update.mockResolvedValue(albumStub.oneAssetValidThumbnail);
    assetMock.getFirstAssetForAlbumId.mockResolvedValue(albumStub.oneAssetInvalidThumbnail.assets[0]);

    const result = await sut.getAll(authStub.admin, {});

    expect(result).toHaveLength(1);
    expect(albumMock.getInvalidThumbnail).toHaveBeenCalledTimes(1);
    expect(albumMock.update).toHaveBeenCalledTimes(1);
  });

  it('removes the thumbnail for an empty album', async () => {
    albumMock.getOwned.mockResolvedValue([albumStub.emptyWithInvalidThumbnail]);
    albumMock.getAssetCountForIds.mockResolvedValue([
      { albumId: albumStub.emptyWithInvalidThumbnail.id, assetCount: 1 },
    ]);
    albumMock.getInvalidThumbnail.mockResolvedValue([albumStub.emptyWithInvalidThumbnail.id]);
    albumMock.update.mockResolvedValue(albumStub.emptyWithValidThumbnail);
    assetMock.getFirstAssetForAlbumId.mockResolvedValue(null);

    const result = await sut.getAll(authStub.admin, {});

    expect(result).toHaveLength(1);
    expect(albumMock.getInvalidThumbnail).toHaveBeenCalledTimes(1);
    expect(albumMock.update).toHaveBeenCalledTimes(1);
  });

  describe('create', () => {
    it('creates album', async () => {
      albumMock.create.mockResolvedValue(albumStub.empty);

      await expect(sut.create(authStub.admin, { albumName: 'Empty album' })).resolves.toEqual({
        albumName: 'Empty album',
        description: '',
        albumThumbnailAssetId: null,
        assetCount: 0,
        assets: [],
        createdAt: expect.anything(),
        id: 'album-1',
        owner: {
          email: 'admin@test.com',
          firstName: 'admin_first_name',
          id: 'admin_id',
          isAdmin: true,
          lastName: 'admin_last_name',
          oauthId: '',
          profileImagePath: '',
          shouldChangePassword: false,
          storageLabel: 'admin',
          createdAt: new Date('2021-01-01'),
          deletedAt: null,
          updatedAt: new Date('2021-01-01'),
          externalPath: null,
        },
        ownerId: 'admin_id',
        shared: false,
        sharedUsers: [],
        updatedAt: expect.anything(),
      });

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.SEARCH_INDEX_ALBUM,
        data: { ids: [albumStub.empty.id] },
      });
    });

    it('should require valid userIds', async () => {
      userMock.get.mockResolvedValue(null);
      await expect(
        sut.create(authStub.admin, {
          albumName: 'Empty album',
          sharedWithUserIds: ['user-3'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(userMock.get).toHaveBeenCalledWith('user-3');
      expect(albumMock.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should prevent updating an album that does not exist', async () => {
      albumMock.getById.mockResolvedValue(null);

      await expect(
        sut.update(authStub.user1, 'invalid-id', {
          albumName: 'new album name',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should prevent updating a not owned album (shared with auth user)', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(false);
      await expect(
        sut.update(authStub.admin, albumStub.sharedWithAdmin.id, {
          albumName: 'new album name',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should require a valid thumbnail asset id', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(albumStub.oneAsset);
      albumMock.update.mockResolvedValue(albumStub.oneAsset);
      albumMock.hasAsset.mockResolvedValue(false);

      await expect(
        sut.update(authStub.admin, albumStub.oneAsset.id, {
          albumThumbnailAssetId: 'not-in-album',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(albumMock.hasAsset).toHaveBeenCalledWith(albumStub.oneAsset.id, 'not-in-album');
      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should allow the owner to update the album', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);

      albumMock.getById.mockResolvedValue(albumStub.oneAsset);
      albumMock.update.mockResolvedValue(albumStub.oneAsset);

      await sut.update(authStub.admin, albumStub.oneAsset.id, {
        albumName: 'new album name',
      });

      expect(albumMock.update).toHaveBeenCalledTimes(1);
      expect(albumMock.update).toHaveBeenCalledWith({
        id: 'album-4',
        albumName: 'new album name',
      });
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.SEARCH_INDEX_ALBUM,
        data: { ids: [albumStub.oneAsset.id] },
      });
    });
  });

  describe('delete', () => {
    it('should throw an error for an album not found', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(null);

      await expect(sut.delete(authStub.admin, albumStub.sharedWithAdmin.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(albumMock.delete).not.toHaveBeenCalled();
    });

    it('should not let a shared user delete the album', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(false);
      albumMock.getById.mockResolvedValue(albumStub.sharedWithAdmin);

      await expect(sut.delete(authStub.admin, albumStub.sharedWithAdmin.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(albumMock.delete).not.toHaveBeenCalled();
    });

    it('should let the owner delete an album', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(albumStub.empty);

      await sut.delete(authStub.admin, albumStub.empty.id);

      expect(albumMock.delete).toHaveBeenCalledTimes(1);
      expect(albumMock.delete).toHaveBeenCalledWith(albumStub.empty);
    });
  });

  describe('addUsers', () => {
    it('should throw an error if the auth user is not the owner', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(false);
      await expect(
        sut.addUsers(authStub.admin, albumStub.sharedWithAdmin.id, { sharedUserIds: ['user-1'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should throw an error if the userId is already added', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(albumStub.sharedWithAdmin);
      await expect(
        sut.addUsers(authStub.user1, albumStub.sharedWithAdmin.id, { sharedUserIds: [authStub.admin.id] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should throw an error if the userId does not exist', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(albumStub.sharedWithAdmin);
      userMock.get.mockResolvedValue(null);
      await expect(
        sut.addUsers(authStub.user1, albumStub.sharedWithAdmin.id, { sharedUserIds: ['user-3'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should add valid shared users', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(_.cloneDeep(albumStub.sharedWithAdmin));
      albumMock.update.mockResolvedValue(albumStub.sharedWithAdmin);
      userMock.get.mockResolvedValue(userStub.user2);
      await sut.addUsers(authStub.user1, albumStub.sharedWithAdmin.id, { sharedUserIds: [authStub.user2.id] });
      expect(albumMock.update).toHaveBeenCalledWith({
        id: albumStub.sharedWithAdmin.id,
        updatedAt: expect.any(Date),
        sharedUsers: [userStub.admin, { id: authStub.user2.id }],
      });
    });
  });

  describe('removeUser', () => {
    it('should require a valid album id', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(null);
      await expect(sut.removeUser(authStub.admin, 'album-1', 'user-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should remove a shared user from an owned album', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(albumStub.sharedWithUser);

      await expect(
        sut.removeUser(authStub.admin, albumStub.sharedWithUser.id, userStub.user1.id),
      ).resolves.toBeUndefined();

      expect(albumMock.update).toHaveBeenCalledTimes(1);
      expect(albumMock.update).toHaveBeenCalledWith({
        id: albumStub.sharedWithUser.id,
        updatedAt: expect.any(Date),
        sharedUsers: [],
      });
    });

    it('should prevent removing a shared user from a not-owned album (shared with auth user)', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(false);
      albumMock.getById.mockResolvedValue(albumStub.sharedWithMultiple);

      await expect(
        sut.removeUser(authStub.user1, albumStub.sharedWithMultiple.id, authStub.user2.id),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(albumMock.update).not.toHaveBeenCalled();
      expect(accessMock.album.hasOwnerAccess).toHaveBeenCalledWith(authStub.user1.id, albumStub.sharedWithMultiple.id);
    });

    it('should allow a shared user to remove themselves', async () => {
      albumMock.getById.mockResolvedValue(albumStub.sharedWithUser);

      await sut.removeUser(authStub.user1, albumStub.sharedWithUser.id, authStub.user1.id);

      expect(albumMock.update).toHaveBeenCalledTimes(1);
      expect(albumMock.update).toHaveBeenCalledWith({
        id: albumStub.sharedWithUser.id,
        updatedAt: expect.any(Date),
        sharedUsers: [],
      });
    });

    it('should allow a shared user to remove themselves using "me"', async () => {
      albumMock.getById.mockResolvedValue(albumStub.sharedWithUser);

      await sut.removeUser(authStub.user1, albumStub.sharedWithUser.id, 'me');

      expect(albumMock.update).toHaveBeenCalledTimes(1);
      expect(albumMock.update).toHaveBeenCalledWith({
        id: albumStub.sharedWithUser.id,
        updatedAt: expect.any(Date),
        sharedUsers: [],
      });
    });

    it('should not allow the owner to be removed', async () => {
      albumMock.getById.mockResolvedValue(albumStub.empty);

      await expect(sut.removeUser(authStub.admin, albumStub.empty.id, authStub.admin.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should throw an error for a user not in the album', async () => {
      albumMock.getById.mockResolvedValue(albumStub.empty);

      await expect(sut.removeUser(authStub.admin, albumStub.empty.id, 'user-3')).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(albumMock.update).not.toHaveBeenCalled();
    });
  });

  describe('getAlbumInfo', () => {
    it('should get a shared album', async () => {
      albumMock.getById.mockResolvedValue(albumStub.oneAsset);
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);

      await sut.get(authStub.admin, albumStub.oneAsset.id);

      expect(albumMock.getById).toHaveBeenCalledWith(albumStub.oneAsset.id);
      expect(accessMock.album.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, albumStub.oneAsset.id);
    });

    it('should get a shared album via a shared link', async () => {
      albumMock.getById.mockResolvedValue(albumStub.oneAsset);
      accessMock.album.hasSharedLinkAccess.mockResolvedValue(true);

      await sut.get(authStub.adminSharedLink, 'album-123');

      expect(albumMock.getById).toHaveBeenCalledWith('album-123');
      expect(accessMock.album.hasSharedLinkAccess).toHaveBeenCalledWith(
        authStub.adminSharedLink.sharedLinkId,
        'album-123',
      );
    });

    it('should get a shared album via shared with user', async () => {
      albumMock.getById.mockResolvedValue(albumStub.oneAsset);
      accessMock.album.hasSharedAlbumAccess.mockResolvedValue(true);

      await sut.get(authStub.user1, 'album-123');

      expect(albumMock.getById).toHaveBeenCalledWith('album-123');
      expect(accessMock.album.hasSharedAlbumAccess).toHaveBeenCalledWith(authStub.user1.id, 'album-123');
    });

    it('should throw an error for no access', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(false);
      accessMock.album.hasSharedAlbumAccess.mockResolvedValue(false);

      await expect(sut.get(authStub.admin, 'album-123')).rejects.toBeInstanceOf(BadRequestException);

      expect(accessMock.album.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'album-123');
      expect(accessMock.album.hasSharedAlbumAccess).toHaveBeenCalledWith(authStub.admin.id, 'album-123');
    });
  });

  describe('addAssets', () => {
    it('should allow the owner to add assets', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(_.cloneDeep(albumStub.oneAsset));

      await expect(
        sut.addAssets(authStub.admin, 'album-123', { ids: ['asset-1', 'asset-2', 'asset-3'] }),
      ).resolves.toEqual([
        { success: true, id: 'asset-1' },
        { success: true, id: 'asset-2' },
        { success: true, id: 'asset-3' },
      ]);

      expect(albumMock.update).toHaveBeenCalledWith({
        id: 'album-123',
        updatedAt: expect.any(Date),
        assets: [assetStub.image, { id: 'asset-1' }, { id: 'asset-2' }, { id: 'asset-3' }],
        albumThumbnailAssetId: 'asset-1',
      });
    });

    it('should not set the thumbnail if the album has one already', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(_.cloneDeep({ ...albumStub.empty, albumThumbnailAssetId: 'asset-id' }));

      await expect(sut.addAssets(authStub.admin, 'album-123', { ids: ['asset-1'] })).resolves.toEqual([
        { success: true, id: 'asset-1' },
      ]);

      expect(albumMock.update).toHaveBeenCalledWith({
        id: 'album-123',
        updatedAt: expect.any(Date),
        assets: [{ id: 'asset-1' }],
        albumThumbnailAssetId: 'asset-id',
      });
    });

    it('should allow a shared user to add assets', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(false);
      accessMock.album.hasSharedAlbumAccess.mockResolvedValue(true);
      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(_.cloneDeep(albumStub.sharedWithUser));

      await expect(
        sut.addAssets(authStub.user1, 'album-123', { ids: ['asset-1', 'asset-2', 'asset-3'] }),
      ).resolves.toEqual([
        { success: true, id: 'asset-1' },
        { success: true, id: 'asset-2' },
        { success: true, id: 'asset-3' },
      ]);

      expect(albumMock.update).toHaveBeenCalledWith({
        id: 'album-123',
        updatedAt: expect.any(Date),
        assets: [{ id: 'asset-1' }, { id: 'asset-2' }, { id: 'asset-3' }],
        albumThumbnailAssetId: 'asset-1',
      });
    });

    it('should allow a shared link user to add assets', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(false);
      accessMock.album.hasSharedAlbumAccess.mockResolvedValue(false);
      accessMock.album.hasSharedLinkAccess.mockResolvedValue(true);
      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(_.cloneDeep(albumStub.oneAsset));

      await expect(
        sut.addAssets(authStub.adminSharedLink, 'album-123', { ids: ['asset-1', 'asset-2', 'asset-3'] }),
      ).resolves.toEqual([
        { success: true, id: 'asset-1' },
        { success: true, id: 'asset-2' },
        { success: true, id: 'asset-3' },
      ]);

      expect(albumMock.update).toHaveBeenCalledWith({
        id: 'album-123',
        updatedAt: expect.any(Date),
        assets: [assetStub.image, { id: 'asset-1' }, { id: 'asset-2' }, { id: 'asset-3' }],
        albumThumbnailAssetId: 'asset-1',
      });

      expect(accessMock.album.hasSharedLinkAccess).toHaveBeenCalledWith(
        authStub.adminSharedLink.sharedLinkId,
        'album-123',
      );
    });

    it('should allow adding assets shared via partner sharing', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      accessMock.asset.hasOwnerAccess.mockResolvedValue(false);
      accessMock.asset.hasPartnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(_.cloneDeep(albumStub.oneAsset));

      await expect(sut.addAssets(authStub.admin, 'album-123', { ids: ['asset-1'] })).resolves.toEqual([
        { success: true, id: 'asset-1' },
      ]);

      expect(albumMock.update).toHaveBeenCalledWith({
        id: 'album-123',
        updatedAt: expect.any(Date),
        assets: [assetStub.image, { id: 'asset-1' }],
        albumThumbnailAssetId: 'asset-1',
      });

      expect(accessMock.asset.hasPartnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'asset-1');
    });

    it('should skip duplicate assets', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(_.cloneDeep(albumStub.oneAsset));

      await expect(sut.addAssets(authStub.admin, 'album-123', { ids: ['asset-id'] })).resolves.toEqual([
        { success: false, id: 'asset-id', error: BulkIdErrorReason.DUPLICATE },
      ]);

      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should skip assets not shared with user', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      accessMock.asset.hasOwnerAccess.mockResolvedValue(false);
      accessMock.asset.hasPartnerAccess.mockResolvedValue(false);
      albumMock.getById.mockResolvedValue(albumStub.oneAsset);

      await expect(sut.addAssets(authStub.admin, 'album-123', { ids: ['asset-1'] })).resolves.toEqual([
        { success: false, id: 'asset-1', error: BulkIdErrorReason.NO_PERMISSION },
      ]);

      expect(accessMock.asset.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'asset-1');
      expect(accessMock.asset.hasPartnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'asset-1');
    });

    it('should not allow unauthorized access to the album', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(false);
      accessMock.album.hasSharedAlbumAccess.mockResolvedValue(false);
      albumMock.getById.mockResolvedValue(albumStub.oneAsset);

      await expect(
        sut.addAssets(authStub.admin, 'album-123', { ids: ['asset-1', 'asset-2', 'asset-3'] }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(accessMock.album.hasOwnerAccess).toHaveBeenCalled();
      expect(accessMock.album.hasSharedAlbumAccess).toHaveBeenCalled();
    });

    it('should not allow unauthorized shared link access to the album', async () => {
      accessMock.album.hasSharedLinkAccess.mockResolvedValue(false);
      albumMock.getById.mockResolvedValue(albumStub.oneAsset);

      await expect(
        sut.addAssets(authStub.adminSharedLink, 'album-123', { ids: ['asset-1', 'asset-2', 'asset-3'] }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(accessMock.album.hasSharedLinkAccess).toHaveBeenCalled();
    });
  });

  describe('removeAssets', () => {
    it('should allow the owner to remove assets', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(_.cloneDeep(albumStub.oneAsset));

      await expect(sut.removeAssets(authStub.admin, 'album-123', { ids: ['asset-id'] })).resolves.toEqual([
        { success: true, id: 'asset-id' },
      ]);

      expect(albumMock.update).toHaveBeenCalledWith({
        id: 'album-123',
        updatedAt: expect.any(Date),
        assets: [],
        albumThumbnailAssetId: null,
      });
    });

    it('should skip assets not in the album', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(_.cloneDeep(albumStub.empty));

      await expect(sut.removeAssets(authStub.admin, 'album-123', { ids: ['asset-id'] })).resolves.toEqual([
        { success: false, id: 'asset-id', error: BulkIdErrorReason.NOT_FOUND },
      ]);

      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should skip assets without user permission to remove', async () => {
      accessMock.album.hasSharedAlbumAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(_.cloneDeep(albumStub.oneAsset));

      await expect(sut.removeAssets(authStub.admin, 'album-123', { ids: ['asset-id'] })).resolves.toEqual([
        { success: false, id: 'asset-id', error: BulkIdErrorReason.NO_PERMISSION },
      ]);

      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should reset the thumbnail if it is removed', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      albumMock.getById.mockResolvedValue(_.cloneDeep(albumStub.twoAssets));

      await expect(sut.removeAssets(authStub.admin, 'album-123', { ids: ['asset-id'] })).resolves.toEqual([
        { success: true, id: 'asset-id' },
      ]);

      expect(albumMock.update).toHaveBeenCalledWith({
        id: 'album-123',
        updatedAt: expect.any(Date),
        assets: [assetStub.withLocation],
        albumThumbnailAssetId: assetStub.withLocation.id,
      });
    });
  });

  // // it('removes assets from shared album (shared with auth user)', async () => {
  // //   const albumEntity = _getOwnedSharedAlbum();
  // //   albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
  // //   albumRepositoryMock.removeAssets.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));

  // //   await expect(
  // //     sut.removeAssetsFromAlbum(
  // //       authUser,
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

  //   await expect(sut.removeAssets(authUser, albumId, { ids: ['1'] })).rejects.toBeInstanceOf(ForbiddenException);
  // });
});

import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  albumStub,
  authStub,
  newAlbumRepositoryMock,
  newAssetRepositoryMock,
  newJobRepositoryMock,
  newUserRepositoryMock,
  userEntityStub,
} from '@test';
import _ from 'lodash';
import { IAssetRepository } from '../asset';
import { IJobRepository, JobName } from '../job';
import { IUserRepository } from '../user';
import { IAlbumRepository } from './album.repository';
import { AlbumService } from './album.service';

describe(AlbumService.name, () => {
  let sut: AlbumService;
  let albumMock: jest.Mocked<IAlbumRepository>;
  let assetMock: jest.Mocked<IAssetRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let userMock: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    albumMock = newAlbumRepositoryMock();
    assetMock = newAssetRepositoryMock();
    jobMock = newJobRepositoryMock();
    userMock = newUserRepositoryMock();

    sut = new AlbumService(albumMock, assetMock, jobMock, userMock);
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
      albumMock.getByIds.mockResolvedValue([]);

      await expect(
        sut.update(authStub.user1, 'invalid-id', {
          albumName: 'new album name',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should prevent updating a not owned album (shared with auth user)', async () => {
      albumMock.getByIds.mockResolvedValue([albumStub.sharedWithAdmin]);

      await expect(
        sut.update(authStub.admin, albumStub.sharedWithAdmin.id, {
          albumName: 'new album name',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should require a valid thumbnail asset id', async () => {
      albumMock.getByIds.mockResolvedValue([albumStub.oneAsset]);
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
      albumMock.getByIds.mockResolvedValue([albumStub.oneAsset]);
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
      albumMock.getByIds.mockResolvedValue([]);

      await expect(sut.delete(authStub.admin, albumStub.sharedWithAdmin.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(albumMock.delete).not.toHaveBeenCalled();
    });

    it('should not let a shared user delete the album', async () => {
      albumMock.getByIds.mockResolvedValue([albumStub.sharedWithAdmin]);

      await expect(sut.delete(authStub.admin, albumStub.sharedWithAdmin.id)).rejects.toBeInstanceOf(ForbiddenException);

      expect(albumMock.delete).not.toHaveBeenCalled();
    });

    it('should let the owner delete an album', async () => {
      albumMock.getByIds.mockResolvedValue([albumStub.empty]);

      await sut.delete(authStub.admin, albumStub.empty.id);

      expect(albumMock.delete).toHaveBeenCalledTimes(1);
      expect(albumMock.delete).toHaveBeenCalledWith(albumStub.empty);
    });
  });

  describe('addUsers', () => {
    it('should require a valid album id', async () => {
      albumMock.getByIds.mockResolvedValue([]);
      await expect(sut.addUsers(authStub.admin, 'album-1', { sharedUserIds: ['user-1'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should require the user to be the owner', async () => {
      albumMock.getByIds.mockResolvedValue([albumStub.sharedWithAdmin]);
      await expect(
        sut.addUsers(authStub.admin, albumStub.sharedWithAdmin.id, { sharedUserIds: ['user-1'] }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should throw an error if the userId is already added', async () => {
      albumMock.getByIds.mockResolvedValue([albumStub.sharedWithAdmin]);
      await expect(
        sut.addUsers(authStub.user1, albumStub.sharedWithAdmin.id, { sharedUserIds: [authStub.admin.id] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should throw an error if the userId does not exist', async () => {
      albumMock.getByIds.mockResolvedValue([albumStub.sharedWithAdmin]);
      userMock.get.mockResolvedValue(null);
      await expect(
        sut.addUsers(authStub.user1, albumStub.sharedWithAdmin.id, { sharedUserIds: ['user-3'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should add valid shared users', async () => {
      albumMock.getByIds.mockResolvedValue([_.cloneDeep(albumStub.sharedWithAdmin)]);
      albumMock.update.mockResolvedValue(albumStub.sharedWithAdmin);
      userMock.get.mockResolvedValue(userEntityStub.user2);
      await sut.addUsers(authStub.user1, albumStub.sharedWithAdmin.id, { sharedUserIds: [authStub.user2.id] });
      expect(albumMock.update).toHaveBeenCalledWith({
        id: albumStub.sharedWithAdmin.id,
        updatedAt: expect.any(Date),
        sharedUsers: [userEntityStub.admin, { id: authStub.user2.id }],
      });
    });
  });

  describe('removeUser', () => {
    it('should require a valid album id', async () => {
      albumMock.getByIds.mockResolvedValue([]);
      await expect(sut.removeUser(authStub.admin, 'album-1', 'user-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should remove a shared user from an owned album', async () => {
      albumMock.getByIds.mockResolvedValue([albumStub.sharedWithUser]);

      await expect(
        sut.removeUser(authStub.admin, albumStub.sharedWithUser.id, userEntityStub.user1.id),
      ).resolves.toBeUndefined();

      expect(albumMock.update).toHaveBeenCalledTimes(1);
      expect(albumMock.update).toHaveBeenCalledWith({
        id: albumStub.sharedWithUser.id,
        updatedAt: expect.any(Date),
        sharedUsers: [],
      });
    });

    it('should prevent removing a shared user from a not-owned album (shared with auth user)', async () => {
      albumMock.getByIds.mockResolvedValue([albumStub.sharedWithMultiple]);

      await expect(
        sut.removeUser(authStub.user1, albumStub.sharedWithMultiple.id, authStub.user2.id),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should allow a shared user to remove themselves', async () => {
      albumMock.getByIds.mockResolvedValue([albumStub.sharedWithUser]);

      await sut.removeUser(authStub.user1, albumStub.sharedWithUser.id, authStub.user1.id);

      expect(albumMock.update).toHaveBeenCalledTimes(1);
      expect(albumMock.update).toHaveBeenCalledWith({
        id: albumStub.sharedWithUser.id,
        updatedAt: expect.any(Date),
        sharedUsers: [],
      });
    });

    it('should allow a shared user to remove themselves using "me"', async () => {
      albumMock.getByIds.mockResolvedValue([albumStub.sharedWithUser]);

      await sut.removeUser(authStub.user1, albumStub.sharedWithUser.id, 'me');

      expect(albumMock.update).toHaveBeenCalledTimes(1);
      expect(albumMock.update).toHaveBeenCalledWith({
        id: albumStub.sharedWithUser.id,
        updatedAt: expect.any(Date),
        sharedUsers: [],
      });
    });

    it('should not allow the owner to be removed', async () => {
      albumMock.getByIds.mockResolvedValue([albumStub.empty]);

      await expect(sut.removeUser(authStub.admin, albumStub.empty.id, authStub.admin.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(albumMock.update).not.toHaveBeenCalled();
    });

    it('should throw an error for a user not in the album', async () => {
      albumMock.getByIds.mockResolvedValue([albumStub.empty]);

      await expect(sut.removeUser(authStub.admin, albumStub.empty.id, 'user-3')).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(albumMock.update).not.toHaveBeenCalled();
    });
  });
});

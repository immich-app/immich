import { AlbumService } from './album.service';
import { IAlbumRepository } from './album-repository';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AlbumEntity } from '@app/database/entities/album.entity';
import { Album } from './response-dto/album';

describe('Album service', () => {
  let sut: AlbumService;
  let albumRepositoryMock: jest.Mocked<IAlbumRepository>;
  const authUser: AuthUserDto = Object.freeze({
    id: '1111',
    email: 'auth@test.com',
  });
  const albumId = '0001';
  const sharedAlbumOwnerId = '2222';
  const sharedAlbumSharedAlsoWithId = '2222';
  const ownedAlbumSharedWithId = '3333';

  const _getOwnedAlbum = () => {
    const albumEntity = new AlbumEntity();
    albumEntity.ownerId = authUser.id;
    albumEntity.id = albumId;
    albumEntity.albumName = 'name';
    albumEntity.createdAt = 'date';
    albumEntity.sharedUsers = [];
    albumEntity.sharedAssets = [];

    return albumEntity;
  };

  const _getOwnedSharedAlbum = () => {
    const albumEntity = new AlbumEntity();
    albumEntity.ownerId = authUser.id;
    albumEntity.id = albumId;
    albumEntity.albumName = 'name';
    albumEntity.createdAt = 'date';
    albumEntity.sharedAssets = [];
    albumEntity.sharedUsers = [
      {
        id: '99',
        albumId,
        sharedUserId: ownedAlbumSharedWithId,
        //@ts-expect-error Partial stub
        albumInfo: {},
        //@ts-expect-error Partial stub
        userInfo: {
          id: ownedAlbumSharedWithId,
        },
      },
    ];

    return albumEntity;
  };

  const _getSharedWithAuthUserAlbum = () => {
    const albumEntity = new AlbumEntity();
    albumEntity.ownerId = sharedAlbumOwnerId;
    albumEntity.id = albumId;
    albumEntity.albumName = 'name';
    albumEntity.createdAt = 'date';
    albumEntity.sharedAssets = [];
    albumEntity.sharedUsers = [
      {
        id: '99',
        albumId,
        sharedUserId: authUser.id,
        //@ts-expect-error Partial stub
        albumInfo: {},
        //@ts-expect-error Partial stub
        userInfo: {
          id: authUser.id,
        },
      },
      {
        id: '98',
        albumId,
        sharedUserId: sharedAlbumSharedAlsoWithId,
        //@ts-expect-error Partial stub
        albumInfo: {},
        //@ts-expect-error Partial stub
        userInfo: {
          id: sharedAlbumSharedAlsoWithId,
        },
      },
    ];

    return albumEntity;
  };

  const _getNotOwnedNotSharedAlbum = () => {
    const albumEntity = new AlbumEntity();
    albumEntity.ownerId = '4444';
    albumEntity.id = albumId;
    albumEntity.albumName = 'name';
    albumEntity.createdAt = 'date';
    albumEntity.sharedUsers = [];
    albumEntity.sharedAssets = [];

    return albumEntity;
  };

  beforeAll(() => {
    albumRepositoryMock = {
      addAssets: jest.fn(),
      addSharedUsers: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
      getList: jest.fn(),
      removeAssets: jest.fn(),
      removeUser: jest.fn(),
      updateAlbum: jest.fn(),
    };
    sut = new AlbumService(albumRepositoryMock);
  });

  it('gets an owned album', async () => {
    const ownerId = authUser.id;
    const albumId = '0001';

    const albumEntity = _getOwnedAlbum();
    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));

    const expectedResult: Album = {
      albumName: 'name',
      albumThumbnailAssetId: undefined,
      createdAt: 'date',
      id: '0001',
      ownerId,
      shared: false,
      sharedAssets: [],
      sharedUsers: [],
    };
    await expect(sut.getAlbumInfo(authUser, albumId)).resolves.toEqual(expectedResult);
  });

  it('gets a shared album', async () => {
    const albumEntity = _getSharedWithAuthUserAlbum();
    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));

    const result = await sut.getAlbumInfo(authUser, albumId);
    expect(result.id).toEqual(albumId);
    expect(result.ownerId).toEqual(sharedAlbumOwnerId);
    expect(result.shared).toEqual(true);
    expect(result.sharedUsers).toHaveLength(2);
    expect(result.sharedUsers[0].id).toEqual(authUser.id);
    expect(result.sharedUsers[1].id).toEqual(sharedAlbumSharedAlsoWithId);
  });

  it('prevents retrieving an album that is not owned or shared', async () => {
    const albumEntity = _getNotOwnedNotSharedAlbum();
    const albumId = albumEntity.id;

    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
    await expect(sut.getAlbumInfo(authUser, albumId)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws a not found exception if the album is not found', async () => {
    albumRepositoryMock.get.mockImplementation(() => Promise.resolve(undefined));
    await expect(sut.getAlbumInfo(authUser, '0002')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes a shared user from an owned album', async () => {
    const albumEntity = _getOwnedSharedAlbum();
    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
    albumRepositoryMock.removeUser.mockImplementation(() => Promise.resolve());
    await expect(sut.removeUserFromAlbum(authUser, albumEntity.id, ownedAlbumSharedWithId)).resolves.toBeUndefined();
    expect(albumRepositoryMock.removeUser).toHaveBeenCalledTimes(1);
    expect(albumRepositoryMock.removeUser).toHaveBeenCalledWith(albumEntity, ownedAlbumSharedWithId);
  });

  it('prevents removing a shared user from a not owned album (shared with auth user)', async () => {
    const albumEntity = _getSharedWithAuthUserAlbum();
    const albumId = albumEntity.id;
    const userIdToRemove = sharedAlbumSharedAlsoWithId;

    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));

    await expect(sut.removeUserFromAlbum(authUser, albumId, userIdToRemove)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(albumRepositoryMock.removeUser).not.toHaveBeenCalled();
  });

  it('updates a owned album', async () => {
    const albumEntity = _getOwnedAlbum();
    const albumId = albumEntity.id;
    const updatedAlbumName = 'new album name';

    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
    albumRepositoryMock.updateAlbum.mockImplementation(() =>
      Promise.resolve<AlbumEntity>({ ...albumEntity, albumName: updatedAlbumName }),
    );

    const result = await sut.updateAlbumTitle(
      authUser,
      {
        albumName: updatedAlbumName,
        ownerId: 'this is not used and will be removed',
      },
      albumId,
    );

    expect(result.id).toEqual(albumId);
    expect(result.albumName).toEqual(updatedAlbumName);
    expect(albumRepositoryMock.updateAlbum).toHaveBeenCalledTimes(1);
    expect(albumRepositoryMock.updateAlbum).toHaveBeenCalledWith(albumEntity, {
      albumName: updatedAlbumName,
      ownerId: 'this is not used and will be removed',
    });
  });

  it('prevents updating a not owned album (shared with auth user)', async () => {
    const albumEntity = _getSharedWithAuthUserAlbum();
    const albumId = albumEntity.id;

    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));

    await expect(
      sut.updateAlbumTitle(
        authUser,
        {
          albumName: 'new album name',
          ownerId: 'this is not used and will be removed',
        },
        albumId,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('adds assets to owned album', async () => {
    const albumEntity = _getOwnedAlbum();
    const albumId = albumEntity.id;

    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
    albumRepositoryMock.addAssets.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));

    const result = await sut.addAssetsToAlbum(
      authUser,
      {
        assetIds: ['1'],
      },
      albumId,
    );

    // TODO: stub and expect album rendered
    expect(result.id).toEqual(albumId);
  });

  it('adds assets to shared album (shared with auth user)', async () => {
    const albumEntity = _getSharedWithAuthUserAlbum();
    const albumId = albumEntity.id;

    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
    albumRepositoryMock.addAssets.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));

    const result = await sut.addAssetsToAlbum(
      authUser,
      {
        assetIds: ['1'],
      },
      albumId,
    );

    // TODO: stub and expect album rendered
    expect(result.id).toEqual(albumId);
  });

  it('prevents adding assets to a not owned / shared album', async () => {
    const albumEntity = _getNotOwnedNotSharedAlbum();
    const albumId = albumEntity.id;

    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
    albumRepositoryMock.addAssets.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));

    expect(
      sut.addAssetsToAlbum(
        authUser,
        {
          assetIds: ['1'],
        },
        albumId,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

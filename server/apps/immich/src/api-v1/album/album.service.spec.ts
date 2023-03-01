import { AlbumService } from './album.service';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AlbumEntity, AssetEntity, UserEntity } from '@app/infra';
import { AlbumResponseDto, ICryptoRepository, IJobRepository, JobName, mapUser } from '@app/domain';
import { AddAssetsResponseDto } from './response-dto/add-assets-response.dto';
import { IAlbumRepository } from './album-repository';
import { DownloadService } from '../../modules/download/download.service';
import { ISharedLinkRepository } from '@app/domain';
import {
  assetEntityStub,
  newCryptoRepositoryMock,
  newJobRepositoryMock,
  newSharedLinkRepositoryMock,
  userEntityStub,
} from '@app/domain/../test';

describe('Album service', () => {
  let sut: AlbumService;
  let albumRepositoryMock: jest.Mocked<IAlbumRepository>;
  let sharedLinkRepositoryMock: jest.Mocked<ISharedLinkRepository>;
  let downloadServiceMock: jest.Mocked<Partial<DownloadService>>;
  let cryptoMock: jest.Mocked<ICryptoRepository>;
  let jobMock: jest.Mocked<IJobRepository>;

  const authUser: AuthUserDto = Object.freeze({
    id: '1111',
    email: 'auth@test.com',
    isAdmin: false,
  });

  const albumOwner: UserEntity = Object.freeze({
    ...authUser,
    firstName: 'auth',
    lastName: 'user',
    createdAt: 'date',
    updatedAt: 'date',
    profileImagePath: '',
    shouldChangePassword: false,
    oauthId: '',
    tags: [],
    assets: [],
  });
  const albumId = 'f19ab956-4761-41ea-a5d6-bae948308d58';
  const sharedAlbumOwnerId = '2222';
  const sharedAlbumSharedAlsoWithId = '3333';
  const ownedAlbumSharedWithId = '4444';

  const _getOwnedAlbum = () => {
    const albumEntity = new AlbumEntity();
    albumEntity.ownerId = albumOwner.id;
    albumEntity.owner = albumOwner;
    albumEntity.id = albumId;
    albumEntity.albumName = 'name';
    albumEntity.createdAt = 'date';
    albumEntity.updatedAt = 'date';
    albumEntity.sharedUsers = [];
    albumEntity.assets = [];
    albumEntity.albumThumbnailAssetId = null;
    albumEntity.sharedLinks = [];
    return albumEntity;
  };

  const _getOwnedSharedAlbum = () => {
    const albumEntity = new AlbumEntity();
    albumEntity.ownerId = albumOwner.id;
    albumEntity.owner = albumOwner;
    albumEntity.id = albumId;
    albumEntity.albumName = 'name';
    albumEntity.createdAt = 'date';
    albumEntity.assets = [];
    albumEntity.albumThumbnailAssetId = null;
    albumEntity.sharedUsers = [
      {
        ...userEntityStub.user1,
        id: ownedAlbumSharedWithId,
      },
    ];

    return albumEntity;
  };

  const _getSharedWithAuthUserAlbum = () => {
    const albumEntity = new AlbumEntity();
    albumEntity.ownerId = sharedAlbumOwnerId;
    albumEntity.owner = albumOwner;
    albumEntity.id = albumId;
    albumEntity.albumName = 'name';
    albumEntity.createdAt = 'date';
    albumEntity.assets = [];
    albumEntity.albumThumbnailAssetId = null;
    albumEntity.sharedUsers = [
      {
        ...userEntityStub.user1,
        id: authUser.id,
      },
      {
        ...userEntityStub.user1,
        id: sharedAlbumSharedAlsoWithId,
      },
    ];
    albumEntity.sharedLinks = [];

    return albumEntity;
  };

  const _getNotOwnedNotSharedAlbum = () => {
    const albumEntity = new AlbumEntity();
    albumEntity.ownerId = '5555';
    albumEntity.id = albumId;
    albumEntity.albumName = 'name';
    albumEntity.createdAt = 'date';
    albumEntity.sharedUsers = [];
    albumEntity.assets = [];
    albumEntity.albumThumbnailAssetId = null;

    return albumEntity;
  };

  beforeAll(() => {
    albumRepositoryMock = {
      getPublicSharingList: jest.fn(),
      addAssets: jest.fn(),
      addSharedUsers: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
      getList: jest.fn(),
      removeAssets: jest.fn(),
      removeUser: jest.fn(),
      updateAlbum: jest.fn(),
      getListByAssetId: jest.fn(),
      getCountByUserId: jest.fn(),
      getSharedWithUserAlbumCount: jest.fn(),
    };

    sharedLinkRepositoryMock = newSharedLinkRepositoryMock();

    downloadServiceMock = {
      downloadArchive: jest.fn(),
    };

    cryptoMock = newCryptoRepositoryMock();
    jobMock = newJobRepositoryMock();

    sut = new AlbumService(
      albumRepositoryMock,
      sharedLinkRepositoryMock,
      downloadServiceMock as DownloadService,
      cryptoMock,
      jobMock,
    );
  });

  it('creates album', async () => {
    const albumEntity = _getOwnedAlbum();
    albumRepositoryMock.create.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));

    const result = await sut.create(authUser, {
      albumName: albumEntity.albumName,
    });

    expect(result.id).toEqual(albumEntity.id);
    expect(result.albumName).toEqual(albumEntity.albumName);
    expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.SEARCH_INDEX_ALBUM, data: { album: albumEntity } });
  });

  it('gets list of albums for auth user', async () => {
    const ownedAlbum = _getOwnedAlbum();
    const ownedSharedAlbum = _getOwnedSharedAlbum();
    const sharedWithMeAlbum = _getSharedWithAuthUserAlbum();
    const albums: AlbumEntity[] = [ownedAlbum, ownedSharedAlbum, sharedWithMeAlbum];

    albumRepositoryMock.getList.mockImplementation(() => Promise.resolve(albums));

    const result = await sut.getAllAlbums(authUser, {});
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(ownedAlbum.id);
  });

  it('gets an owned album', async () => {
    const albumId = 'f19ab956-4761-41ea-a5d6-bae948308d58';

    const albumEntity = _getOwnedAlbum();
    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));

    const expectedResult: AlbumResponseDto = {
      ownerId: albumOwner.id,
      owner: mapUser(albumOwner),
      id: albumId,
      albumName: 'name',
      createdAt: 'date',
      updatedAt: 'date',
      sharedUsers: [],
      assets: [],
      albumThumbnailAssetId: null,
      shared: false,
      assetCount: 0,
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
    await expect(sut.getAlbumInfo(authUser, albumId)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws a not found exception if the album is not found', async () => {
    albumRepositoryMock.get.mockImplementation(() => Promise.resolve(null));
    await expect(sut.getAlbumInfo(authUser, '0002')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes an owned album', async () => {
    const albumEntity = _getOwnedAlbum();
    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
    albumRepositoryMock.delete.mockImplementation(() => Promise.resolve());
    await sut.deleteAlbum(authUser, albumId);
    expect(albumRepositoryMock.delete).toHaveBeenCalledTimes(1);
    expect(albumRepositoryMock.delete).toHaveBeenCalledWith(albumEntity);
  });

  it('prevents deleting a shared album (shared with auth user)', async () => {
    const albumEntity = _getSharedWithAuthUserAlbum();
    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
    await expect(sut.deleteAlbum(authUser, albumId)).rejects.toBeInstanceOf(ForbiddenException);
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

    await expect(sut.removeUserFromAlbum(authUser, albumId, userIdToRemove)).rejects.toBeInstanceOf(ForbiddenException);
    expect(albumRepositoryMock.removeUser).not.toHaveBeenCalled();
  });

  it('removes itself from a shared album', async () => {
    const albumEntity = _getSharedWithAuthUserAlbum();
    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
    albumRepositoryMock.removeUser.mockImplementation(() => Promise.resolve());

    await sut.removeUserFromAlbum(authUser, albumEntity.id, authUser.id);
    expect(albumRepositoryMock.removeUser).toHaveReturnedTimes(1);
    expect(albumRepositoryMock.removeUser).toHaveBeenCalledWith(albumEntity, authUser.id);
  });

  it('removes itself from a shared album using "me" as id', async () => {
    const albumEntity = _getSharedWithAuthUserAlbum();
    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
    albumRepositoryMock.removeUser.mockImplementation(() => Promise.resolve());

    await sut.removeUserFromAlbum(authUser, albumEntity.id, 'me');
    expect(albumRepositoryMock.removeUser).toHaveReturnedTimes(1);
    expect(albumRepositoryMock.removeUser).toHaveBeenCalledWith(albumEntity, authUser.id);
  });

  it('prevents removing itself from a owned album', async () => {
    const albumEntity = _getOwnedAlbum();
    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));

    await expect(sut.removeUserFromAlbum(authUser, albumEntity.id, authUser.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('updates a owned album', async () => {
    const albumEntity = _getOwnedAlbum();
    const albumId = albumEntity.id;
    const updatedAlbumName = 'new album name';
    const updatedAlbumThumbnailAssetId = '69d2f917-0b31-48d8-9d7d-673b523f1aac';
    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
    const updatedAlbum = { ...albumEntity, albumName: updatedAlbumName };
    albumRepositoryMock.updateAlbum.mockResolvedValue(updatedAlbum);

    const result = await sut.updateAlbumInfo(
      authUser,
      {
        albumName: updatedAlbumName,
        albumThumbnailAssetId: updatedAlbumThumbnailAssetId,
      },
      albumId,
    );

    expect(result.id).toEqual(albumId);
    expect(result.albumName).toEqual(updatedAlbumName);
    expect(albumRepositoryMock.updateAlbum).toHaveBeenCalledTimes(1);
    expect(albumRepositoryMock.updateAlbum).toHaveBeenCalledWith(albumEntity, {
      albumName: updatedAlbumName,
      albumThumbnailAssetId: updatedAlbumThumbnailAssetId,
    });
    expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.SEARCH_INDEX_ALBUM, data: { album: updatedAlbum } });
  });

  it('prevents updating a not owned album (shared with auth user)', async () => {
    const albumEntity = _getSharedWithAuthUserAlbum();
    const albumId = albumEntity.id;

    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));

    await expect(
      sut.updateAlbumInfo(
        authUser,
        {
          albumName: 'new album name',
          albumThumbnailAssetId: '69d2f917-0b31-48d8-9d7d-673b523f1aac',
        },
        albumId,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('adds assets to owned album', async () => {
    const albumEntity = _getOwnedAlbum();

    const albumResponse: AddAssetsResponseDto = {
      alreadyInAlbum: [],
      successfullyAdded: 1,
    };

    const albumId = albumEntity.id;

    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
    albumRepositoryMock.addAssets.mockImplementation(() => Promise.resolve<AddAssetsResponseDto>(albumResponse));

    const result = (await sut.addAssetsToAlbum(
      authUser,
      {
        assetIds: ['1'],
      },
      albumId,
    )) as AddAssetsResponseDto;

    // TODO: stub and expect album rendered
    expect(result.album?.id).toEqual(albumId);
  });

  it('adds assets to shared album (shared with auth user)', async () => {
    const albumEntity = _getSharedWithAuthUserAlbum();

    const albumResponse: AddAssetsResponseDto = {
      alreadyInAlbum: [],
      successfullyAdded: 1,
    };

    const albumId = albumEntity.id;

    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
    albumRepositoryMock.addAssets.mockImplementation(() => Promise.resolve<AddAssetsResponseDto>(albumResponse));

    const result = (await sut.addAssetsToAlbum(
      authUser,
      {
        assetIds: ['1'],
      },
      albumId,
    )) as AddAssetsResponseDto;

    // TODO: stub and expect album rendered
    expect(result.album?.id).toEqual(albumId);
  });

  it('prevents adding assets to a not owned / shared album', async () => {
    const albumEntity = _getNotOwnedNotSharedAlbum();

    const albumResponse: AddAssetsResponseDto = {
      alreadyInAlbum: [],
      successfullyAdded: 1,
    };

    const albumId = albumEntity.id;

    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
    albumRepositoryMock.addAssets.mockImplementation(() => Promise.resolve<AddAssetsResponseDto>(albumResponse));

    await expect(
      sut.addAssetsToAlbum(
        authUser,
        {
          assetIds: ['1'],
        },
        albumId,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  // it('removes assets from owned album', async () => {
  //   const albumEntity = _getOwnedAlbum();
  //   albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
  //   albumRepositoryMock.removeAssets.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));

  //   await expect(
  //     sut.removeAssetsFromAlbum(
  //       authUser,
  //       {
  //         assetIds: ['f19ab956-4761-41ea-a5d6-bae948308d60'],
  //       },
  //       albumEntity.id,
  //     ),
  //   ).resolves.toBeUndefined();
  //   expect(albumRepositoryMock.removeAssets).toHaveBeenCalledTimes(1);
  //   expect(albumRepositoryMock.removeAssets).toHaveBeenCalledWith(albumEntity, {
  //     assetIds: ['f19ab956-4761-41ea-a5d6-bae948308d60'],
  //   });
  // });

  // it('removes assets from shared album (shared with auth user)', async () => {
  //   const albumEntity = _getOwnedSharedAlbum();
  //   albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
  //   albumRepositoryMock.removeAssets.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));

  //   await expect(
  //     sut.removeAssetsFromAlbum(
  //       authUser,
  //       {
  //         assetIds: ['1'],
  //       },
  //       albumEntity.id,
  //     ),
  //   ).resolves.toBeUndefined();
  //   expect(albumRepositoryMock.removeAssets).toHaveBeenCalledTimes(1);
  //   expect(albumRepositoryMock.removeAssets).toHaveBeenCalledWith(albumEntity, {
  //     assetIds: ['1'],
  //   });
  // });

  it('prevents removing assets from a not owned / shared album', async () => {
    const albumEntity = _getNotOwnedNotSharedAlbum();

    const albumResponse: AddAssetsResponseDto = {
      alreadyInAlbum: [],
      successfullyAdded: 1,
    };

    const albumId = albumEntity.id;

    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));
    albumRepositoryMock.addAssets.mockImplementation(() => Promise.resolve<AddAssetsResponseDto>(albumResponse));

    await expect(
      sut.removeAssetsFromAlbum(
        authUser,
        {
          assetIds: ['1'],
        },
        albumId,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('counts assets correctly', async () => {
    const albumEntity = new AlbumEntity();

    albumEntity.ownerId = authUser.id;
    albumEntity.owner = albumOwner;
    albumEntity.id = albumId;
    albumEntity.albumName = 'name';
    albumEntity.createdAt = 'date';
    albumEntity.sharedUsers = [];
    albumEntity.assets = [
      {
        ...assetEntityStub.image,
        id: '3',
      },
    ];
    albumEntity.albumThumbnailAssetId = null;

    albumRepositoryMock.getList.mockImplementation(() => Promise.resolve([albumEntity]));

    const result = await sut.getAllAlbums(authUser, {});

    expect(result).toHaveLength(1);
    expect(result[0].assetCount).toEqual(1);
  });

  it('updates the album thumbnail by listing all albums', async () => {
    const albumEntity = _getOwnedAlbum();
    const assetEntity = new AssetEntity();
    const newThumbnailAssetId = 'e5e65c02-b889-4f3c-afe1-a39a96d578ed';

    albumEntity.albumThumbnailAssetId = 'nonexistent';
    assetEntity.id = newThumbnailAssetId;
    albumEntity.assets = [assetEntity];
    albumRepositoryMock.getList.mockImplementation(async () => [albumEntity]);
    albumRepositoryMock.updateAlbum.mockImplementation(async () => ({
      ...albumEntity,
      albumThumbnailAssetId: newThumbnailAssetId,
    }));

    const result = await sut.getAllAlbums(authUser, {});

    expect(result).toHaveLength(1);
    expect(result[0].albumThumbnailAssetId).toEqual(newThumbnailAssetId);
    expect(albumRepositoryMock.getList).toHaveBeenCalledTimes(1);
    expect(albumRepositoryMock.updateAlbum).toHaveBeenCalledTimes(1);
    expect(albumRepositoryMock.getList).toHaveBeenCalledWith(albumEntity.ownerId, {});
    expect(albumRepositoryMock.updateAlbum).toHaveBeenCalledWith(albumEntity, {
      albumThumbnailAssetId: newThumbnailAssetId,
    });
  });

  it('removes the thumbnail for an empty album', async () => {
    const albumEntity = _getOwnedAlbum();
    const newAlbumEntity = { ...albumEntity, albumThumbnailAssetId: null };

    albumEntity.albumThumbnailAssetId = 'e5e65c02-b889-4f3c-afe1-a39a96d578ed';
    albumRepositoryMock.getList.mockImplementation(async () => [albumEntity]);
    albumRepositoryMock.updateAlbum.mockImplementation(async () => newAlbumEntity);

    const result = await sut.getAllAlbums(authUser, {});

    expect(result).toHaveLength(1);
    expect(result[0].albumThumbnailAssetId).toBeNull();
    expect(albumRepositoryMock.getList).toHaveBeenCalledTimes(1);
    expect(albumRepositoryMock.updateAlbum).toHaveBeenCalledTimes(1);
    expect(albumRepositoryMock.getList).toHaveBeenCalledWith(albumEntity.ownerId, {});
    expect(albumRepositoryMock.updateAlbum).toHaveBeenCalledWith(newAlbumEntity, {
      albumThumbnailAssetId: undefined,
    });
  });

  it('listing empty albums does not unnecessarily update the album', async () => {
    const albumEntity = _getOwnedAlbum();
    albumRepositoryMock.getList.mockImplementation(async () => [albumEntity]);
    albumRepositoryMock.updateAlbum.mockImplementation(async () => albumEntity);

    const result = await sut.getAllAlbums(authUser, {});

    expect(result).toHaveLength(1);
    expect(albumRepositoryMock.getList).toHaveBeenCalledTimes(1);
    expect(albumRepositoryMock.updateAlbum).toHaveBeenCalledTimes(0);
    expect(albumRepositoryMock.getList).toHaveBeenCalledWith(albumEntity.ownerId, {});
  });
});

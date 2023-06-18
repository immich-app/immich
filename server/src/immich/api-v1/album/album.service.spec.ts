import { AlbumResponseDto, ICryptoRepository, ISharedLinkRepository, mapUser } from '@app/domain';
import { AlbumEntity, UserEntity } from '@app/infra/entities';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { newCryptoRepositoryMock, newSharedLinkRepositoryMock, userEntityStub } from '@test';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { DownloadService } from '../../modules/download/download.service';
import { IAlbumRepository } from './album-repository';
import { AlbumService } from './album.service';
import { AddAssetsResponseDto } from './response-dto/add-assets-response.dto';

describe('Album service', () => {
  let sut: AlbumService;
  let albumRepositoryMock: jest.Mocked<IAlbumRepository>;
  let sharedLinkRepositoryMock: jest.Mocked<ISharedLinkRepository>;
  let downloadServiceMock: jest.Mocked<Partial<DownloadService>>;
  let cryptoMock: jest.Mocked<ICryptoRepository>;

  const authUser: AuthUserDto = Object.freeze({
    id: '1111',
    email: 'auth@test.com',
    isAdmin: false,
  });

  const albumOwner: UserEntity = Object.freeze({
    ...authUser,
    firstName: 'auth',
    lastName: 'user',
    createdAt: new Date('2022-06-19T23:41:36.910Z'),
    deletedAt: null,
    updatedAt: new Date('2022-06-19T23:41:36.910Z'),
    profileImagePath: '',
    shouldChangePassword: false,
    oauthId: '',
    tags: [],
    assets: [],
    storageLabel: null,
  });
  const albumId = 'f19ab956-4761-41ea-a5d6-bae948308d58';
  const sharedAlbumOwnerId = '2222';
  const sharedAlbumSharedAlsoWithId = '3333';

  const _getOwnedAlbum = () => {
    const albumEntity = new AlbumEntity();
    albumEntity.ownerId = albumOwner.id;
    albumEntity.owner = albumOwner;
    albumEntity.id = albumId;
    albumEntity.albumName = 'name';
    albumEntity.createdAt = new Date('2022-06-19T23:41:36.910Z');
    albumEntity.updatedAt = new Date('2022-06-19T23:41:36.910Z');
    albumEntity.sharedUsers = [];
    albumEntity.assets = [];
    albumEntity.albumThumbnailAssetId = null;
    albumEntity.sharedLinks = [];
    return albumEntity;
  };

  const _getSharedWithAuthUserAlbum = () => {
    const albumEntity = new AlbumEntity();
    albumEntity.ownerId = sharedAlbumOwnerId;
    albumEntity.owner = albumOwner;
    albumEntity.id = albumId;
    albumEntity.albumName = 'name';
    albumEntity.createdAt = new Date('2022-06-19T23:41:36.910Z');
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
    albumEntity.createdAt = new Date('2022-06-19T23:41:36.910Z');
    albumEntity.sharedUsers = [];
    albumEntity.assets = [];
    albumEntity.albumThumbnailAssetId = null;

    return albumEntity;
  };

  beforeAll(() => {
    albumRepositoryMock = {
      addAssets: jest.fn(),
      get: jest.fn(),
      removeAssets: jest.fn(),
      updateThumbnails: jest.fn(),
    };

    sharedLinkRepositoryMock = newSharedLinkRepositoryMock();

    downloadServiceMock = {
      downloadArchive: jest.fn(),
    };

    cryptoMock = newCryptoRepositoryMock();

    sut = new AlbumService(
      albumRepositoryMock,
      sharedLinkRepositoryMock,
      downloadServiceMock as DownloadService,
      cryptoMock,
    );
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
      createdAt: new Date('2022-06-19T23:41:36.910Z'),
      updatedAt: new Date('2022-06-19T23:41:36.910Z'),
      sharedUsers: [],
      assets: [],
      albumThumbnailAssetId: null,
      shared: false,
      assetCount: 0,
    };
    await expect(sut.get(authUser, albumId)).resolves.toEqual(expectedResult);
  });

  it('gets a shared album', async () => {
    const albumEntity = _getSharedWithAuthUserAlbum();
    albumRepositoryMock.get.mockImplementation(() => Promise.resolve<AlbumEntity>(albumEntity));

    const result = await sut.get(authUser, albumId);
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
    await expect(sut.get(authUser, albumId)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws a not found exception if the album is not found', async () => {
    albumRepositoryMock.get.mockImplementation(() => Promise.resolve(null));
    await expect(sut.get(authUser, '0002')).rejects.toBeInstanceOf(NotFoundException);
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

    const result = (await sut.addAssets(authUser, albumId, { assetIds: ['1'] })) as AddAssetsResponseDto;

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

    const result = (await sut.addAssets(authUser, albumId, { assetIds: ['1'] })) as AddAssetsResponseDto;

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

    await expect(sut.addAssets(authUser, albumId, { assetIds: ['1'] })).rejects.toBeInstanceOf(ForbiddenException);
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

    await expect(sut.removeAssets(authUser, albumId, { assetIds: ['1'] })).rejects.toBeInstanceOf(ForbiddenException);
  });
});

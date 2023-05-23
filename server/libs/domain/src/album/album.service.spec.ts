import { albumStub, authStub, newAlbumRepositoryMock, newAssetRepositoryMock, newJobRepositoryMock } from '../../test';
import { IAssetRepository } from '../asset';
import { IJobRepository, JobName } from '../job';
import { IAlbumRepository } from './album.repository';
import { AlbumService } from './album.service';

describe(AlbumService.name, () => {
  let sut: AlbumService;
  let albumMock: jest.Mocked<IAlbumRepository>;
  let assetMock: jest.Mocked<IAssetRepository>;
  let jobMock: jest.Mocked<IJobRepository>;

  beforeEach(async () => {
    albumMock = newAlbumRepositoryMock();
    assetMock = newAssetRepositoryMock();
    jobMock = newJobRepositoryMock();

    sut = new AlbumService(albumMock, assetMock, jobMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
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
    albumMock.save.mockResolvedValue(albumStub.oneAssetValidThumbnail);
    assetMock.getFirstAssetForAlbumId.mockResolvedValue(albumStub.oneAssetInvalidThumbnail.assets[0]);

    const result = await sut.getAll(authStub.admin, {});

    expect(result).toHaveLength(1);
    expect(albumMock.getInvalidThumbnail).toHaveBeenCalledTimes(1);
    expect(albumMock.save).toHaveBeenCalledTimes(1);
  });

  it('removes the thumbnail for an empty album', async () => {
    albumMock.getOwned.mockResolvedValue([albumStub.emptyWithInvalidThumbnail]);
    albumMock.getAssetCountForIds.mockResolvedValue([
      { albumId: albumStub.emptyWithInvalidThumbnail.id, assetCount: 1 },
    ]);
    albumMock.getInvalidThumbnail.mockResolvedValue([albumStub.emptyWithInvalidThumbnail.id]);
    albumMock.save.mockResolvedValue(albumStub.emptyWithValidThumbnail);
    assetMock.getFirstAssetForAlbumId.mockResolvedValue(null);

    const result = await sut.getAll(authStub.admin, {});

    expect(result).toHaveLength(1);
    expect(albumMock.getInvalidThumbnail).toHaveBeenCalledTimes(1);
    expect(albumMock.save).toHaveBeenCalledTimes(1);
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
          createdAt: '2021-01-01',
          email: 'admin@test.com',
          firstName: 'admin_first_name',
          id: 'admin_id',
          isAdmin: true,
          lastName: 'admin_last_name',
          oauthId: '',
          profileImagePath: '',
          shouldChangePassword: false,
          storageLabel: 'admin',
          updatedAt: '2021-01-01',
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
  });
});

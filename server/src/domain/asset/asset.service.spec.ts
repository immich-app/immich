import { assetEntityStub, authStub, newAssetRepositoryMock } from '@test';
import { when } from 'jest-when';
import { AssetService, IAssetRepository, mapAsset } from '.';

describe(AssetService.name, () => {
  let sut: AssetService;
  let assetMock: jest.Mocked<IAssetRepository>;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(async () => {
    assetMock = newAssetRepositoryMock();
    sut = new AssetService(assetMock);
  });

  describe('get map markers', () => {
    it('should get geo information of assets', async () => {
      assetMock.getMapMarkers.mockResolvedValue(
        [assetEntityStub.withLocation].map((asset) => ({
          id: asset.id,

          /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
          lat: asset.exifInfo!.latitude!,

          /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
          lon: asset.exifInfo!.longitude!,
        })),
      );

      const markers = await sut.getMapMarkers(authStub.user1, {});

      expect(markers).toHaveLength(1);
      expect(markers[0]).toEqual({
        id: assetEntityStub.withLocation.id,
        lat: 100,
        lon: 100,
      });
    });
  });

  describe('getMemoryLane', () => {
    it('should get pictures for each year', async () => {
      assetMock.getByDate.mockResolvedValue([]);

      await expect(sut.getMemoryLane(authStub.admin, { timestamp: new Date(2023, 5, 15), years: 10 })).resolves.toEqual(
        [],
      );

      expect(assetMock.getByDate).toHaveBeenCalledTimes(10);
      expect(assetMock.getByDate.mock.calls).toEqual([
        [authStub.admin.id, new Date('2022-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2021-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2020-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2019-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2018-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2017-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2016-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2015-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2014-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2013-06-15T00:00:00.000Z')],
      ]);
    });

    it('should keep hours from the date', async () => {
      assetMock.getByDate.mockResolvedValue([]);

      await expect(
        sut.getMemoryLane(authStub.admin, { timestamp: new Date(2023, 5, 15, 5), years: 2 }),
      ).resolves.toEqual([]);

      expect(assetMock.getByDate).toHaveBeenCalledTimes(2);
      expect(assetMock.getByDate.mock.calls).toEqual([
        [authStub.admin.id, new Date('2022-06-15T05:00:00.000Z')],
        [authStub.admin.id, new Date('2021-06-15T05:00:00.000Z')],
      ]);
    });
  });

  it('should set the title correctly', async () => {
    when(assetMock.getByDate)
      .calledWith(authStub.admin.id, new Date('2022-06-15T00:00:00.000Z'))
      .mockResolvedValue([assetEntityStub.image]);
    when(assetMock.getByDate)
      .calledWith(authStub.admin.id, new Date('2021-06-15T00:00:00.000Z'))
      .mockResolvedValue([assetEntityStub.video]);

    await expect(sut.getMemoryLane(authStub.admin, { timestamp: new Date(2023, 5, 15), years: 2 })).resolves.toEqual([
      { title: '1 year since...', assets: [mapAsset(assetEntityStub.image)] },
      { title: '2 years since...', assets: [mapAsset(assetEntityStub.video)] },
    ]);

    expect(assetMock.getByDate).toHaveBeenCalledTimes(2);
    expect(assetMock.getByDate.mock.calls).toEqual([
      [authStub.admin.id, new Date('2022-06-15T00:00:00.000Z')],
      [authStub.admin.id, new Date('2021-06-15T00:00:00.000Z')],
    ]);
  });
});

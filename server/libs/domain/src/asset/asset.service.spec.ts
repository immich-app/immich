import { assetEntityStub, authStub, newAssetRepositoryMock } from '../../test';
import { AssetService, IAssetRepository } from '../asset';

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
});

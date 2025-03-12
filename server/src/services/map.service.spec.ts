import { MapService } from 'src/services/map.service';
import { albumStub } from 'test/fixtures/album.stub';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { factory } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe(MapService.name, () => {
  let sut: MapService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(MapService));
  });

  describe('getMapMarkers', () => {
    it('should get geo information of assets', async () => {
      const asset = assetStub.withLocation;
      const marker = {
        id: asset.id,
        lat: asset.exifInfo!.latitude!,
        lon: asset.exifInfo!.longitude!,
        city: asset.exifInfo!.city,
        state: asset.exifInfo!.state,
        country: asset.exifInfo!.country,
      };
      mocks.partner.getAll.mockResolvedValue([]);
      mocks.map.getMapMarkers.mockResolvedValue([marker]);

      const markers = await sut.getMapMarkers(authStub.user1, {});

      expect(markers).toHaveLength(1);
      expect(markers[0]).toEqual(marker);
    });

    it('should include partner assets', async () => {
      const partner = factory.partner();
      const auth = factory.auth({ id: partner.sharedWithId });

      const asset = assetStub.withLocation;
      const marker = {
        id: asset.id,
        lat: asset.exifInfo!.latitude!,
        lon: asset.exifInfo!.longitude!,
        city: asset.exifInfo!.city,
        state: asset.exifInfo!.state,
        country: asset.exifInfo!.country,
      };
      mocks.partner.getAll.mockResolvedValue([partner]);
      mocks.map.getMapMarkers.mockResolvedValue([marker]);

      const markers = await sut.getMapMarkers(auth, { withPartners: true });

      expect(mocks.map.getMapMarkers).toHaveBeenCalledWith(
        [auth.user.id, partner.sharedById],
        expect.arrayContaining([]),
        { withPartners: true },
      );
      expect(markers).toHaveLength(1);
      expect(markers[0]).toEqual(marker);
    });

    it('should include assets from shared albums', async () => {
      const asset = assetStub.withLocation;
      const marker = {
        id: asset.id,
        lat: asset.exifInfo!.latitude!,
        lon: asset.exifInfo!.longitude!,
        city: asset.exifInfo!.city,
        state: asset.exifInfo!.state,
        country: asset.exifInfo!.country,
      };
      mocks.partner.getAll.mockResolvedValue([]);
      mocks.map.getMapMarkers.mockResolvedValue([marker]);
      mocks.album.getOwned.mockResolvedValue([albumStub.empty]);
      mocks.album.getShared.mockResolvedValue([albumStub.sharedWithUser]);

      const markers = await sut.getMapMarkers(authStub.user1, { withSharedAlbums: true });

      expect(markers).toHaveLength(1);
      expect(markers[0]).toEqual(marker);
    });
  });

  describe('reverseGeocode', () => {
    it('should reverse geocode a location', async () => {
      mocks.map.reverseGeocode.mockResolvedValue({ city: 'foo', state: 'bar', country: 'baz' });

      await expect(sut.reverseGeocode({ lat: 42, lon: 69 })).resolves.toEqual([
        { city: 'foo', state: 'bar', country: 'baz' },
      ]);

      expect(mocks.map.reverseGeocode).toHaveBeenCalledWith({ latitude: 42, longitude: 69 });
    });
  });
});

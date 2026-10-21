import { MapService } from 'src/services/map.service.js';
import { AlbumFactory } from 'test/factories/album.factory.js';
import { AssetFactory } from 'test/factories/asset.factory.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { PartnerFactory } from 'test/factories/partner.factory.js';
import { userStub } from 'test/fixtures/user.stub.js';
import { getForPartner } from 'test/mappers.js';
import { ServiceMocks, newTestService } from 'test/utils.js';

describe(MapService.name, () => {
  let sut: MapService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(MapService));
  });

  describe('getMapMarkers', () => {
    it('should get geo information of assets', async () => {
      const auth = AuthFactory.create();
      const asset = AssetFactory.from()
        .exif({ latitude: 42, longitude: 69, city: 'city', state: 'state', country: 'country' })
        .build();
      const marker = {
        id: asset.id,
        lat: asset.exifInfo.latitude!,
        lon: asset.exifInfo.longitude!,
        city: asset.exifInfo.city,
        state: asset.exifInfo.state,
        country: asset.exifInfo.country,
      };
      mocks.partner.getAll.mockResolvedValue([]);
      mocks.map.getMapMarkers.mockResolvedValue([marker]);

      const markers = await sut.getMapMarkers(auth, {});

      expect(markers).toHaveLength(1);
      expect(markers[0]).toEqual(marker);
    });

    it('should include partner assets', async () => {
      const auth = AuthFactory.create();
      const partner = PartnerFactory.create({ sharedWithId: auth.user.id });

      const asset = AssetFactory.from()
        .exif({ latitude: 42, longitude: 69, city: 'city', state: 'state', country: 'country' })
        .build();
      const marker = {
        id: asset.id,
        lat: asset.exifInfo.latitude!,
        lon: asset.exifInfo.longitude!,
        city: asset.exifInfo.city,
        state: asset.exifInfo.state,
        country: asset.exifInfo.country,
      };
      mocks.partner.getAll.mockResolvedValue([getForPartner(partner)]);
      mocks.map.getMapMarkers.mockResolvedValue([marker]);

      const markers = await sut.getMapMarkers(auth, { withPartners: true });

      expect(mocks.map.getMapMarkers).toHaveBeenCalledWith(
        auth.user.id,
        [auth.user.id, partner.sharedById],
        expect.arrayContaining([]),
        { withPartners: true },
      );
      expect(markers).toHaveLength(1);
      expect(markers[0]).toEqual(marker);
    });

    it('should include assets from shared albums', async () => {
      const auth = AuthFactory.create(userStub.user1);
      const asset = AssetFactory.from()
        .exif({ latitude: 42, longitude: 69, city: 'city', state: 'state', country: 'country' })
        .build();
      const marker = {
        id: asset.id,
        lat: asset.exifInfo.latitude!,
        lon: asset.exifInfo.longitude!,
        city: asset.exifInfo.city,
        state: asset.exifInfo.state,
        country: asset.exifInfo.country,
      };
      mocks.partner.getAll.mockResolvedValue([]);
      mocks.map.getMapMarkers.mockResolvedValue([marker]);
      const album1 = AlbumFactory.create();
      const album2 = AlbumFactory.from().albumUser({ userId: userStub.user1.id }).build();
      mocks.album.getAllIds.mockResolvedValue([album1.id, album2.id]);

      const markers = await sut.getMapMarkers(auth, { withSharedAlbums: true });

      expect(markers).toHaveLength(1);
      expect(markers[0]).toEqual(marker);
      expect(mocks.album.getAllIds).toHaveBeenCalledWith(auth.user.id);
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

  describe('favorite locations', () => {
    it('should list favorite locations for the authenticated user only', async () => {
      const auth = AuthFactory.create();
      const otherAuth = AuthFactory.create();
      const locations = [{ id: 'location-id', name: 'Home', latitude: 42, longitude: 69 }];
      mocks.map.getFavoriteLocations.mockResolvedValue(locations);

      await expect(sut.getFavoriteLocations(auth)).resolves.toEqual(locations);
      await sut.getFavoriteLocations(otherAuth);

      expect(mocks.map.getFavoriteLocations).toHaveBeenNthCalledWith(1, auth.user.id);
      expect(mocks.map.getFavoriteLocations).toHaveBeenNthCalledWith(2, otherAuth.user.id);
    });

    it('should create a favorite location for the authenticated user', async () => {
      const auth = AuthFactory.create();
      const dto = { name: 'Home', latitude: 42, longitude: 69 };
      const location = { id: 'location-id', ...dto };
      mocks.map.createFavoriteLocation.mockResolvedValue(location);

      await expect(sut.createFavoriteLocation(auth, dto)).resolves.toEqual(location);

      expect(mocks.map.createFavoriteLocation).toHaveBeenCalledWith({ ...dto, userId: auth.user.id });
    });

    it('should delete a favorite location for the authenticated user', async () => {
      const auth = AuthFactory.create();
      const id = 'location-id';
      mocks.map.deleteFavoriteLocation.mockResolvedValue(true);

      await expect(sut.deleteFavoriteLocation(auth, id)).resolves.toBeUndefined();

      expect(mocks.map.deleteFavoriteLocation).toHaveBeenCalledWith(id, auth.user.id);
    });

    it('should not delete a favorite location owned by another user', async () => {
      const auth = AuthFactory.create();
      mocks.map.deleteFavoriteLocation.mockResolvedValue(false);

      await expect(sut.deleteFavoriteLocation(auth, 'another-users-location')).rejects.toThrow(
        'Favorite location not found',
      );

      expect(mocks.map.deleteFavoriteLocation).toHaveBeenCalledWith('another-users-location', auth.user.id);
    });
  });
});

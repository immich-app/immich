import { CreateFavoriteLocationDto, UpdateFavoriteLocationDto } from 'src/dtos/favorite-location.dto';
import { MapService } from 'src/services/map.service';
import { AlbumFactory } from 'test/factories/album.factory';
import { AssetFactory } from 'test/factories/asset.factory';
import { AuthFactory } from 'test/factories/auth.factory';
import { userStub } from 'test/fixtures/user.stub';
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
      const partner = factory.partner({ sharedWithId: auth.user.id });

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
      mocks.album.getOwned.mockResolvedValue([AlbumFactory.create()]);
      mocks.album.getShared.mockResolvedValue([AlbumFactory.from().albumUser({ userId: userStub.user1.id }).build()]);

      const markers = await sut.getMapMarkers(auth, { withSharedAlbums: true });

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

  describe('getFavoriteLocations', () => {
    it('should return favorite locations for the user', async () => {
      const favoriteLocation = {
        id: 'loc1',
        userId: authStub.user1.user.id,
        name: 'Home',
        latitude: 12.34,
        longitude: 56.78,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mocks.map.getFavoriteLocations.mockResolvedValue([favoriteLocation]);

      const result = await sut.getFavoriteLocations(authStub.user1);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(favoriteLocation);
      expect(mocks.map.getFavoriteLocations).toHaveBeenCalledWith(authStub.user1.user.id);
    });
  });

  describe('createFavoriteLocation', () => {
    it('should create a new favorite location', async () => {
      const dto: CreateFavoriteLocationDto = { name: 'Work', latitude: 1, longitude: 2 };

      const created = {
        id: 'loc2',
        userId: authStub.user1.user.id,
        name: 'Work',
        latitude: 1,
        longitude: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mocks.map.createFavoriteLocation.mockResolvedValue(created);

      const result = await sut.createFavoriteLocation(authStub.user1, dto);

      expect(result).toEqual(created);
      expect(mocks.map.createFavoriteLocation).toHaveBeenCalledWith({
        userId: authStub.user1.user.id,
        name: dto.name,
        latitude: dto.latitude,
        longitude: dto.longitude,
      });
    });
  });

  describe('updateFavoriteLocation', () => {
    it('should update an existing favorite location', async () => {
      const dto: UpdateFavoriteLocationDto = { name: 'Gym' };

      const updated = {
        id: 'loc3',
        userId: authStub.user1.user.id,
        name: 'Gym',
        latitude: null,
        longitude: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mocks.map.updateFavoriteLocation.mockResolvedValue(updated);

      const result = await sut.updateFavoriteLocation(authStub.user1, 'loc3', dto);

      expect(result).toEqual(updated);
      expect(mocks.map.updateFavoriteLocation).toHaveBeenCalledWith('loc3', authStub.user1.user.id, {
        id: 'loc3',
        userId: authStub.user1.user.id,
        name: 'Gym',
      });
    });
  });

  describe('deleteFavoriteLocation', () => {
    it('should call repository to delete a location by id', async () => {
      mocks.map.deleteFavoriteLocation.mockResolvedValue();

      await sut.deleteFavoriteLocation('loc4');

      expect(mocks.map.deleteFavoriteLocation).toHaveBeenCalledWith('loc4');
    });
  });
});

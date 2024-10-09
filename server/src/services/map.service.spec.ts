import { IAlbumRepository } from 'src/interfaces/album.interface';
import { IMapRepository } from 'src/interfaces/map.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { MapService } from 'src/services/map.service';
import { albumStub } from 'test/fixtures/album.stub';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { partnerStub } from 'test/fixtures/partner.stub';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(MapService.name, () => {
  let sut: MapService;

  let albumMock: Mocked<IAlbumRepository>;
  let mapMock: Mocked<IMapRepository>;
  let partnerMock: Mocked<IPartnerRepository>;

  beforeEach(() => {
    ({ sut, albumMock, mapMock, partnerMock } = newTestService(MapService));
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
      partnerMock.getAll.mockResolvedValue([]);
      mapMock.getMapMarkers.mockResolvedValue([marker]);

      const markers = await sut.getMapMarkers(authStub.user1, {});

      expect(markers).toHaveLength(1);
      expect(markers[0]).toEqual(marker);
    });

    it('should include partner assets', async () => {
      const asset = assetStub.withLocation;
      const marker = {
        id: asset.id,
        lat: asset.exifInfo!.latitude!,
        lon: asset.exifInfo!.longitude!,
        city: asset.exifInfo!.city,
        state: asset.exifInfo!.state,
        country: asset.exifInfo!.country,
      };
      partnerMock.getAll.mockResolvedValue([partnerStub.adminToUser1]);
      mapMock.getMapMarkers.mockResolvedValue([marker]);

      const markers = await sut.getMapMarkers(authStub.user1, { withPartners: true });

      expect(mapMock.getMapMarkers).toHaveBeenCalledWith(
        [authStub.user1.user.id, partnerStub.adminToUser1.sharedById],
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
      partnerMock.getAll.mockResolvedValue([]);
      mapMock.getMapMarkers.mockResolvedValue([marker]);
      albumMock.getOwned.mockResolvedValue([albumStub.empty]);
      albumMock.getShared.mockResolvedValue([albumStub.sharedWithUser]);

      const markers = await sut.getMapMarkers(authStub.user1, { withSharedAlbums: true });

      expect(markers).toHaveLength(1);
      expect(markers[0]).toEqual(marker);
    });
  });

  describe('reverseGeocode', () => {
    it('should reverse geocode a location', async () => {
      mapMock.reverseGeocode.mockResolvedValue({ city: 'foo', state: 'bar', country: 'baz' });

      await expect(sut.reverseGeocode({ lat: 42, lon: 69 })).resolves.toEqual([
        { city: 'foo', state: 'bar', country: 'baz' },
      ]);

      expect(mapMock.reverseGeocode).toHaveBeenCalledWith({ latitude: 42, longitude: 69 });
    });
  });
});

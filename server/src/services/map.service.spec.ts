import { IMapRepository } from 'src/interfaces/map.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { MapService } from 'src/services/map.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(MapService.name, () => {
  let sut: MapService;

  let mapMock: Mocked<IMapRepository>;
  let partnerMock: Mocked<IPartnerRepository>;

  beforeEach(() => {
    ({ sut, mapMock, partnerMock } = newTestService(MapService));
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
  });
});

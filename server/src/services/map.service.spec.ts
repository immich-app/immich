import { IAlbumRepository } from 'src/interfaces/album.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMapRepository } from 'src/interfaces/map.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { MapService } from 'src/services/map.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { newAlbumRepositoryMock } from 'test/repositories/album.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newMapRepositoryMock } from 'test/repositories/map.repository.mock';
import { newPartnerRepositoryMock } from 'test/repositories/partner.repository.mock';
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { Mocked } from 'vitest';

describe(MapService.name, () => {
  let sut: MapService;
  let albumMock: Mocked<IAlbumRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let partnerMock: Mocked<IPartnerRepository>;
  let mapMock: Mocked<IMapRepository>;
  let systemMetadataMock: Mocked<ISystemMetadataRepository>;

  beforeEach(() => {
    albumMock = newAlbumRepositoryMock();
    loggerMock = newLoggerRepositoryMock();
    partnerMock = newPartnerRepositoryMock();
    mapMock = newMapRepositoryMock();
    systemMetadataMock = newSystemMetadataRepositoryMock();

    sut = new MapService(albumMock, loggerMock, partnerMock, mapMock, systemMetadataMock);
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

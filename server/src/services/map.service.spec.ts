import { MapService } from 'src/services/map.service';
import { AlbumFactory } from 'test/factories/album.factory';
import { AssetFactory } from 'test/factories/asset.factory';
import { AuthFactory } from 'test/factories/auth.factory';
import { PartnerFactory } from 'test/factories/partner.factory';
import { userStub } from 'test/fixtures/user.stub';
import { getForAlbum, getForPartner } from 'test/mappers';
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
        [auth.user.id, partner.sharedById],
        expect.arrayContaining([]),
        expect.objectContaining({
          isArchived: undefined,
          isFavorite: undefined,
          fileCreatedAfter: undefined,
          fileCreatedBefore: undefined,
        }),
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
      mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([]);
      mocks.map.getMapMarkers.mockResolvedValue([marker]);
      mocks.album.getOwned.mockResolvedValue([getForAlbum(AlbumFactory.create())]);
      mocks.album.getShared.mockResolvedValue([
        getForAlbum(AlbumFactory.from().albumUser({ userId: userStub.user1.id }).build()),
      ]);

      const markers = await sut.getMapMarkers(auth, { withSharedAlbums: true });

      expect(markers).toHaveLength(1);
      expect(markers[0]).toEqual(marker);
    });

    it('should pass timeline space IDs when shared albums are included', async () => {
      const auth = AuthFactory.create();
      const spaceId = '00000000-0000-4000-8000-000000000003';
      mocks.partner.getAll.mockResolvedValue([]);
      mocks.album.getOwned.mockResolvedValue([]);
      mocks.album.getShared.mockResolvedValue([]);
      mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId }]);
      mocks.map.getMapMarkers.mockResolvedValue([]);

      await sut.getMapMarkers(auth, { withSharedAlbums: true });

      expect(mocks.sharedSpace.getSpaceIdsForTimeline).toHaveBeenCalledWith(auth.user.id);
      expect(mocks.map.getMapMarkers).toHaveBeenCalledWith(
        [auth.user.id],
        [],
        expect.objectContaining({ timelineSpaceIds: [spaceId] }),
      );
    });

    it('should pass space IDs when withSharedSpaces is true and user has enabled spaces', async () => {
      const auth = AuthFactory.create();
      const spaceId = '00000000-0000-4000-8000-000000000001';
      mocks.partner.getAll.mockResolvedValue([]);
      mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId }]);
      mocks.map.getMapMarkers.mockResolvedValue([]);

      await sut.getMapMarkers(auth, { withSharedSpaces: true });

      expect(mocks.sharedSpace.getSpaceIdsForTimeline).toHaveBeenCalledWith(auth.user.id);
      expect(mocks.map.getMapMarkers).toHaveBeenCalledWith(
        [auth.user.id],
        expect.anything(),
        expect.objectContaining({ timelineSpaceIds: [spaceId] }),
      );
    });

    it('should not pass timelineSpaceIds when user has no enabled spaces', async () => {
      const auth = AuthFactory.create();
      mocks.partner.getAll.mockResolvedValue([]);
      mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([]);
      mocks.map.getMapMarkers.mockResolvedValue([]);

      await sut.getMapMarkers(auth, { withSharedSpaces: true });

      expect(mocks.map.getMapMarkers).toHaveBeenCalledWith(
        [auth.user.id],
        expect.anything(),
        expect.not.objectContaining({ timelineSpaceIds: expect.anything() }),
      );
    });

    it('should not resolve space IDs when isFavorite=true', async () => {
      const auth = AuthFactory.create();
      mocks.partner.getAll.mockResolvedValue([]);
      mocks.map.getMapMarkers.mockResolvedValue([]);

      await sut.getMapMarkers(auth, { withSharedSpaces: true, isFavorite: true });

      expect(mocks.sharedSpace.getSpaceIdsForTimeline).not.toHaveBeenCalled();
      expect(mocks.map.getMapMarkers).toHaveBeenCalledWith(
        [auth.user.id],
        expect.anything(),
        expect.not.objectContaining({ timelineSpaceIds: expect.anything() }),
      );
    });

    it('should resolve space IDs when isArchived=true (archive toggle is additive)', async () => {
      const auth = AuthFactory.create();
      const spaceId = '00000000-0000-4000-8000-000000000002';
      mocks.partner.getAll.mockResolvedValue([]);
      mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId }]);
      mocks.map.getMapMarkers.mockResolvedValue([]);

      await sut.getMapMarkers(auth, { withSharedSpaces: true, isArchived: true });

      expect(mocks.sharedSpace.getSpaceIdsForTimeline).toHaveBeenCalledWith(auth.user.id);
      expect(mocks.map.getMapMarkers).toHaveBeenCalledWith(
        [auth.user.id],
        expect.anything(),
        expect.objectContaining({ timelineSpaceIds: [spaceId], isArchived: true }),
      );
    });

    it('should not resolve space IDs when withSharedSpaces is omitted', async () => {
      const auth = AuthFactory.create();
      mocks.partner.getAll.mockResolvedValue([]);
      mocks.map.getMapMarkers.mockResolvedValue([]);

      await sut.getMapMarkers(auth, {});

      expect(mocks.sharedSpace.getSpaceIdsForTimeline).not.toHaveBeenCalled();
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

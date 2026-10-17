import { Kysely } from 'kysely';
import { MapMarkerDto } from 'src/dtos/map.dto.js';
import { AlbumRepository } from 'src/repositories/album.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { MapRepository } from 'src/repositories/map.repository.js';
import { PartnerRepository } from 'src/repositories/partner.repository.js';
import { DB } from 'src/schema/index.js';
import { MapService } from 'src/services/map.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { factory } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(MapService, {
    database: db || defaultDatabase,
    real: [AlbumRepository, MapRepository, PartnerRepository],
    mock: [LoggingRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(MapService.name, () => {
  describe('getMapMarkers', () => {
    it('should include partner and shared album assets once each', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: partner } = await ctx.newUser();
      const { user: friend } = await ctx.newUser();
      await ctx.newPartner({ sharedById: partner.id, sharedWithId: user.id });

      const newLocatedAsset = async (ownerId: string, fileCreatedAt: string) => {
        const { asset } = await ctx.newAsset({ ownerId, fileCreatedAt });
        await ctx.newExif({ assetId: asset.id, latitude: 52, longitude: 4 });
        return asset;
      };
      const ownAsset = await newLocatedAsset(user.id, '2024-01-04T00:00:00.000Z');
      const partnerAsset = await newLocatedAsset(partner.id, '2024-01-03T00:00:00.000Z');
      const albumAsset = await newLocatedAsset(friend.id, '2024-01-02T00:00:00.000Z');
      await newLocatedAsset(friend.id, '2024-01-01T00:00:00.000Z');

      const { album } = await ctx.newAlbum({ ownerId: friend.id }, [ownAsset.id, partnerAsset.id, albumAsset.id]);
      await ctx.newAlbumUser({ albumId: album.id, userId: user.id });

      const auth = factory.auth({ user: { id: user.id } });
      const getIds = async (dto: MapMarkerDto) => {
        const markers = await sut.getMapMarkers(auth, dto);
        return markers.map(({ id }) => id);
      };

      await expect(getIds({})).resolves.toEqual([ownAsset.id]);
      await expect(getIds({ withPartners: true })).resolves.toEqual([ownAsset.id, partnerAsset.id]);
      await expect(getIds({ withSharedAlbums: true })).resolves.toEqual([ownAsset.id, partnerAsset.id, albumAsset.id]);
      await expect(getIds({ withPartners: true, withSharedAlbums: true })).resolves.toEqual([
        ownAsset.id,
        partnerAsset.id,
        albumAsset.id,
      ]);
    });
  });
});

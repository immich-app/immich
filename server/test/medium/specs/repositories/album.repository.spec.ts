import { Kysely } from 'kysely';
import { AlbumRepository } from 'src/repositories/album.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(AlbumRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AlbumRepository.name, () => {
  describe('getMetadataForIds', () => {
    it('should return start/end date including time', async () => {
      const date = '2023-11-19T18:11:21.456';

      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime: date });
      const _ = await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });

      await expect(sut.getMetadataForIds([album.id])).resolves.toEqual([
        expect.objectContaining({ assetCount: 1, startDate: new Date(date), endDate: new Date(date) }),
      ]);
    });
  });
});

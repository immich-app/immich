import { Kysely } from 'kysely';
import { AlbumRepository } from 'src/repositories/album.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { DB } from 'src/schema/index.js';
import { BaseService } from 'src/services/base.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const setup = () => {
  const { ctx } = newMediumService(BaseService, {
    database: defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(AlbumRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AlbumRepository.name, () => {
  describe('getUserIds', () => {
    it('should return the owner and shared users of the album', async () => {
      const { ctx, sut } = setup();
      const { album, owner, sharedWith } = await ctx.newSharedAlbum();
      await ctx.newSharedAlbum();

      const userIds = await sut.getUserIds(album.id);

      expect(userIds.toSorted()).toEqual([owner.id, sharedWith.id].toSorted());
    });

    it('should return no users for a deleted album', async () => {
      const { ctx, sut } = setup();
      const { album, owner } = await ctx.newSharedAlbum();
      await sut.softDeleteAll(owner.id);

      const userIds = await sut.getUserIds(album.id);

      expect(userIds).toEqual([]);
    });
  });
});

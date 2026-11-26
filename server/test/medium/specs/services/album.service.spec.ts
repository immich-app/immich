import { Kysely } from 'kysely';
import { AccessRepository } from 'src/repositories/access.repository.js';
import { AlbumRepository } from 'src/repositories/album.repository.js';
import { AssetRepository } from 'src/repositories/asset.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { ResourceRepository } from 'src/repositories/resource.repository.js';
import { UserRepository } from 'src/repositories/user.repository.js';
import { Resource } from 'src/resource-paths.js';
import { DB } from 'src/schema/index.js';
import { AlbumService } from 'src/services/album.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { factory } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

// eslint-disable-next-line unicorn/no-unnecessary-parameters
const setup = (db?: Kysely<DB>) => {
  return newMediumService(AlbumService, {
    database: db || defaultDatabase,
    real: [AccessRepository, AlbumRepository, AssetRepository, UserRepository],
    mock: [LoggingRepository, ResourceRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AlbumService.name, () => {
  describe('update', () => {
    it('should tell the owner and the shared user, but not a stranger', async () => {
      const { sut, ctx } = setup();
      const { album, owner, sharedWith } = await ctx.newSharedAlbum();
      const { user: stranger } = await ctx.newUser();

      await sut.update(factory.auth({ user: owner }), album.id, { albumName: 'Holiday' });

      const send = ctx.getMock(ResourceRepository).send;
      expect(send).toHaveBeenCalledTimes(1);
      const [{ userIds, changed }] = send.mock.calls[0];
      expect(userIds.toSorted()).toEqual([owner.id, sharedWith.id].toSorted());
      expect(userIds).not.toContain(stranger.id);
      expect(changed).toEqual([Resource.album(album)]);
    });
  });

  describe('removeAssets', () => {
    it('should not remove assets from an album of another user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { album } = await ctx.newAlbum({ ownerId: user.id }, [asset.id]);

      await expect(sut.removeAssets(factory.auth({ user: otherUser }), album.id, { ids: [asset.id] })).rejects.toThrow(
        'Not found or no albumAsset.delete access',
      );
      await expect(ctx.get(AlbumRepository).getAssetIds(album.id, [asset.id])).resolves.toContain(asset.id);
    });
  });

  describe('database triggers', () => {
    it('should cascade delete an album when the owner is deleted', async () => {
      const { ctx } = setup();
      const { user } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: user.id });

      await ctx.get(UserRepository).delete({ id: user.id }, true);

      await expect(ctx.database.selectFrom('album').selectAll().where('id', '=', album.id).execute()).resolves.toEqual(
        [],
      );
      await expect(
        ctx.database.selectFrom('album_user').selectAll().where('albumId', '=', album.id).execute(),
      ).resolves.toEqual([]);
    });
  });
});

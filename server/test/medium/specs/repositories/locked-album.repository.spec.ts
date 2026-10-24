import { Kysely, sql } from 'kysely';
import { AssetVisibility } from 'src/enum.js';
import { LockedAlbumRepository } from 'src/repositories/locked-album.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { DB } from 'src/schema/index.js';
import { BaseService } from 'src/services/base.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { newUuid } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

let database: Kysely<DB>;

const setup = async () => {
  const { ctx } = newMediumService(BaseService, { database, real: [], mock: [LoggingRepository] });
  const { user } = await ctx.newUser();
  const { user: otherUser } = await ctx.newUser();
  const sut = new LockedAlbumRepository(database);
  const album = await sut.create(user.id, 'Private group');
  const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked });
  return { ctx, sut, user, otherUser, album, asset };
};

beforeAll(async () => {
  database = await getKyselyDB();
  return () => database.destroy();
});

describe(LockedAlbumRepository.name, () => {
  it('should serialize concurrent duplicate and overlapping batches without deadlocks or partial writes', async () => {
    const { ctx, sut, user, album, asset } = await setup();
    const secondAlbum = await sut.create(user.id, 'Second private group');
    const { asset: second } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked });
    const ids = [asset.id, second.id];

    await Promise.all([
      sut.addAssets(user.id, album.id, ids),
      sut.addAssets(user.id, album.id, ids.toReversed()),
      sut.addAssets(user.id, secondAlbum.id, ids.toReversed()),
    ]);

    for (const id of [album.id, secondAlbum.id]) {
      expect(await sut.get(user.id, id)).toMatchObject({ assetCount: 2 });
      expect(await sut.getAssetIds(user.id, id, { skip: 0, take: 50 })).toEqual({
        assetIds: ids.toSorted(),
        hasNextPage: false,
      });
    }
  });

  it('should revalidate visibility after waiting for a concurrent asset update', async () => {
    const { sut, user, album, asset } = await setup();
    let pending: Promise<void> | undefined;
    await database.transaction().execute(async (tx) => {
      await tx.selectFrom('asset').select('id').where('id', '=', asset.id).forUpdate().execute();
      const {
        rows: [backend],
      } = await sql<{ pid: number }>`select pg_backend_pid() as pid`.execute(tx);
      pending = sut.addAssets(user.id, album.id, [asset.id]);
      // Install the rejection handler immediately; the transaction has not committed yet.
      void pending.catch(() => {});
      await vi.waitFor(async () => {
        const { rows } = await sql<{ blocked: boolean }>`
          select exists(select 1 from pg_stat_activity
            where ${backend.pid} = any(pg_blocking_pids(pid))) as blocked
        `.execute(database);
        expect(rows[0].blocked).toBe(true);
      });
      await tx.updateTable('asset').set({ visibility: AssetVisibility.Timeline }).where('id', '=', asset.id).execute();
    });

    await expect(pending).rejects.toThrow('Invalid locked album or assets');
    expect(
      await database.selectFrom('locked_album_asset').selectAll().where('albumId', '=', album.id).execute(),
    ).toEqual([]);
  });

  it('should fail closed when a grouping is concurrently deleted before its row lock is acquired', async () => {
    const { sut, user, album, asset } = await setup();
    let pending: Promise<void> | undefined;
    await database.transaction().execute(async (tx) => {
      await tx.selectFrom('locked_album').select('id').where('id', '=', album.id).forUpdate().execute();
      const {
        rows: [backend],
      } = await sql<{ pid: number }>`select pg_backend_pid() as pid`.execute(tx);
      pending = sut.addAssets(user.id, album.id, [asset.id]);
      void pending.catch(() => {});
      await vi.waitFor(async () => {
        const { rows } = await sql<{ blocked: boolean }>`
          select exists(select 1 from pg_stat_activity
            where ${backend.pid} = any(pg_blocking_pids(pid))) as blocked
        `.execute(database);
        expect(rows[0].blocked).toBe(true);
      });
      await tx.deleteFrom('locked_album').where('id', '=', album.id).execute();
    });

    await expect(pending).rejects.toThrow('Invalid locked album or assets');
    expect(
      await database.selectFrom('locked_album_asset').selectAll().where('albumId', '=', album.id).execute(),
    ).toEqual([]);
    expect(
      await database.selectFrom('asset').select('visibility').where('id', '=', asset.id).executeTakeFirst(),
    ).toEqual({
      visibility: AssetVisibility.Locked,
    });
  });

  it('should isolate names and metadata by owner', async () => {
    const { sut, user, otherUser, album } = await setup();

    expect(await sut.getAll(user.id)).toEqual(expect.arrayContaining([expect.objectContaining({ id: album.id })]));
    expect(await sut.getAll(otherUser.id)).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: album.id })]),
    );
    expect(await sut.get(otherUser.id, album.id)).toBeUndefined();
    expect(await sut.update(otherUser.id, album.id, 'Not allowed')).toBeUndefined();
    expect(await sut.delete(otherUser.id, album.id)).toBe(false);
    expect(await sut.get(user.id, album.id)).toMatchObject({ albumName: 'Private group', assetCount: 0 });
  });

  it('should add memberships idempotently without granting ordinary album access', async () => {
    const { sut, user, album, asset } = await setup();

    await sut.addAssets(user.id, album.id, [asset.id, asset.id]);
    await sut.addAssets(user.id, album.id, [asset.id]);

    expect(await sut.get(user.id, album.id)).toMatchObject({ assetCount: 1 });
    expect(await sut.getAssetIds(user.id, album.id, { skip: 0, take: 50 })).toEqual({
      assetIds: [asset.id],
      hasNextPage: false,
    });
    expect(await database.selectFrom('album_asset').selectAll().where('assetId', '=', asset.id).execute()).toEqual([]);
  });

  it.each([AssetVisibility.Timeline, AssetVisibility.Archive])(
    'should atomically reject a batch containing a %s asset',
    async (visibility) => {
      const { ctx, sut, user, album, asset } = await setup();
      const { asset: invalid } = await ctx.newAsset({ ownerId: user.id, visibility });

      await expect(sut.addAssets(user.id, album.id, [asset.id, invalid.id])).rejects.toThrow();
      expect(await sut.get(user.id, album.id)).toMatchObject({ assetCount: 0 });
    },
  );

  it('should atomically reject foreign, deleted and nonexistent assets', async () => {
    const { ctx, sut, user, otherUser, album, asset } = await setup();
    const { asset: foreign } = await ctx.newAsset({ ownerId: otherUser.id, visibility: AssetVisibility.Locked });
    const { asset: deleted } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked });
    await ctx.softDeleteAsset(deleted.id);

    for (const invalidId of [foreign.id, deleted.id, newUuid()]) {
      await expect(sut.addAssets(user.id, album.id, [asset.id, invalidId])).rejects.toThrow();
      expect(await sut.get(user.id, album.id)).toMatchObject({ assetCount: 0 });
    }
  });

  it('should deny membership operations on another owner’s album', async () => {
    const { sut, user, otherUser, album, asset } = await setup();
    await sut.addAssets(user.id, album.id, [asset.id]);

    await expect(sut.addAssets(otherUser.id, album.id, [asset.id])).rejects.toThrow();
    await expect(sut.removeAssets(otherUser.id, album.id, [asset.id])).rejects.toThrow();
    expect(await sut.getAssetIds(otherUser.id, album.id, { skip: 0, take: 50 })).toEqual({
      assetIds: [],
      hasNextPage: false,
    });
    expect(await sut.get(user.id, album.id)).toMatchObject({ assetCount: 1 });
  });

  it('should filter unlocked and trashed members from both counts and pages', async () => {
    const { ctx, sut, user, album, asset } = await setup();
    const { asset: trashed } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked });
    await sut.addAssets(user.id, album.id, [asset.id, trashed.id]);
    await database
      .updateTable('asset')
      .set({ visibility: AssetVisibility.Timeline })
      .where('id', '=', asset.id)
      .execute();
    await ctx.softDeleteAsset(trashed.id);

    expect(await sut.get(user.id, album.id)).toMatchObject({ assetCount: 0 });
    expect(await sut.getAssetIds(user.id, album.id, { skip: 0, take: 50 })).toEqual({
      assetIds: [],
      hasNextPage: false,
    });

    await database
      .updateTable('asset')
      .set({ visibility: AssetVisibility.Locked })
      .where('id', '=', asset.id)
      .execute();
    expect(await sut.get(user.id, album.id)).toMatchObject({ assetCount: 1 });
  });

  it('should paginate deterministically without duplicating members', async () => {
    const { ctx, sut, user, album, asset } = await setup();
    const { asset: second } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked });
    const { asset: third } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked });
    const ids = [asset.id, second.id, third.id].toSorted();
    await sut.addAssets(user.id, album.id, ids.toReversed());

    expect(await sut.getAssetIds(user.id, album.id, { skip: 0, take: 2 })).toEqual({
      assetIds: ids.slice(0, 2),
      hasNextPage: true,
    });
    expect(await sut.getAssetIds(user.id, album.id, { skip: 2, take: 2 })).toEqual({
      assetIds: ids.slice(2),
      hasNextPage: false,
    });
  });

  it('should remove memberships without deleting or unlocking assets', async () => {
    const { sut, user, album, asset } = await setup();
    await sut.addAssets(user.id, album.id, [asset.id]);
    await sut.removeAssets(user.id, album.id, [asset.id]);
    await sut.removeAssets(user.id, album.id, [asset.id]);

    expect(await sut.get(user.id, album.id)).toMatchObject({ assetCount: 0 });
    expect(await database.selectFrom('asset').selectAll().where('id', '=', asset.id).executeTakeFirst()).toMatchObject({
      visibility: AssetVisibility.Locked,
      deletedAt: null,
    });
  });

  it('should delete a grouping without deleting or unlocking its assets', async () => {
    const { sut, user, album, asset } = await setup();
    const before = await database.selectFrom('asset').selectAll().where('id', '=', asset.id).executeTakeFirstOrThrow();
    await sut.addAssets(user.id, album.id, [asset.id]);
    expect(await sut.delete(user.id, album.id)).toBe(true);
    expect(await sut.get(user.id, album.id)).toBeUndefined();
    expect(await database.selectFrom('asset').selectAll().where('id', '=', asset.id).executeTakeFirst()).toEqual(
      before,
    );
  });

  it('should leave pre-existing locked assets intact through all grouping operations', async () => {
    const { ctx, sut, user, album, asset } = await setup();
    const { asset: ungrouped } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked });
    const ids = [asset.id, ungrouped.id];
    const snapshot = () => database.selectFrom('asset').selectAll().where('id', 'in', ids).orderBy('id').execute();
    const before = await snapshot();

    await sut.addAssets(user.id, album.id, [asset.id]);
    await sut.update(user.id, album.id, 'Renamed private group');
    await sut.getAll(user.id);
    await sut.getAssetIds(user.id, album.id, { skip: 0, take: 50 });
    await sut.removeAssets(user.id, album.id, [asset.id]);
    await sut.delete(user.id, album.id);

    // Compare every column, including path, checksum, ownership and timestamps.
    // A grouped asset and a pre-existing ungrouped asset must both be untouched.
    expect(await snapshot()).toEqual(before);
  });

  it('should serialize simultaneous duplicate additions and removals without changing the asset', async () => {
    const { sut, user, album, asset } = await setup();
    const before = await database.selectFrom('asset').selectAll().where('id', '=', asset.id).executeTakeFirstOrThrow();
    await Promise.all(Array.from({ length: 12 }, () => sut.addAssets(user.id, album.id, [asset.id])));
    expect(await sut.get(user.id, album.id)).toMatchObject({ assetCount: 1 });
    await Promise.all(Array.from({ length: 12 }, () => sut.removeAssets(user.id, album.id, [asset.id])));
    expect(await sut.get(user.id, album.id)).toMatchObject({ assetCount: 0 });
    expect(await database.selectFrom('asset').selectAll().where('id', '=', asset.id).executeTakeFirst()).toEqual(
      before,
    );
  });

  it('should lock overlapping assets in consistent order across different groups', async () => {
    const { ctx, sut, user, album, asset } = await setup();
    const otherAlbum = await sut.create(user.id, 'Second synthetic group');
    const { asset: otherAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked });
    await Promise.all([
      sut.addAssets(user.id, album.id, [asset.id, otherAsset.id]),
      sut.addAssets(user.id, otherAlbum.id, [otherAsset.id, asset.id]),
    ]);
    expect(await sut.get(user.id, album.id)).toMatchObject({ assetCount: 2 });
    expect(await sut.get(user.id, otherAlbum.id)).toMatchObject({ assetCount: 2 });
  });

  it('should reject membership if a concurrent transaction moves the asset out of locked visibility', async () => {
    const { sut, user, album, asset } = await setup();
    let addition: Promise<boolean> | undefined;
    await database.transaction().execute(async (tx) => {
      await tx.selectFrom('asset').select('id').where('id', '=', asset.id).forUpdate().executeTakeFirstOrThrow();
      // This request must either observe the new visibility or wait for our row
      // lock and recheck it; neither interleaving may insert the membership.
      addition = sut
        .addAssets(user.id, album.id, [asset.id])
        .then(() => true)
        .catch(() => false);
      await tx.updateTable('asset').set({ visibility: AssetVisibility.Timeline }).where('id', '=', asset.id).execute();
    });
    expect(await addition).toBe(false);
    expect(await sut.get(user.id, album.id)).toMatchObject({ assetCount: 0 });
    expect(
      await database.selectFrom('locked_album_asset').selectAll().where('albumId', '=', album.id).execute(),
    ).toEqual([]);
  });
});

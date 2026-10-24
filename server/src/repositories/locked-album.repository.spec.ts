import { BadRequestException } from '@nestjs/common';
import {
  type CompiledQuery,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  type QueryResult,
} from 'kysely';
import { AssetStatus, AssetVisibility } from 'src/enum.js';
import { LockedAlbumRepository } from 'src/repositories/locked-album.repository.js';
import { DB } from 'src/schema/index.js';

// Compile real PostgreSQL queries, but never open a connection or execute database SQL.
const setup = (responses: unknown[][] = []) => {
  const queries: CompiledQuery[] = [];
  const driver = new DummyDriver();
  const acquireConnection = driver.acquireConnection.bind(driver);
  vi.spyOn(driver, 'acquireConnection').mockImplementation(async () => {
    const connection = await acquireConnection();
    connection.executeQuery = <R>(query: CompiledQuery): Promise<QueryResult<R>> => {
      queries.push(query);
      return Promise.resolve({ rows: (responses.shift() ?? []) as R[], numAffectedRows: 0n });
    };
    return connection;
  });
  const commit = vi.spyOn(driver, 'commitTransaction');
  const rollback = vi.spyOn(driver, 'rollbackTransaction');
  const db = new Kysely<DB>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => driver,
      createIntrospector: (db) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  });
  return { sut: new LockedAlbumRepository(db), queries, commit, rollback };
};

describe(LockedAlbumRepository.name, () => {
  const ownerId = '00000000-0000-4000-8000-000000000001';
  const albumId = '00000000-0000-4000-8000-000000000002';
  const firstAsset = '00000000-0000-4000-8000-000000000003';
  const secondAsset = '00000000-0000-4000-8000-000000000004';

  it('scopes albums and their filtered numeric asset counts to the owner', async () => {
    const { sut, queries } = setup();
    await sut.getAll(ownerId);
    const [query] = queries;
    expect(query.sql).toContain('"locked_album"."ownerId" =');
    expect(query.sql).toContain('"asset"."ownerId" =');
    expect(query.sql).toContain('"asset"."visibility" =');
    expect(query.sql).toContain('"asset"."status" =');
    expect(query.sql).toContain('"asset"."deletedAt" is null');
    expect(query.sql).toContain('count(*)::int');
    expect(query.parameters).toContain(AssetVisibility.Locked);
    expect(query.parameters).toContain(AssetStatus.Active);
    expect(query.sql).not.toContain('"album_asset"');
  });

  it('returns undefined for a missing owner-scoped album', async () => {
    const { sut, queries } = setup();
    await expect(sut.get(ownerId, albumId)).resolves.toBeUndefined();
    expect(queries[0].parameters).toContain(ownerId);
    expect(queries[0].parameters).toContain(albumId);
  });

  it('returns undefined when an owner-scoped update does not match', async () => {
    const { sut, queries } = setup();
    await expect(sut.update(ownerId, albumId, 'Renamed')).resolves.toBeUndefined();
    expect(queries).toHaveLength(1);
    expect(queries[0].sql).toContain('where "ownerId" =');
    expect(queries[0].parameters).toContain(ownerId);
  });

  it('returns false for a missing owner-scoped delete and never deletes assets', async () => {
    const { sut, queries } = setup();
    await expect(sut.delete(ownerId, albumId)).resolves.toBe(false);
    expect(queries).toHaveLength(1);
    expect(queries[0].sql).toContain('delete from "locked_album" where "ownerId" =');
    expect(queries[0].parameters).toEqual([ownerId, albumId]);
  });

  it('paginates visible memberships in stable UUID order with one lookahead', async () => {
    const { sut, queries } = setup([[{ id: firstAsset }, { id: secondAsset }]]);
    await expect(sut.getAssetIds(ownerId, albumId, { skip: 5, take: 1 })).resolves.toEqual({
      assetIds: [firstAsset],
      hasNextPage: true,
    });
    expect(queries[0].sql).toContain('order by "asset"."id" asc');
    expect(queries[0].sql).toContain('"asset"."deletedAt" is null');
    expect(queries[0].parameters).toEqual([
      ownerId,
      albumId,
      ownerId,
      AssetVisibility.Locked,
      AssetStatus.Active,
      2,
      5,
    ]);
  });

  it.each(['addAssets', 'removeAssets'] as const)(
    'rejects %s for a missing/foreign album, including empty lists',
    async (method) => {
      const { sut, queries, rollback } = setup();
      await expect(sut[method](ownerId, albumId, [])).rejects.toBeInstanceOf(BadRequestException);
      expect(queries).toHaveLength(1);
      expect(queries[0].sql).toContain('for update');
      expect(queries[0].parameters).toEqual([ownerId, albumId]);
      expect(rollback).toHaveBeenCalledOnce();
    },
  );

  it('rejects a partially invalid selection before any insert and rolls back', async () => {
    const { sut, queries, rollback, commit } = setup([[{ id: albumId }], [{ id: firstAsset }]]);
    await expect(sut.addAssets(ownerId, albumId, [firstAsset, secondAsset])).rejects.toThrow(
      'Invalid locked album or assets',
    );
    expect(queries).toHaveLength(2);
    expect(queries.some(({ sql }) => sql.startsWith('insert'))).toBe(false);
    expect(queries[1].sql).toContain('for update');
    expect(queries[1].sql).toContain('"deletedAt" is null');
    expect(queries[1].parameters).toEqual([
      firstAsset,
      secondAsset,
      ownerId,
      AssetVisibility.Locked,
      AssetStatus.Active,
    ]);
    expect(rollback).toHaveBeenCalledOnce();
    expect(commit).not.toHaveBeenCalled();
  });

  it('locks all eligible assets before idempotently adding deduplicated memberships', async () => {
    const { sut, queries, commit } = setup([[{ id: albumId }], [{ id: firstAsset }, { id: secondAsset }]]);
    await sut.addAssets(ownerId, albumId, [secondAsset, firstAsset, firstAsset]);
    expect(queries[1].sql).toContain('order by "id" asc for update');
    expect(queries[2].sql).toContain('insert into "locked_album_asset"');
    expect(queries[2].sql).toContain('on conflict ("albumId", "assetId") do nothing');
    expect(queries[2].parameters).toEqual([albumId, firstAsset, albumId, secondAsset]);
    expect(commit).toHaveBeenCalledOnce();
  });

  it('removes only memberships after locking the owner-scoped album', async () => {
    const { sut, queries } = setup([[{ id: albumId }]]);
    await sut.removeAssets(ownerId, albumId, [firstAsset]);
    expect(queries[1].sql).toContain('delete from "locked_album_asset"');
    expect(queries[1].parameters).toEqual([albumId, firstAsset]);
    expect(queries.some(({ sql }) => sql.startsWith('delete from "asset"'))).toBe(false);
    expect(queries.some(({ sql }) => sql.startsWith('update "asset"'))).toBe(false);
  });
});

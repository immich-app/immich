import { Kysely, sql } from 'kysely';
import { FileMigrationProvider, Migrator } from 'kysely/migration';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { LockedAlbumController } from 'src/controllers/locked-album.controller.js';
import { AssetType, AssetVisibility } from 'src/enum.js';
import { ConfigRepository } from 'src/repositories/config.repository.js';
import { DatabaseRepository } from 'src/repositories/database.repository.js';
import { LockedAlbumRepository } from 'src/repositories/locked-album.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { DB } from 'src/schema/index.js';
import { BaseService } from 'src/services/base.service.js';
import { LockedAlbumService } from 'src/services/locked-album.service.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { newMediumService } from 'test/medium.factory.js';
import { controllerSetup, getKyselyDB, newRandomImage } from 'test/utils.js';

const migrationName = '1792800000000-AddLockedAlbums';
const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');

// This suite only uses getKyselyDB's disposable Testcontainers database. Never
// add a caller-supplied database URL or media directory to this release gate.
describe('Locked albums isolated PostgreSQL release gate', () => {
  let database: Kysely<DB>;

  beforeAll(async () => {
    database = await getKyselyDB();
    return () => database.destroy();
  });

  it('preserves complete pre-upgrade records and actual originals through HTTP CRUD, rollback and re-upgrade', async () => {
    const migrator = new Migrator({
      db: database,
      migrationTableName: 'kysely_migrations',
      migrationLockTableName: 'kysely_migrations_lock',
      provider: new FileMigrationProvider({
        fs: { readdir },
        path: { join },
        import: (filePath) => import(filePath),
        migrationFolder: join(import.meta.dirname, '../../../src/schema/migrations'),
      }),
    });
    const migrations = await migrator.getMigrations();
    expect(migrations.at(-1)?.name).toBe(migrationName);
    const rollback = async () => {
      const result = await migrator.migrateDown();
      expect(result.error).toBeUndefined();
      expect(result.results).toEqual([{ migrationName, direction: 'Down', status: 'Success' }]);
    };
    // The template was built from the entire Immich migration history, including
    // its extension stack. Revert only the final grouping migration before seed.
    await rollback();
    const tables = () =>
      sql<{ name: string }>`
      select tablename as name from pg_tables where schemaname = 'public' order by tablename
    `
        .execute(database)
        .then(({ rows }) => rows);
    const tablesBefore = await tables();
    const { ctx } = newMediumService(BaseService, { database, real: [], mock: [LoggingRepository] });
    const { user } = await ctx.newUser();
    const { user: other } = await ctx.newUser();
    const evidenceDir = await mkdtemp(join(tmpdir(), 'locked-albums-release-'));
    const mediaDir = join(evidenceDir, 'synthetic-originals');
    await mkdir(mediaDir);
    const videoPath = join(mediaDir, 'locked-video.mp4');
    execFileSync('ffmpeg', [
      '-nostdin',
      '-v',
      'error',
      '-f',
      'lavfi',
      '-i',
      'color=c=blue:s=16x16:r=1',
      '-frames:v',
      '1',
      '-c:v',
      'mpeg4',
      videoPath,
    ]);
    const assets = [];
    for (const [index, visibility, ownerId] of [
      [0, AssetVisibility.Locked, user.id],
      [1, AssetVisibility.Locked, user.id],
      [2, AssetVisibility.Locked, other.id],
      [3, AssetVisibility.Timeline, user.id],
      [4, AssetVisibility.Locked, user.id],
    ] as const) {
      const path = index === 1 ? videoPath : join(mediaDir, `synthetic-${index}.png`);
      if (index !== 1) {
        await writeFile(path, newRandomImage());
      }
      const bytes = await readFile(path);
      const { asset } = await ctx.newAsset({
        ownerId,
        visibility,
        originalPath: path,
        originalFileName: index === 1 ? 'locked-video.mp4' : `synthetic-${index}.png`,
        type: index === 1 ? AssetType.Video : AssetType.Image,
        checksum: createHash('sha1').update(bytes).digest(),
      });
      assets.push(asset);
    }
    await ctx.softDeleteAsset(assets[4].id);
    await writeFile(
      join(mediaDir, 'unrelated-original.txt'),
      'Synthetic unrelated original; must remain byte-identical.\n',
    );
    const snapshot = async () => {
      const names = await readdir(mediaDir);
      return {
        // to_jsonb captures *every* SQL column, including microsecond timestamps
        // that a JavaScript Date would otherwise truncate.
        assets: await sql`select to_jsonb(a) as row from asset a order by id`
          .execute(database)
          .then(({ rows }) => rows),
        users: await sql`select to_jsonb(u) as row from "user" u order by id`
          .execute(database)
          .then(({ rows }) => rows),
        files: await Promise.all(
          names.sort().map(async (name) => ({
            name,
            sha256: sha256(await readFile(join(mediaDir, name))),
          })),
        ),
      };
    };
    const before = await snapshot();
    await writeFile(join(evidenceDir, 'before.json'), JSON.stringify(before, null, 2));
    const unchanged = async () => expect(await snapshot()).toEqual(before);
    const repository = new LockedAlbumRepository(database);
    const runner = new DatabaseRepository(database, LoggingRepository.create(), new ConfigRepository());
    expect(await runner.runMigrations()).toBe(1);
    await unchanged();
    expect(await repository.getAll(user.id)).toEqual([]);
    expect(await database.selectFrom('locked_album_asset').selectAll().execute()).toEqual([]);

    const http = await controllerSetup(LockedAlbumController, [
      LockedAlbumService,
      { provide: LockedAlbumRepository, useValue: repository },
    ]);
    const ownerAuth = () => AuthFactory.from({ id: user.id }).session({ hasElevatedPermission: true }).build();
    http.authenticate.mockResolvedValue(ownerAuth());
    try {
      const api = () => request(http.getHttpServer());
      const created = await api().post('/locked-albums').send({ albumName: '  Synthetic private  ' }).expect(201);
      const id = created.body.id as string;
      expect(created.body).toMatchObject({ albumName: 'Synthetic private', assetCount: 0 });
      const path = `/locked-albums/${id}`;
      const ids = assets.slice(0, 2).map(({ id }) => id);
      await api().put(`${path}/assets`).send({ ids }).expect(204);
      await api().put(`${path}/assets`).send({ ids }).expect(204);
      await api()
        .get(path)
        .expect(200)
        .expect(({ body }) => expect(body.assetCount).toBe(2));
      await api()
        .get(`${path}/assets?take=1`)
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual({ assetIds: ids.toSorted().slice(0, 1), hasNextPage: true });
        });
      await api().patch(path).send({ albumName: 'Renamed synthetic' }).expect(200);
      for (const invalid of [assets[2], assets[3], assets[4]]) {
        await api()
          .put(`${path}/assets`)
          .send({ ids: [assets[0].id, invalid.id] })
          .expect(400);
      }
      expect(await repository.get(user.id, id)).toMatchObject({ assetCount: 2 });
      await unchanged();

      // Real controller + service + repository, with authentication resolution
      // injected at the boundary. This does NOT claim real login/PIN expiry E2E.
      for (const auth of [
        AuthFactory.from({ id: user.id }).session().build(),
        AuthFactory.from({ id: user.id }).apiKey().session({ hasElevatedPermission: true }).build(),
        AuthFactory.from({ id: user.id }).sharedLink().session({ hasElevatedPermission: true }).build(),
        AuthFactory.from({ id: user.id }).build(),
      ]) {
        http.authenticate.mockResolvedValue(auth);
        for (const method of ['get', 'patch', 'delete'] as const) {
          const response = await api()
            [method](path)
            .send(method === 'patch' ? { albumName: 'Denied' } : undefined);
          expect(response.status).toBe(401);
          expect(response.headers['cache-control']).toBe('no-store');
        }
        await api().get('/locked-albums').expect(401);
        await api().post('/locked-albums').send({ albumName: 'Denied' }).expect(401);
        await api().get(`${path}/assets`).expect(401);
        await api().put(`${path}/assets`).send({ ids }).expect(401);
        await api().delete(`${path}/assets`).send({ ids }).expect(401);
      }
      http.authenticate.mockResolvedValue(
        AuthFactory.from({ id: other.id }).session({ hasElevatedPermission: true }).build(),
      );
      await api()
        .get('/locked-albums')
        .expect(200)
        .expect(({ body }) => expect(body).toEqual([]));
      for (const method of ['get', 'patch', 'delete'] as const) {
        await api()
          [method](path)
          .send(method === 'patch' ? { albumName: 'Denied' } : undefined)
          .expect(404);
      }
      await api().get(`${path}/assets`).expect(404);
      await api().put(`${path}/assets`).send({ ids }).expect(400);
      await api().delete(`${path}/assets`).send({ ids }).expect(400);
      http.authenticate.mockResolvedValue(ownerAuth());
      await api()
        .delete(`${path}/assets`)
        .send({ ids: [ids[0]] })
        .expect(204);
      await unchanged();
      await api().delete(path).expect(204);
      await unchanged();
      // Roll back with populated grouping metadata, not just empty tables.
      const remaining = await repository.create(user.id, 'Removed by rollback');
      await repository.addAssets(user.id, remaining.id, ids);
      await rollback();
      await unchanged();
      expect(await tables()).toEqual(tablesBefore);
      expect(await runner.runMigrations()).toBe(1);
      expect(await repository.getAll(user.id)).toEqual([]);
      await unchanged();
      await rollback();
      await unchanged();
      expect(await tables()).toEqual(tablesBefore);
      await writeFile(join(evidenceDir, 'after.json'), JSON.stringify(await snapshot(), null, 2));
      await writeFile(
        join(evidenceDir, 'result.json'),
        JSON.stringify(
          {
            migrationName,
            migrationSha256: sha256(
              await readFile(join(import.meta.dirname, '../../../src/schema/migrations', `${migrationName}.ts`)),
            ),
            snapshotSha256: sha256(JSON.stringify(before)),
            postgres: await sql`select version()`.execute(database).then(({ rows }) => rows),
            extensions: await sql`select extname, extversion from pg_extension order by extname`
              .execute(database)
              .then(({ rows }) => rows),
          },
          null,
          2,
        ),
      );
      console.log(`Synthetic upgrade evidence: ${evidenceDir}`);
    } finally {
      await http.close();
    }
  }, 60_000);
});

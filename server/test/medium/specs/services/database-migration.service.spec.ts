import { createPostgres, DatabaseConnectionParams } from '@immich/sql-tools';
import { FileMigrationProvider, Kysely, Migrator } from 'kysely';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ConfigRepository } from 'src/repositories/config.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { getKyselyConfig } from 'src/utils/database';

// Helper: create a raw database (no migrations applied)
const createRawDatabase = async (name: string): Promise<Kysely<DB>> => {
  const testUrl = process.env.IMMICH_TEST_POSTGRES_URL!;
  const templateDb = testUrl.split('/').pop()!;
  const connection = {
    connectionType: 'url',
    url: testUrl.replace(`/${templateDb}`, '/postgres'),
  } as DatabaseConnectionParams;
  const pgSql = createPostgres({ maxConnections: 1, connection });

  await pgSql.unsafe(`DROP DATABASE IF EXISTS ${name}`);
  await pgSql.unsafe(`CREATE DATABASE ${name} OWNER postgres`);
  await pgSql.end();

  return new Kysely<DB>(
    getKyselyConfig({
      connectionType: 'url',
      url: testUrl.replace(`/${templateDb}`, `/${name}`),
    }),
  );
};

const createRepo = (db: Kysely<DB>) => {
  const configRepository = new ConfigRepository();
  const logger = LoggingRepository.create();
  return new DatabaseRepository(db, logger, configRepository);
};

describe('Database Migration Scenarios', () => {
  // Scenario A: Fresh install
  it('should run all migrations on a fresh database', async () => {
    const db = await createRawDatabase('migration_test_fresh');
    try {
      const repo = createRepo(db);
      await repo.runMigrations();

      const migrations = await repo.getMigrations();
      expect(migrations.length).toBeGreaterThan(0);

      // Verify fork migrations are present
      const forkMigrations = migrations.filter(
        (m) =>
          m.name.includes('CreateStorageMigrationLogTable') ||
          m.name.includes('CreateSharedSpaceTables') ||
          m.name.includes('CreateUserGroupTables'),
      );
      expect(forkMigrations.length).toBe(3);

      // Verify upstream migrations are present
      const upstreamMigrations = migrations.filter((m) => m.name.includes('InitialMigration'));
      expect(upstreamMigrations.length).toBe(1);
    } finally {
      await db.destroy();
    }
  });

  // Scenario B: Immich-to-Gallery migration
  it('should apply fork migrations on top of an upstream-only database', async () => {
    const db = await createRawDatabase('migration_test_immich');
    try {
      // Step 1: Run only upstream migrations (simulates Immich state)
      const upstreamOnlyMigrator = new Migrator({
        db,
        migrationLockTableName: 'kysely_migrations_lock',
        allowUnorderedMigrations: true,
        migrationTableName: 'kysely_migrations',
        provider: new FileMigrationProvider({
          fs: { readdir },
          path: { join },
          // eslint-disable-next-line unicorn/prefer-module
          migrationFolder: join(__dirname, '../../../../src/schema/migrations'),
        }),
      });

      const { error: upstreamError } = await upstreamOnlyMigrator.migrateToLatest();
      expect(upstreamError).toBeUndefined();

      const upstreamMigrations = await db
        .selectFrom('kysely_migrations')
        .select(['name'])
        .orderBy('name', 'asc')
        .execute();

      // Verify no fork migrations applied yet
      const forkMigrationsBefore = upstreamMigrations.filter(
        (m) =>
          m.name.includes('CreateStorageMigrationLogTable') ||
          m.name.includes('CreateSharedSpaceTables') ||
          m.name.includes('CreateUserGroupTables'),
      );
      expect(forkMigrationsBefore).toHaveLength(0);

      // Step 2: Run full Gallery migrator (composite provider)
      const repo = createRepo(db);
      await repo.runMigrations();

      // Step 3: Verify fork migrations were applied
      const allMigrations = await repo.getMigrations();
      const forkMigrationsAfter = allMigrations.filter(
        (m) =>
          m.name.includes('CreateStorageMigrationLogTable') ||
          m.name.includes('CreateSharedSpaceTables') ||
          m.name.includes('CreateUserGroupTables'),
      );
      expect(forkMigrationsAfter).toHaveLength(3);

      // Verify interleaving
      const names = allMigrations.map((m) => m.name);
      const storageIdx = names.findIndex((n) => n.includes('CreateStorageMigrationLogTable'));
      const opusIdx = names.findIndex((n) => n.includes('UpdateOpusCodecName'));
      expect(storageIdx).toBeGreaterThan(-1);
      expect(opusIdx).toBeGreaterThan(-1);
      expect(storageIdx).toBeLessThan(opusIdx);
    } finally {
      await db.destroy();
    }
  });

  // Scenario C: Existing Gallery user — idempotent
  it('should be a no-op when all migrations are already applied', async () => {
    const db = await createRawDatabase('migration_test_gallery');
    try {
      const repo = createRepo(db);
      await repo.runMigrations();
      const firstRun = await repo.getMigrations();

      await repo.runMigrations();
      const secondRun = await repo.getMigrations();

      expect(secondRun.length).toBe(firstRun.length);
      expect(secondRun.map((m) => m.name)).toEqual(firstRun.map((m) => m.name));
    } finally {
      await db.destroy();
    }
  });

  // Scenario D: Rollback
  it('should rollback the last migration regardless of interleaving', async () => {
    const db = await createRawDatabase('migration_test_rollback');
    try {
      const repo = createRepo(db);
      await repo.runMigrations();
      const before = await repo.getMigrations();
      const lastMigration = before.at(-1)!.name;

      const reverted = await repo.revertLastMigration();

      expect(reverted).toBe(lastMigration);

      const after = await repo.getMigrations();
      expect(after.length).toBe(before.length - 1);
      expect(after.map((m) => m.name)).not.toContain(lastMigration);
    } finally {
      await db.destroy();
    }
  });

  // Scenario E: Sorted order verification
  it('should return all migrations sorted by name including both upstream and fork', async () => {
    const db = await createRawDatabase('migration_test_sorted');
    try {
      const repo = createRepo(db);
      await repo.runMigrations();

      const migrations = await repo.getMigrations();
      const names = migrations.map((m) => m.name);
      const sorted = names.toSorted();
      expect(names).toEqual(sorted);

      // Verify interleaving
      const storageIdx = names.findIndex((n) => n.includes('CreateStorageMigrationLogTable'));
      const opusIdx = names.findIndex((n) => n.includes('UpdateOpusCodecName'));
      const initialIdx = names.findIndex((n) => n.includes('InitialMigration'));

      expect(initialIdx).toBeLessThan(storageIdx);
      expect(storageIdx).toBeLessThan(opusIdx);
    } finally {
      await db.destroy();
    }
  });

  // Scenario F: Retry after revert
  it('should be able to re-run after a previous successful run', async () => {
    const db = await createRawDatabase('migration_test_retry');
    try {
      const repo = createRepo(db);
      await repo.runMigrations();
      await repo.revertLastMigration();
      const afterRevert = await repo.getMigrations();

      await repo.runMigrations();
      const afterRerun = await repo.getMigrations();

      expect(afterRerun.length).toBe(afterRevert.length + 1);
    } finally {
      await db.destroy();
    }
  });
});

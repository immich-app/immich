import { schemaFromCode } from '@immich/sql-tools';
import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { SystemConfig } from 'src/config';
import { AssetMetadataKey, UserMetadataKey } from 'src/enum';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SessionRepository } from 'src/repositories/session.repository';
import { BaseSync, SyncRepository } from 'src/repositories/sync.repository';
import { DB } from 'src/schema';
import { SyncService } from 'src/services/sync.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';
import { v4 } from 'uuid';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(SyncService, {
    database: db || defaultDatabase,
    real: [DatabaseRepository, SyncRepository, SessionRepository],
    mock: [LoggingRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

const deletedLongAgo = DateTime.now().minus({ days: 35 }).toISO();

const assertTableCount = async <T extends keyof DB>(db: Kysely<DB>, t: T, count: number) => {
  const { table } = db.dynamic;
  const results = await db.selectFrom(table(t).as(t)).selectAll().execute();
  expect(results).toHaveLength(count);
};

const withPublicUsers = (publicUsers: boolean) => ({ server: { publicUsers } }) as SystemConfig;

const isPendingSyncReset = async (db: Kysely<DB>, sessionId: string) => {
  const session = await db
    .selectFrom('session')
    .select('isPendingSyncReset')
    .where('id', '=', sessionId)
    .executeTakeFirstOrThrow();
  return session.isPendingSyncReset;
};

describe(SyncService.name, () => {
  describe('onAuditTableCleanup', () => {
    it('should work', async () => {
      const { sut } = setup();
      await expect(sut.onAuditTableCleanup()).resolves.toBeUndefined();
    });

    it('should cleanup the album_audit table', async () => {
      const { sut, ctx } = setup();
      const tableName = 'album_audit';

      await ctx.database
        .insertInto(tableName)
        .values({ albumId: v4(), userId: v4(), deletedAt: deletedLongAgo })
        .execute();

      await assertTableCount(ctx.database, tableName, 1);
      await expect(sut.onAuditTableCleanup()).resolves.toBeUndefined();
      await assertTableCount(ctx.database, tableName, 0);
    });

    it('should cleanup the album_asset_audit table', async () => {
      const { sut, ctx } = setup();
      const tableName = 'album_asset_audit';
      const { user } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: user.id });
      await ctx.database
        .insertInto(tableName)
        .values({ albumId: album.id, assetId: v4(), deletedAt: deletedLongAgo })
        .execute();

      await assertTableCount(ctx.database, tableName, 1);
      await expect(sut.onAuditTableCleanup()).resolves.toBeUndefined();
      await assertTableCount(ctx.database, tableName, 0);
    });

    it('should cleanup the album_user_audit table', async () => {
      const { sut, ctx } = setup();
      const tableName = 'album_user_audit';
      await ctx.database
        .insertInto(tableName)
        .values({ albumId: v4(), userId: v4(), deletedAt: deletedLongAgo })
        .execute();

      await assertTableCount(ctx.database, tableName, 1);
      await expect(sut.onAuditTableCleanup()).resolves.toBeUndefined();
      await assertTableCount(ctx.database, tableName, 0);
    });

    it('should cleanup the asset_audit table', async () => {
      const { sut, ctx } = setup();

      await ctx.database
        .insertInto('asset_audit')
        .values({ assetId: v4(), ownerId: v4(), deletedAt: deletedLongAgo })
        .execute();

      await assertTableCount(ctx.database, 'asset_audit', 1);
      await expect(sut.onAuditTableCleanup()).resolves.toBeUndefined();
      await assertTableCount(ctx.database, 'asset_audit', 0);
    });

    it('should cleanup the asset_face_audit table', async () => {
      const { sut, ctx } = setup();
      const tableName = 'asset_face_audit';
      await ctx.database
        .insertInto(tableName)
        .values({ assetFaceId: v4(), assetId: v4(), deletedAt: deletedLongAgo })
        .execute();

      await assertTableCount(ctx.database, tableName, 1);
      await expect(sut.onAuditTableCleanup()).resolves.toBeUndefined();
      await assertTableCount(ctx.database, tableName, 0);
    });

    it('should cleanup the asset_metadata_audit table', async () => {
      const { sut, ctx } = setup();
      const tableName = 'asset_metadata_audit';
      await ctx.database
        .insertInto(tableName)
        .values({ assetId: v4(), key: AssetMetadataKey.MobileApp, deletedAt: deletedLongAgo })
        .execute();

      await assertTableCount(ctx.database, tableName, 1);
      await expect(sut.onAuditTableCleanup()).resolves.toBeUndefined();
      await assertTableCount(ctx.database, tableName, 0);
    });

    it('should cleanup the memory_audit table', async () => {
      const { sut, ctx } = setup();
      const tableName = 'memory_audit';
      await ctx.database
        .insertInto(tableName)
        .values({ memoryId: v4(), userId: v4(), deletedAt: deletedLongAgo })
        .execute();

      await assertTableCount(ctx.database, tableName, 1);
      await expect(sut.onAuditTableCleanup()).resolves.toBeUndefined();
      await assertTableCount(ctx.database, tableName, 0);
    });

    it('should cleanup the memory_asset_audit table', async () => {
      const { sut, ctx } = setup();
      const tableName = 'memory_asset_audit';
      const { user } = await ctx.newUser();
      const { memory } = await ctx.newMemory({ ownerId: user.id });
      await ctx.database
        .insertInto(tableName)
        .values({ memoryId: memory.id, assetId: v4(), deletedAt: deletedLongAgo })
        .execute();

      await assertTableCount(ctx.database, tableName, 1);
      await expect(sut.onAuditTableCleanup()).resolves.toBeUndefined();
      await assertTableCount(ctx.database, tableName, 0);
    });

    it('should cleanup the partner_audit table', async () => {
      const { sut, ctx } = setup();
      const tableName = 'partner_audit';
      await ctx.database
        .insertInto(tableName)
        .values({ sharedById: v4(), sharedWithId: v4(), deletedAt: deletedLongAgo })
        .execute();

      await assertTableCount(ctx.database, tableName, 1);
      await expect(sut.onAuditTableCleanup()).resolves.toBeUndefined();
      await assertTableCount(ctx.database, tableName, 0);
    });

    it('should cleanup the stack_audit table', async () => {
      const { sut, ctx } = setup();
      const tableName = 'stack_audit';
      await ctx.database
        .insertInto(tableName)
        .values({ stackId: v4(), userId: v4(), deletedAt: deletedLongAgo })
        .execute();

      await assertTableCount(ctx.database, tableName, 1);
      await expect(sut.onAuditTableCleanup()).resolves.toBeUndefined();
      await assertTableCount(ctx.database, tableName, 0);
    });

    it('should cleanup the user_audit table', async () => {
      const { sut, ctx } = setup();
      const tableName = 'user_audit';
      await ctx.database.insertInto(tableName).values({ userId: v4(), deletedAt: deletedLongAgo }).execute();

      await assertTableCount(ctx.database, tableName, 1);
      await expect(sut.onAuditTableCleanup()).resolves.toBeUndefined();
      await assertTableCount(ctx.database, tableName, 0);
    });

    it('should cleanup the user_metadata_audit table', async () => {
      const { sut, ctx } = setup();
      const tableName = 'user_metadata_audit';
      await ctx.database
        .insertInto(tableName)
        .values({ userId: v4(), key: UserMetadataKey.Onboarding, deletedAt: deletedLongAgo })
        .execute();

      await assertTableCount(ctx.database, tableName, 1);
      await expect(sut.onAuditTableCleanup()).resolves.toBeUndefined();
      await assertTableCount(ctx.database, tableName, 0);
    });

    it('should skip recent records', async () => {
      const { sut, ctx } = setup();

      const keep = {
        id: v4(),
        assetId: v4(),
        ownerId: v4(),
        deletedAt: DateTime.now().minus({ days: 25 }).toISO(),
      };

      const remove = {
        id: v4(),
        assetId: v4(),
        ownerId: v4(),
        deletedAt: DateTime.now().minus({ days: 35 }).toISO(),
      };

      await ctx.database.insertInto('asset_audit').values([keep, remove]).execute();
      await assertTableCount(ctx.database, 'asset_audit', 2);
      await expect(sut.onAuditTableCleanup()).resolves.toBeUndefined();

      const after = await ctx.database.selectFrom('asset_audit').select(['id']).execute();
      expect(after).toHaveLength(1);
      expect(after[0].id).toBe(keep.id);
    });

    it('should cleanup every table', async () => {
      const { sut } = setup();

      const auditTables = schemaFromCode()
        .tables.filter((table) => table.name.endsWith('_audit'))
        .map(({ name }) => name);

      const auditCleanupSpy = vi.spyOn(BaseSync.prototype as any, 'auditCleanup');
      await expect(sut.onAuditTableCleanup()).resolves.toBeUndefined();

      expect(auditCleanupSpy).toHaveBeenCalledTimes(auditTables.length);
      for (const table of auditTables) {
        expect(auditCleanupSpy, `Audit table ${table} was not cleaned up`).toHaveBeenCalledWith(table, 31);
      }
    });
  });

  describe('onConfigUpdate', () => {
    it('should require a full sync for non-admins when public users is disabled', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const { session } = await ctx.newSession({ userId: user.id });

      await sut.onConfigUpdate({ oldConfig: withPublicUsers(true), newConfig: withPublicUsers(false) });

      await expect(isPendingSyncReset(ctx.database, session.id)).resolves.toBe(true);
    });

    it('should not require a full sync for admins when public users is disabled', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const { user } = await ctx.newUser({ isAdmin: true });
      const { session } = await ctx.newSession({ userId: user.id });

      await sut.onConfigUpdate({ oldConfig: withPublicUsers(true), newConfig: withPublicUsers(false) });

      await expect(isPendingSyncReset(ctx.database, session.id)).resolves.toBe(false);
    });

    it('should require a full sync for non-admins when public users is enabled', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const { session } = await ctx.newSession({ userId: user.id });

      await sut.onConfigUpdate({ oldConfig: withPublicUsers(false), newConfig: withPublicUsers(true) });

      await expect(isPendingSyncReset(ctx.database, session.id)).resolves.toBe(true);
    });

    it('should not require a full sync when public users was already disabled', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const { session } = await ctx.newSession({ userId: user.id });

      await sut.onConfigUpdate({ oldConfig: withPublicUsers(false), newConfig: withPublicUsers(false) });

      await expect(isPendingSyncReset(ctx.database, session.id)).resolves.toBe(false);
    });

    it('should not require a full sync when public users was already enabled', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const { session } = await ctx.newSession({ userId: user.id });

      await sut.onConfigUpdate({ oldConfig: withPublicUsers(true), newConfig: withPublicUsers(true) });

      await expect(isPendingSyncReset(ctx.database, session.id)).resolves.toBe(false);
    });
  });
});

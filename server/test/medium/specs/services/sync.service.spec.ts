import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { AssetMetadataKey, UserMetadataKey } from 'src/enum';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SyncRepository } from 'src/repositories/sync.repository';
import { DB } from 'src/schema';
import { SyncService } from 'src/services/sync.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';
import { v4 } from 'uuid';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(SyncService, {
    database: db || defaultDatabase,
    real: [DatabaseRepository, SyncRepository],
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
  });
});

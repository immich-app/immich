import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { AssetVisibility, MemoryType } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
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
  return { ctx, sut: ctx.get(MemoryRepository) };
};

const selectMemoryIds = (ctx: ReturnType<typeof setup>['ctx']) =>
  ctx.database.selectFrom('memory').select('id').orderBy('id').execute();

const selectMemoryAssetRows = (ctx: ReturnType<typeof setup>['ctx']) =>
  ctx.database.selectFrom('memory_asset').select(['assetId', 'memoriesId']).execute();

const cleanupNow = () => DateTime.utc(2026, 4, 27) as DateTime<true>;

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(MemoryRepository.name, () => {
  describe('cleanup', () => {
    it('should delete only unsaved memories older than the retention period', async () => {
      const now = vi.spyOn(DateTime, 'now').mockReturnValue(cleanupNow());

      try {
        const { ctx, sut } = setup();
        const { user } = await ctx.newUser();
        const oldDate = new Date('2024-01-01T00:00:00Z');
        const newDate = new Date('2026-01-01T00:00:00Z');
        const { memory: oldUnsavedMemory } = await ctx.newMemory({
          ownerId: user.id,
          createdAt: oldDate,
          updatedAt: oldDate,
          isSaved: false,
        });
        const { memory: newUnsavedMemory } = await ctx.newMemory({
          ownerId: user.id,
          createdAt: newDate,
          updatedAt: newDate,
          isSaved: false,
        });
        const { memory: oldSavedMemory } = await ctx.newMemory({
          ownerId: user.id,
          createdAt: oldDate,
          updatedAt: oldDate,
          isSaved: true,
        });

        await sut.cleanup(365);

        const memories = await selectMemoryIds(ctx);
        const memoryIds = memories.map(({ id }) => id);
        expect(memoryIds).not.toContain(oldUnsavedMemory.id);
        expect(memoryIds).toEqual(expect.arrayContaining([newUnsavedMemory.id, oldSavedMemory.id]));
      } finally {
        now.mockRestore();
      }
    });

    it('should use the shown date when deciding retention for scheduled memories', async () => {
      const now = vi.spyOn(DateTime, 'now').mockReturnValue(cleanupNow());

      try {
        const { ctx, sut } = setup();
        const { user } = await ctx.newUser();
        const generatedDate = new Date('2026-04-20T00:00:00Z');
        const { memory: alreadyShownMemory } = await ctx.newMemory({
          ownerId: user.id,
          createdAt: generatedDate,
          updatedAt: generatedDate,
          showAt: new Date('2026-04-25T00:00:00Z'),
          isSaved: false,
        });
        const { memory: futureMemory } = await ctx.newMemory({
          ownerId: user.id,
          createdAt: generatedDate,
          updatedAt: generatedDate,
          showAt: new Date('2026-04-30T00:00:00Z'),
          isSaved: false,
        });

        await sut.cleanup(1);

        const memories = await selectMemoryIds(ctx);
        const memoryIds = memories.map(({ id }) => id);
        expect(memoryIds).not.toContain(alreadyShownMemory.id);
        expect(memoryIds).toContain(futureMemory.id);
      } finally {
        now.mockRestore();
      }
    });

    it('should keep old unsaved memories when retention is zero', async () => {
      const now = vi.spyOn(DateTime, 'now').mockReturnValue(cleanupNow());

      try {
        const { ctx, sut } = setup();
        const { user } = await ctx.newUser();
        const { memory } = await ctx.newMemory({
          ownerId: user.id,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          isSaved: false,
        });

        await sut.cleanup(0);

        const memories = await selectMemoryIds(ctx);
        const memoryIds = memories.map(({ id }) => id);
        expect(memoryIds).toContain(memory.id);
      } finally {
        now.mockRestore();
      }
    });

    it('should remove invalid asset links when retention is zero', async () => {
      const now = vi.spyOn(DateTime, 'now').mockReturnValue(cleanupNow());

      try {
        const { ctx, sut } = setup();
        const { user } = await ctx.newUser();
        const { memory } = await ctx.newMemory({
          ownerId: user.id,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          isSaved: false,
        });
        const { asset: timelineAsset } = await ctx.newAsset({
          ownerId: user.id,
          visibility: AssetVisibility.Timeline,
        });
        const { asset: archivedAsset } = await ctx.newAsset({
          ownerId: user.id,
          visibility: AssetVisibility.Archive,
        });
        await ctx.newMemoryAsset({ memoryId: memory.id, assetId: timelineAsset.id });
        await ctx.newMemoryAsset({ memoryId: memory.id, assetId: archivedAsset.id });

        await sut.cleanup(0);

        const memories = await selectMemoryIds(ctx);
        const memoryIds = memories.map(({ id }) => id);
        expect(memoryIds).toContain(memory.id);
        await expect(selectMemoryAssetRows(ctx)).resolves.toEqual([
          { assetId: timelineAsset.id, memoriesId: memory.id },
        ]);
      } finally {
        now.mockRestore();
      }
    });
  });

  describe('hasRuleMemory', () => {
    it('should only match undeleted rule memories for the same owner, ruleId, and dedupeKey', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();

      await ctx.newMemory({
        ownerId: user.id,
        type: MemoryType.Rule,
        data: {
          ruleId: 'birthday',
          dedupeKey: 'birthday:person-1:2026-04-23',
          title: 'Happy birthday, Alice',
        },
      });
      await ctx.newMemory({
        ownerId: user.id,
        type: MemoryType.Rule,
        data: {
          ruleId: 'birthday',
          dedupeKey: 'birthday:person-1:2026-04-24',
          title: 'Happy birthday, Alice',
        },
      });
      await ctx.newMemory({
        ownerId: otherUser.id,
        type: MemoryType.Rule,
        data: {
          ruleId: 'birthday',
          dedupeKey: 'birthday:person-1:2026-04-23',
          title: 'Happy birthday, Alice',
        },
      });
      const { memory: deletedMemory } = await ctx.newMemory({
        ownerId: user.id,
        type: MemoryType.Rule,
        data: {
          ruleId: 'recent_trip',
          dedupeKey: 'recent_trip:france:paris:2026-04-23',
          title: 'Recent trip to Paris, France',
        },
      });
      await ctx.database
        .updateTable('memory')
        .set({ deletedAt: new Date('2026-04-23T00:00:00Z') })
        .where('id', '=', deletedMemory.id)
        .execute();

      await expect(sut.hasRuleMemory(user.id, 'birthday', 'birthday:person-1:2026-04-23')).resolves.toBe(true);
      await expect(sut.hasRuleMemory(user.id, 'birthday', 'birthday:person-1:2026-04-25')).resolves.toBe(false);
      await expect(sut.hasRuleMemory(user.id, 'recent_trip', 'recent_trip:france:paris:2026-04-23')).resolves.toBe(
        false,
      );
    });
  });
});

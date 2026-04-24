import { Kysely } from 'kysely';
import { MemoryType } from 'src/enum';
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

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(MemoryRepository.name, () => {
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

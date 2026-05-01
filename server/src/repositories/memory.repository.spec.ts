import { DummyDriver, Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from 'kysely';
import { DateTime } from 'luxon';
import { MemoryRepository } from 'src/repositories/memory.repository';
import type { DB } from 'src/schema';

const offlineKysely = () =>
  new Kysely<DB>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new DummyDriver(),
      createIntrospector: (db) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  });

describe(MemoryRepository.name, () => {
  const sut = new MemoryRepository(offlineKysely());

  describe('searchBuilder', () => {
    it('excludes future scheduled memories when no date filter is provided', () => {
      const now = vi.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2026-04-30T12:00:00Z') as DateTime<true>);

      try {
        const query = sut.searchBuilder('00000000-0000-0000-0000-000000000000', {}).selectAll('memory').compile();

        expect(query.sql).toContain('("showAt" is null or "showAt" <= $1)');
        expect(query.sql).not.toContain('"hideAt"');
        expect(query.parameters).toEqual([
          new Date('2026-04-30T12:00:00.000Z'),
          '00000000-0000-0000-0000-000000000000',
        ]);
      } finally {
        now.mockRestore();
      }
    });

    it('filters by the full visibility window when a date filter is provided', () => {
      const query = sut
        .searchBuilder('00000000-0000-0000-0000-000000000000', { for: new Date('2026-04-30T12:00:00.000Z') })
        .selectAll('memory')
        .compile();

      expect(query.sql).toContain('("showAt" is null or "showAt" <= $1)');
      expect(query.sql).toContain('("hideAt" is null or "hideAt" >= $2)');
      expect(query.parameters).toEqual([
        new Date('2026-04-30T12:00:00.000Z'),
        new Date('2026-04-30T12:00:00.000Z'),
        '00000000-0000-0000-0000-000000000000',
      ]);
    });
  });
});

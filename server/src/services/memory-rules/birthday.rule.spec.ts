import { DateTime } from 'luxon';
import { BirthdayMemoryRule } from 'src/services/memory-rules/birthday.rule';

describe(BirthdayMemoryRule.name, () => {
  it('creates one curated birthday candidate per matching person', async () => {
    const personRepository = {
      getBirthdaysForDay: vi
        .fn()
        .mockResolvedValue([{ id: 'person-1', name: 'Alice', birthDate: new Date('1990-04-23T00:00:00Z') }]),
    };
    const assetRepository = {
      getMemoryAssetsForPerson: vi.fn().mockResolvedValue([
        { id: 'a-2025-1', localDateTime: new Date('2025-04-01T12:00:00Z') },
        { id: 'a-2025-2', localDateTime: new Date('2025-03-01T12:00:00Z') },
        { id: 'a-2024-1', localDateTime: new Date('2024-04-01T12:00:00Z') },
        { id: 'a-2023-1', localDateTime: new Date('2023-04-01T12:00:00Z') },
        { id: 'a-2022-1', localDateTime: new Date('2022-04-01T12:00:00Z') },
        { id: 'a-2021-1', localDateTime: new Date('2021-04-01T12:00:00Z') },
      ]),
    };

    const rule = new BirthdayMemoryRule(personRepository as never, assetRepository as never);
    const [candidate] = await rule.evaluate({
      ownerId: 'user-1',
      target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
    });

    expect(candidate).toMatchObject({
      ruleId: 'birthday',
      dedupeKey: 'birthday:person-1:2026-04-23',
      title: 'Happy birthday, Alice',
      subtitle: 'Photos from different years',
      assetIds: ['a-2025-1', 'a-2025-2', 'a-2024-1', 'a-2023-1', 'a-2022-1', 'a-2021-1'],
    });
  });

  it('skips people with too few assets or only one year represented', async () => {
    const personRepository = {
      getBirthdaysForDay: vi
        .fn()
        .mockResolvedValue([{ id: 'person-1', name: 'Alice', birthDate: new Date('1990-04-23T00:00:00Z') }]),
    };
    const assetRepository = {
      getMemoryAssetsForPerson: vi.fn().mockResolvedValue([
        { id: 'a-1', localDateTime: new Date('2025-04-01T12:00:00Z') },
        { id: 'a-2', localDateTime: new Date('2025-03-01T12:00:00Z') },
        { id: 'a-3', localDateTime: new Date('2025-02-01T12:00:00Z') },
      ]),
    };

    const rule = new BirthdayMemoryRule(personRepository as never, assetRepository as never);
    await expect(
      rule.evaluate({
        ownerId: 'user-1',
        target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
      }),
    ).resolves.toEqual([]);
  });
});

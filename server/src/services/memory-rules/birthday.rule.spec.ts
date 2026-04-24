import { DateTime } from 'luxon';
import { BirthdayMemoryRule } from 'src/services/memory-rules/birthday.rule';

describe(BirthdayMemoryRule.name, () => {
  it('creates a snapshot fallback birthday candidate from four single-year assets', async () => {
    const personRepository = {
      getBirthdaysForDay: vi
        .fn()
        .mockResolvedValue([{ id: 'person-1', name: 'Pierre', birthDate: new Date('1990-04-24T00:00:00Z') }]),
    };
    const assetRepository = {
      getMemoryAssetsForPerson: vi.fn().mockResolvedValue([
        { id: 'a-1', localDateTime: new Date('2026-04-01T12:00:00Z') },
        { id: 'a-2', localDateTime: new Date('2026-04-02T12:00:00Z') },
        { id: 'a-3', localDateTime: new Date('2026-04-03T12:00:00Z') },
        { id: 'a-4', localDateTime: new Date('2026-04-04T12:00:00Z') },
      ]),
    };

    const rule = new BirthdayMemoryRule(personRepository as never, assetRepository as never);
    const [candidate] = await rule.evaluate({
      ownerId: 'user-1',
      target: DateTime.fromISO('2026-04-24', { zone: 'utc' }),
    });

    expect(candidate).toMatchObject({
      ruleId: 'birthday',
      dedupeKey: 'birthday:person-1:2026-04-24',
      title: 'Happy birthday, Pierre',
      subtitle: 'Recent photos of Pierre',
      score: 254,
      assetIds: ['a-4', 'a-3', 'a-2', 'a-1'],
      context: { personId: 'person-1', distinctYears: 1 },
    });
  });

  it('skips the snapshot fallback when only three single-year assets qualify', async () => {
    const personRepository = {
      getBirthdaysForDay: vi
        .fn()
        .mockResolvedValue([{ id: 'person-1', name: 'Pierre', birthDate: new Date('1990-04-24T00:00:00Z') }]),
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
        target: DateTime.fromISO('2026-04-24', { zone: 'utc' }),
      }),
    ).resolves.toEqual([]);
  });

  it('uses the four most recent qualifying assets for the snapshot fallback', async () => {
    const personRepository = {
      getBirthdaysForDay: vi
        .fn()
        .mockResolvedValue([{ id: 'person-1', name: 'Pierre', birthDate: new Date('1990-04-24T00:00:00Z') }]),
    };
    const assetRepository = {
      getMemoryAssetsForPerson: vi.fn().mockResolvedValue([
        { id: 'a-1', localDateTime: new Date('2026-04-01T12:00:00Z') },
        { id: 'a-2', localDateTime: new Date('2026-04-02T12:00:00Z') },
        { id: 'a-3', localDateTime: new Date('2026-04-03T12:00:00Z') },
        { id: 'a-4', localDateTime: new Date('2026-04-04T12:00:00Z') },
        { id: 'a-5', localDateTime: new Date('2026-04-05T12:00:00Z') },
      ]),
    };

    const rule = new BirthdayMemoryRule(personRepository as never, assetRepository as never);
    const [candidate] = await rule.evaluate({
      ownerId: 'user-1',
      target: DateTime.fromISO('2026-04-24', { zone: 'utc' }),
    });

    expect(candidate).toMatchObject({
      subtitle: 'Recent photos of Pierre',
      score: 254,
      assetIds: ['a-5', 'a-4', 'a-3', 'a-2'],
    });
  });

  it('prefers the throwback path over the snapshot fallback when multiple years qualify', async () => {
    const personRepository = {
      getBirthdaysForDay: vi
        .fn()
        .mockResolvedValue([{ id: 'person-2', name: 'Alice', birthDate: new Date('1990-04-24T00:00:00Z') }]),
    };
    const assetRepository = {
      getMemoryAssetsForPerson: vi.fn().mockResolvedValue([
        { id: 'a-1', localDateTime: new Date('2025-04-01T12:00:00Z') },
        { id: 'a-2', localDateTime: new Date('2025-03-01T12:00:00Z') },
        { id: 'a-3', localDateTime: new Date('2024-04-01T12:00:00Z') },
        { id: 'a-4', localDateTime: new Date('2023-04-01T12:00:00Z') },
        { id: 'a-5', localDateTime: new Date('2022-04-01T12:00:00Z') },
        { id: 'a-6', localDateTime: new Date('2021-04-01T12:00:00Z') },
      ]),
    };

    const rule = new BirthdayMemoryRule(personRepository as never, assetRepository as never);
    const candidates = await rule.evaluate({
      ownerId: 'user-1',
      target: DateTime.fromISO('2026-04-24', { zone: 'utc' }),
    });

    expect(candidates).toEqual([
      {
        ruleId: 'birthday',
        dedupeKey: 'birthday:person-2:2026-04-24',
        title: 'Happy birthday, Alice',
        subtitle: 'Photos from different years',
        score: 356,
        assetIds: ['a-1', 'a-2', 'a-3', 'a-4', 'a-5', 'a-6'],
        memoryAt: DateTime.fromISO('2026-04-24', { zone: 'utc' }),
        context: { personId: 'person-2', distinctYears: 5 },
      },
    ]);
  });
});

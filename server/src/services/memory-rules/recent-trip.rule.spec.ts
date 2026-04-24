import { DateTime } from 'luxon';
import { AssetOrder, MemoryType } from 'src/enum';
import { RecentTripMemoryRule } from 'src/services/memory-rules/recent-trip.rule';

describe(RecentTripMemoryRule.name, () => {
  it('creates a recent-trip candidate for a strong non-home cluster', async () => {
    const assetRepository = {
      getMemoryLocationClusters: vi
        .fn()
        .mockResolvedValueOnce([
          {
            country: 'Germany',
            city: 'Berlin',
            assetCount: 20,
            dayCount: 12,
            firstDate: new Date('2026-01-01T00:00:00Z'),
            lastDate: new Date('2026-03-20T00:00:00Z'),
          },
        ])
        .mockResolvedValueOnce([
          {
            country: 'France',
            city: 'Paris',
            assetCount: 9,
            dayCount: 3,
            firstDate: new Date('2026-04-15T00:00:00Z'),
            lastDate: new Date('2026-04-17T00:00:00Z'),
          },
        ]),
      getMemoryAssetsForLocation: vi
        .fn()
        .mockResolvedValue([
          { id: 'asset-1' },
          { id: 'asset-2' },
          { id: 'asset-3' },
          { id: 'asset-4' },
          { id: 'asset-5' },
          { id: 'asset-6' },
          { id: 'asset-7' },
        ]),
    };
    const memoryRepository = {
      search: vi.fn().mockResolvedValue([]),
    };

    const rule = new RecentTripMemoryRule(assetRepository as never, memoryRepository as never);
    const [candidate] = await rule.evaluate({
      ownerId: 'user-1',
      target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
    });

    expect(memoryRepository.search).toHaveBeenCalledWith('user-1', {
      type: MemoryType.Rule,
      size: 20,
      order: AssetOrder.Desc,
    });
    expect(candidate).toMatchObject({
      ruleId: 'recent_trip',
      dedupeKey: 'recent_trip:france:paris:2026-04-23',
      title: 'Recent trip to Paris, France',
      subtitle: '9 photos over 3 days',
      assetIds: ['asset-1', 'asset-2', 'asset-3', 'asset-4', 'asset-5', 'asset-6', 'asset-7'],
    });
  });

  it('skips clusters that are too small or still inside the same-place cooldown', async () => {
    const assetRepository = {
      getMemoryLocationClusters: vi
        .fn()
        .mockResolvedValueOnce([
          {
            country: 'Germany',
            city: 'Berlin',
            assetCount: 20,
            dayCount: 12,
            firstDate: new Date('2026-01-01T00:00:00Z'),
            lastDate: new Date('2026-03-20T00:00:00Z'),
          },
        ])
        .mockResolvedValueOnce([
          {
            country: 'France',
            city: 'Paris',
            assetCount: 5,
            dayCount: 1,
            firstDate: new Date('2026-04-15T00:00:00Z'),
            lastDate: new Date('2026-04-15T00:00:00Z'),
          },
        ]),
      getMemoryAssetsForLocation: vi.fn(),
    };
    const memoryRepository = {
      search: vi.fn().mockResolvedValue([
        {
          type: MemoryType.Rule,
          memoryAt: new Date('2026-04-10T00:00:00Z'),
          data: { ruleId: 'recent_trip', context: { placeKey: 'france:paris' } },
        },
      ]),
    };

    const rule = new RecentTripMemoryRule(assetRepository as never, memoryRepository as never);
    await expect(
      rule.evaluate({
        ownerId: 'user-1',
        target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
      }),
    ).resolves.toEqual([]);
  });

  it('creates a country-level trip when the country changed but city metadata is missing', async () => {
    const assetRepository = {
      getMemoryLocationClusters: vi
        .fn()
        .mockResolvedValueOnce([
          {
            country: 'Germany',
            city: 'Berlin',
            assetCount: 20,
            dayCount: 12,
            firstDate: new Date('2026-01-01T00:00:00Z'),
            lastDate: new Date('2026-03-20T00:00:00Z'),
          },
        ])
        .mockResolvedValueOnce([
          {
            country: 'France',
            city: null,
            assetCount: 8,
            dayCount: 2,
            firstDate: new Date('2026-04-15T00:00:00Z'),
            lastDate: new Date('2026-04-16T00:00:00Z'),
          },
        ]),
      getMemoryAssetsForLocation: vi
        .fn()
        .mockResolvedValue([
          { id: 'asset-1' },
          { id: 'asset-2' },
          { id: 'asset-3' },
          { id: 'asset-4' },
          { id: 'asset-5' },
          { id: 'asset-6' },
          { id: 'asset-7' },
        ]),
    };
    const memoryRepository = { search: vi.fn().mockResolvedValue([]) };

    const rule = new RecentTripMemoryRule(assetRepository as never, memoryRepository as never);
    const [candidate] = await rule.evaluate({
      ownerId: 'user-1',
      target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
    });

    expect(candidate).toMatchObject({
      ruleId: 'recent_trip',
      title: 'Recent trip to France',
      subtitle: '8 photos over 2 days',
    });
  });

  it('skips same-country clusters when city metadata is missing or not trustworthy', async () => {
    const assetRepository = {
      getMemoryLocationClusters: vi
        .fn()
        .mockResolvedValueOnce([
          {
            country: 'Germany',
            city: 'Berlin',
            assetCount: 20,
            dayCount: 12,
            firstDate: new Date('2026-01-01T00:00:00Z'),
            lastDate: new Date('2026-03-20T00:00:00Z'),
          },
        ])
        .mockResolvedValueOnce([
          {
            country: 'Germany',
            city: null,
            assetCount: 9,
            dayCount: 3,
            firstDate: new Date('2026-04-15T00:00:00Z'),
            lastDate: new Date('2026-04-17T00:00:00Z'),
          },
        ]),
      getMemoryAssetsForLocation: vi.fn(),
    };
    const memoryRepository = { search: vi.fn().mockResolvedValue([]) };

    const rule = new RecentTripMemoryRule(assetRepository as never, memoryRepository as never);
    await expect(
      rule.evaluate({
        ownerId: 'user-1',
        target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
      }),
    ).resolves.toEqual([]);
  });

  it('skips when the baseline home location is ambiguous', async () => {
    const assetRepository = {
      getMemoryLocationClusters: vi
        .fn()
        .mockResolvedValueOnce([
          {
            country: 'Germany',
            city: 'Berlin',
            assetCount: 10,
            dayCount: 6,
            firstDate: new Date('2026-01-01T00:00:00Z'),
            lastDate: new Date('2026-03-20T00:00:00Z'),
          },
          {
            country: 'Austria',
            city: 'Vienna',
            assetCount: 9,
            dayCount: 6,
            firstDate: new Date('2026-01-05T00:00:00Z'),
            lastDate: new Date('2026-03-18T00:00:00Z'),
          },
        ])
        .mockResolvedValueOnce([
          {
            country: 'France',
            city: 'Paris',
            assetCount: 8,
            dayCount: 2,
            firstDate: new Date('2026-04-15T00:00:00Z'),
            lastDate: new Date('2026-04-16T00:00:00Z'),
          },
        ]),
      getMemoryAssetsForLocation: vi.fn(),
    };
    const memoryRepository = { search: vi.fn().mockResolvedValue([]) };

    const rule = new RecentTripMemoryRule(assetRepository as never, memoryRepository as never);
    await expect(
      rule.evaluate({
        ownerId: 'user-1',
        target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
      }),
    ).resolves.toEqual([]);
  });
});

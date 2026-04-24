import { DateTime } from 'luxon';
import { AssetOrder, MemoryType } from 'src/enum';
import { RecentTripMemoryRule } from 'src/services/memory-rules/recent-trip.rule';

const makeAsset = (id: string, localDateTime: string) => ({
  id,
  localDateTime: new Date(localDateTime),
});

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
          makeAsset('asset-1', '2026-04-15T09:00:00Z'),
          makeAsset('asset-2', '2026-04-15T11:00:00Z'),
          makeAsset('asset-3', '2026-04-15T14:00:00Z'),
          makeAsset('asset-4', '2026-04-16T09:00:00Z'),
          makeAsset('asset-5', '2026-04-16T13:00:00Z'),
          makeAsset('asset-6', '2026-04-17T09:00:00Z'),
          makeAsset('asset-7', '2026-04-17T15:00:00Z'),
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
          makeAsset('asset-1', '2026-04-15T09:00:00Z'),
          makeAsset('asset-2', '2026-04-15T11:00:00Z'),
          makeAsset('asset-3', '2026-04-15T14:00:00Z'),
          makeAsset('asset-4', '2026-04-16T09:00:00Z'),
          makeAsset('asset-5', '2026-04-16T13:00:00Z'),
          makeAsset('asset-6', '2026-04-16T16:00:00Z'),
          makeAsset('asset-7', '2026-04-16T18:00:00Z'),
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

  it('curates a burst-heavy trip down to seven chronological assets', async () => {
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
            assetCount: 12,
            dayCount: 3,
            firstDate: new Date('2026-04-15T00:00:00Z'),
            lastDate: new Date('2026-04-17T00:00:00Z'),
          },
        ]),
      getMemoryAssetsForLocation: vi
        .fn()
        .mockResolvedValue([
          makeAsset('a-1', '2026-04-15T10:00:00Z'),
          makeAsset('a-2', '2026-04-15T10:01:00Z'),
          makeAsset('a-3', '2026-04-15T10:05:00Z'),
          makeAsset('a-4', '2026-04-15T10:06:00Z'),
          makeAsset('a-5', '2026-04-15T12:00:00Z'),
          makeAsset('a-6', '2026-04-16T09:00:00Z'),
          makeAsset('a-7', '2026-04-16T09:01:00Z'),
          makeAsset('a-8', '2026-04-16T15:00:00Z'),
          makeAsset('a-9', '2026-04-17T08:00:00Z'),
          makeAsset('a-10', '2026-04-17T08:01:00Z'),
          makeAsset('a-11', '2026-04-17T13:00:00Z'),
          makeAsset('a-12', '2026-04-17T17:00:00Z'),
        ]),
    };
    const memoryRepository = { search: vi.fn().mockResolvedValue([]) };

    const rule = new RecentTripMemoryRule(assetRepository as never, memoryRepository as never);
    const [candidate] = await rule.evaluate({
      ownerId: 'user-1',
      target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
    });

    expect(candidate).toMatchObject({
      title: 'Recent trip to Paris, France',
      subtitle: '12 photos over 3 days',
      assetIds: ['a-1', 'a-3', 'a-5', 'a-6', 'a-9', 'a-11', 'a-12'],
    });
  });

  it('collapses adjacent assets inside the two-minute burst window', async () => {
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
            assetCount: 8,
            dayCount: 2,
            firstDate: new Date('2026-04-15T00:00:00Z'),
            lastDate: new Date('2026-04-16T00:00:00Z'),
          },
        ]),
      getMemoryAssetsForLocation: vi
        .fn()
        .mockResolvedValue([
          makeAsset('a-1', '2026-04-15T10:00:00Z'),
          makeAsset('a-2', '2026-04-15T10:01:00Z'),
          makeAsset('a-3', '2026-04-15T10:03:00Z'),
          makeAsset('a-4', '2026-04-15T10:06:00Z'),
          makeAsset('a-5', '2026-04-16T09:00:00Z'),
          makeAsset('a-6', '2026-04-16T09:01:00Z'),
          makeAsset('a-7', '2026-04-16T13:00:00Z'),
        ]),
    };
    const memoryRepository = { search: vi.fn().mockResolvedValue([]) };

    const rule = new RecentTripMemoryRule(assetRepository as never, memoryRepository as never);
    const [candidate] = await rule.evaluate({
      ownerId: 'user-1',
      target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
    });

    expect(candidate?.assetIds).toEqual(['a-1', 'a-4', 'a-5', 'a-7']);
  });

  it('keeps a small well-spaced representative pool intact', async () => {
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
            dayCount: 2,
            firstDate: new Date('2026-04-15T00:00:00Z'),
            lastDate: new Date('2026-04-16T00:00:00Z'),
          },
        ]),
      getMemoryAssetsForLocation: vi
        .fn()
        .mockResolvedValue([
          makeAsset('a-1', '2026-04-15T08:00:00Z'),
          makeAsset('a-2', '2026-04-15T10:30:00Z'),
          makeAsset('a-3', '2026-04-15T14:00:00Z'),
          makeAsset('a-4', '2026-04-16T09:00:00Z'),
          makeAsset('a-5', '2026-04-16T12:00:00Z'),
          makeAsset('a-6', '2026-04-16T18:00:00Z'),
        ]),
    };
    const memoryRepository = { search: vi.fn().mockResolvedValue([]) };

    const rule = new RecentTripMemoryRule(assetRepository as never, memoryRepository as never);
    const [candidate] = await rule.evaluate({
      ownerId: 'user-1',
      target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
    });

    expect(candidate?.assetIds).toEqual(['a-1', 'a-2', 'a-3', 'a-4', 'a-5', 'a-6']);
  });

  it('caps a long trip at ten assets while preserving the trip endpoints', async () => {
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
            assetCount: 21,
            dayCount: 11,
            firstDate: new Date('2026-04-01T00:00:00Z'),
            lastDate: new Date('2026-04-11T00:00:00Z'),
          },
        ]),
      getMemoryAssetsForLocation: vi
        .fn()
        .mockResolvedValue([
          makeAsset('a-1', '2026-04-01T09:00:00Z'),
          makeAsset('a-2', '2026-04-02T09:00:00Z'),
          makeAsset('a-3', '2026-04-03T09:00:00Z'),
          makeAsset('a-4', '2026-04-04T09:00:00Z'),
          makeAsset('a-5', '2026-04-05T09:00:00Z'),
          makeAsset('a-6', '2026-04-06T09:00:00Z'),
          makeAsset('a-7', '2026-04-07T09:00:00Z'),
          makeAsset('a-8', '2026-04-08T09:00:00Z'),
          makeAsset('a-9', '2026-04-09T09:00:00Z'),
          makeAsset('a-10', '2026-04-10T09:00:00Z'),
          makeAsset('a-11', '2026-04-11T09:00:00Z'),
        ]),
    };
    const memoryRepository = { search: vi.fn().mockResolvedValue([]) };

    const rule = new RecentTripMemoryRule(assetRepository as never, memoryRepository as never);
    const [candidate] = await rule.evaluate({
      ownerId: 'user-1',
      target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
    });

    expect(candidate?.assetIds).toEqual(['a-1', 'a-2', 'a-3', 'a-4', 'a-5', 'a-7', 'a-8', 'a-9', 'a-10', 'a-11']);
  });
});

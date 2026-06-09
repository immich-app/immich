import { AssetType } from 'src/enum';
import { StatisticsService } from 'src/services/statistics.service';
import { newTestService, ServiceMocks } from 'test/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const redisMock = vi.hoisted(() => ({
  get: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
  connect: vi.fn(() => Promise.resolve()),
}));

vi.mock('ioredis', () => ({ default: vi.fn(() => redisMock) }));

describe(StatisticsService.name, () => {
  let sut: StatisticsService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    vi.clearAllMocks();
    redisMock.get.mockResolvedValue(null);
    redisMock.setex.mockResolvedValue('OK');
    redisMock.del.mockResolvedValue(1);

    ({ sut, mocks } = newTestService(StatisticsService));
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return cached statistics when available', async () => {
    const cached = {
      monthly: [],
      temporalMatrix: [],
      topPeople: [],
      topCameras: [],
      topLenses: [],
      topCities: [],
      topCountries: [],
      storage: [],
      total: { photos: 0, videos: 0, storage: 0 },
    };
    redisMock.get.mockResolvedValue(JSON.stringify(cached));

    await expect(sut.getStatistics({ user: { id: 'user-1' } } as never)).resolves.toEqual(cached);

    expect(mocks.statistics.getMonthlyCounts).not.toHaveBeenCalled();
    expect(redisMock.get).toHaveBeenCalledWith('statistics:user-1');
    expect(redisMock.setex).not.toHaveBeenCalled();
  });

  it('should query the repository and cache the result on a miss', async () => {
    mocks.statistics.getMonthlyCounts.mockResolvedValue([{ year: 2026, month: 1, count: 2 }]);
    mocks.statistics.getTemporalMatrix.mockResolvedValue([]);
    mocks.statistics.getTopPeople.mockResolvedValue([]);
    mocks.statistics.getTopCameras.mockResolvedValue([]);
    mocks.statistics.getTopLenses.mockResolvedValue([]);
    mocks.statistics.getTopCities.mockResolvedValue([]);
    mocks.statistics.getTopCountries.mockResolvedValue([]);
    mocks.statistics.getStorageByType.mockResolvedValue([{ type: AssetType.Image, size: 100, count: 2 }]);

    const result = await sut.getStatistics({ user: { id: 'user-1' } } as never);

    expect(result.total).toEqual({ photos: 2, videos: 0, storage: 100 });
    expect(result.monthly).toEqual([{ year: 2026, month: 1, count: 2 }]);
    expect(mocks.statistics.getMonthlyCounts).toHaveBeenCalledWith('user-1');
    expect(redisMock.setex).toHaveBeenCalledWith('statistics:user-1', expect.any(Number), expect.any(String));
  });

  it('should invalidate the cache when assets change', async () => {
    await sut.onAssetDelete({ assetId: 'asset-1', userId: 'user-1' } as never);

    expect(redisMock.del).toHaveBeenCalledWith('statistics:user-1');
  });
});

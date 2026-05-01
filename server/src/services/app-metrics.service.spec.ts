import { ObservableCallback, ObservableResult } from '@opentelemetry/api';
import { AssetType, ImmichWorker, QueueName } from 'src/enum';
import { AppMetricsRepository } from 'src/repositories/app-metrics.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { TelemetryRepository } from 'src/repositories/telemetry.repository';
import { AppMetricsService } from 'src/services/app-metrics.service';
import { newTelemetryRepositoryMock } from 'test/repositories/telemetry.repository.mock';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

const observe = async (callback: ObservableCallback) => {
  const result = { observe: vi.fn() } as unknown as ObservableResult;
  await callback(result);
  return result.observe as ReturnType<typeof vi.fn>;
};

type AppMetricsServiceMocks = {
  logger: Mocked<Pick<LoggingRepository, 'setContext' | 'warn'>>;
  config: Mocked<Pick<ConfigRepository, 'getWorker'>>;
  telemetry: ReturnType<typeof newTelemetryRepositoryMock>;
  appMetrics: Mocked<Pick<AppMetricsRepository, 'getMetrics'>>;
  job: Mocked<Pick<JobRepository, 'getTelemetryMetrics'>>;
};

describe(AppMetricsService.name, () => {
  let sut: AppMetricsService;
  let mocks: AppMetricsServiceMocks;
  let appCallbacks: Map<string, ObservableCallback>;
  let jobCallbacks: Map<string, ObservableCallback>;

  beforeEach(() => {
    vi.useRealTimers();
    mocks = {
      logger: { setContext: vi.fn(), warn: vi.fn() },
      config: { getWorker: vi.fn() },
      telemetry: newTelemetryRepositoryMock(),
      appMetrics: { getMetrics: vi.fn() },
      job: { getTelemetryMetrics: vi.fn() },
    };
    sut = new AppMetricsService(
      mocks.logger as unknown as LoggingRepository,
      mocks.config as unknown as ConfigRepository,
      mocks.telemetry as unknown as TelemetryRepository,
      mocks.appMetrics as unknown as AppMetricsRepository,
      mocks.job as unknown as JobRepository,
    );
    appCallbacks = new Map();
    jobCallbacks = new Map();
    mocks.telemetry.app.observeGauge.mockImplementation((name, callback) => {
      appCallbacks.set(name, callback);
    });
    mocks.telemetry.jobs.observeGauge.mockImplementation((name, callback) => {
      jobCallbacks.set(name, callback);
    });
  });

  it('registers app gauges on the API worker', () => {
    mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);

    sut.onBootstrap();

    expect(appCallbacks.has('immich.assets.total')).toBe(true);
    expect(appCallbacks.has('immich.users.storage_bytes')).toBe(true);
    expect(jobCallbacks.size).toBe(0);
  });

  it('registers queue gauges on the microservices worker', () => {
    mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);

    sut.onBootstrap();

    expect(jobCallbacks.has('immich.queues.jobs')).toBe(true);
    expect(jobCallbacks.has('immich.queues.oldest_job_age_seconds')).toBe(true);
    expect(appCallbacks.size).toBe(0);
  });

  it('observes app metrics with user_id labels only', async () => {
    mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);
    mocks.appMetrics.getMetrics.mockResolvedValue({
      asset: {
        assetsByType: [{ type: AssetType.Image, count: 2, storageBytes: 400 }],
        usersByType: [{ userId: 'user-1', type: AssetType.Image, count: 2, storageBytes: 400 }],
        search: { eligibleAssets: 4, embeddedAssets: 3 },
        state: { trashAssets: 1, externalAssets: 1 },
      },
      person: { faces: 8, people: 2 },
    });

    sut.onBootstrap();
    const observed = await observe(appCallbacks.get('immich.users.storage_bytes')!);

    expect(observed).toHaveBeenCalledWith(400, { user_id: 'user-1', type: 'image' });
    expect(JSON.stringify(observed.mock.calls)).not.toContain('userName');
    expect(JSON.stringify(observed.mock.calls)).not.toContain('email');
  });

  it('serves the cached app snapshot inside the ttl', async () => {
    mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);
    mocks.appMetrics.getMetrics
      .mockResolvedValueOnce({
        asset: {
          assetsByType: [{ type: AssetType.Image, count: 2, storageBytes: 400 }],
          usersByType: [],
          search: { eligibleAssets: 4, embeddedAssets: 3 },
          state: { trashAssets: 1, externalAssets: 1 },
        },
        person: { faces: 8, people: 2 },
      })
      .mockResolvedValueOnce({
        asset: {
          assetsByType: [{ type: AssetType.Image, count: 9, storageBytes: 900 }],
          usersByType: [],
          search: { eligibleAssets: 9, embeddedAssets: 9 },
          state: { trashAssets: 0, externalAssets: 0 },
        },
        person: { faces: 9, people: 3 },
      });
    vi.useFakeTimers();

    sut.onBootstrap();
    await observe(appCallbacks.get('immich.assets.total')!);
    const observed = await observe(appCallbacks.get('immich.assets.total')!);

    expect(mocks.appMetrics.getMetrics).toHaveBeenCalledTimes(1);
    expect(observed).toHaveBeenCalledWith(2, { type: 'image' });
    vi.useRealTimers();
  });

  it('keeps the previous app snapshot when refresh fails', async () => {
    mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);
    mocks.appMetrics.getMetrics
      .mockResolvedValueOnce({
        asset: {
          assetsByType: [{ type: AssetType.Image, count: 2, storageBytes: 400 }],
          usersByType: [],
          search: { eligibleAssets: 4, embeddedAssets: 3 },
          state: { trashAssets: 1, externalAssets: 1 },
        },
        person: { faces: 8, people: 2 },
      })
      .mockRejectedValueOnce(new Error('database down'));
    vi.useFakeTimers();

    sut.onBootstrap();
    await observe(appCallbacks.get('immich.assets.total')!);
    vi.advanceTimersByTime(61_000);
    const observed = await observe(appCallbacks.get('immich.assets.total')!);

    expect(observed).toHaveBeenCalledWith(2, { type: 'image' });
    vi.useRealTimers();
  });

  it('omits app metric series when the first refresh fails', async () => {
    mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);
    mocks.appMetrics.getMetrics.mockRejectedValue(new Error('database down'));

    sut.onBootstrap();
    const observed = await observe(appCallbacks.get('immich.assets.total')!);

    expect(observed).not.toHaveBeenCalled();
    expect(mocks.logger.warn).toHaveBeenCalledWith(expect.stringContaining('Unable to refresh app metrics snapshot'));
  });

  it('throttles first-refresh failures inside the ttl', async () => {
    mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);
    mocks.appMetrics.getMetrics.mockRejectedValue(new Error('database down'));
    vi.useFakeTimers();

    sut.onBootstrap();
    await observe(appCallbacks.get('immich.assets.total')!);
    const observed = await observe(appCallbacks.get('immich.assets.total')!);

    expect(observed).not.toHaveBeenCalled();
    expect(mocks.appMetrics.getMetrics).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('observes queue counts and oldest job age', async () => {
    mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);
    mocks.job.getTelemetryMetrics.mockResolvedValue({
      counts: [{ queue: QueueName.ThumbnailGeneration, status: 'waiting', count: 5 }],
      oldestJobAges: [{ queue: QueueName.ThumbnailGeneration, status: 'waiting', ageSeconds: 120 }],
    });

    sut.onBootstrap();
    const counts = await observe(jobCallbacks.get('immich.queues.jobs')!);
    const ages = await observe(jobCallbacks.get('immich.queues.oldest_job_age_seconds')!);

    expect(counts).toHaveBeenCalledWith(5, { queue: QueueName.ThumbnailGeneration, status: 'waiting' });
    expect(ages).toHaveBeenCalledWith(120, { queue: QueueName.ThumbnailGeneration, status: 'waiting' });
  });
});

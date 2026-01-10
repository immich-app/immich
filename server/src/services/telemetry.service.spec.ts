import { ImmichTelemetry, QueueName } from 'src/enum';
import { TelemetryService } from 'src/services/telemetry.service';
import { newTestService, ServiceMocks } from 'test/utils';

describe(TelemetryService.name, () => {
  let sut: TelemetryService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(TelemetryService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onBootstrap', () => {
    it('should register queued metrics if enabled', async () => {
      mocks.config.getEnv.mockReturnValue({
        telemetry: {
          metrics: new Set([ImmichTelemetry.Job]),
        },
      } as any);

      mocks.job.getJobCounts.mockResolvedValue({
        waiting: 1,
        paused: 2,
        delayed: 3,
        active: 0,
        completed: 0,
        failed: 0,
      });

      await sut.onBootstrap();

      expect(mocks.telemetry.jobs.setObservableGauge).toHaveBeenCalledTimes(Object.keys(QueueName).length * 4);
      expect(mocks.job.getJobCounts).toHaveBeenCalledTimes(Object.keys(QueueName).length);
    });

    it('should not register queued metrics if disabled', async () => {
      mocks.config.getEnv.mockReturnValue({
        telemetry: {
          metrics: new Set(),
        },
      } as any);

      await sut.onBootstrap();

      expect(mocks.telemetry.jobs.setObservableGauge).not.toHaveBeenCalled();
      expect(mocks.job.getJobCounts).not.toHaveBeenCalled();
    });
  });
});

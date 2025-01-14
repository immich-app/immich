import { ITelemetryRepository } from 'src/interfaces/telemetry.interface';
import { Mocked, vitest } from 'vitest';

const newMetricGroupMock = () => {
  return {
    addToCounter: vitest.fn(),
    addToGauge: vitest.fn(),
    addToHistogram: vitest.fn(),
    configure: vitest.fn(),
  };
};

export const newTelemetryRepositoryMock = (): Mocked<ITelemetryRepository> => {
  return {
    setup: vitest.fn(),
    api: newMetricGroupMock(),
    host: newMetricGroupMock(),
    jobs: newMetricGroupMock(),
    repo: newMetricGroupMock(),
  };
};

import { ITelemetryRepository, RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

const newMetricGroupMock = () => {
  return {
    addToCounter: vitest.fn(),
    addToGauge: vitest.fn(),
    addToHistogram: vitest.fn(),
    configure: vitest.fn(),
  };
};

export type ITelemetryRepositoryMock = {
  [K in keyof ITelemetryRepository]: Mocked<RepositoryInterface<ITelemetryRepository[K]>>;
};

export const newTelemetryRepositoryMock = (): ITelemetryRepositoryMock => {
  return {
    setup: vitest.fn(),
    api: newMetricGroupMock(),
    host: newMetricGroupMock(),
    jobs: newMetricGroupMock(),
    repo: newMetricGroupMock(),
  };
};

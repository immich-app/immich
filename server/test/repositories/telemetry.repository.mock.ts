import { TelemetryRepository } from 'src/repositories/telemetry.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

const newMetricGroupMock = () => {
  return {
    addToCounter: vitest.fn(),
    addToGauge: vitest.fn(),
    addToHistogram: vitest.fn(),
    configure: vitest.fn(),
  };
};

type ITelemetryRepository = RepositoryInterface<TelemetryRepository>;

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

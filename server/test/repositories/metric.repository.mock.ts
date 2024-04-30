import { IMetricRepository } from 'src/interfaces/metric.interface';
import { Mocked, vitest } from 'vitest';

export const newMetricRepositoryMock = (): Mocked<IMetricRepository> => {
  return {
    api: {
      addToCounter: vitest.fn(),
      addToGauge: vitest.fn(),
      addToHistogram: vitest.fn(),
      configure: vitest.fn(),
    },
    host: {
      addToCounter: vitest.fn(),
      addToGauge: vitest.fn(),
      addToHistogram: vitest.fn(),
      configure: vitest.fn(),
    },
    jobs: {
      addToCounter: vitest.fn(),
      addToGauge: vitest.fn(),
      addToHistogram: vitest.fn(),
      configure: vitest.fn(),
    },
    repo: {
      addToCounter: vitest.fn(),
      addToGauge: vitest.fn(),
      addToHistogram: vitest.fn(),
      configure: vitest.fn(),
    },
  };
};

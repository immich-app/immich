import { IMetricRepository } from 'src/interfaces/metric.interface';

export const newMetricRepositoryMock = (): jest.Mocked<IMetricRepository> => {
  return {
    api: {
      addToCounter: jest.fn(),
      addToGauge: jest.fn(),
      addToHistogram: jest.fn(),
      configure: jest.fn(),
    },
    host: {
      addToCounter: jest.fn(),
      addToGauge: jest.fn(),
      addToHistogram: jest.fn(),
      configure: jest.fn(),
    },
    jobs: {
      addToCounter: jest.fn(),
      addToGauge: jest.fn(),
      addToHistogram: jest.fn(),
      configure: jest.fn(),
    },
    repo: {
      addToCounter: jest.fn(),
      addToGauge: jest.fn(),
      addToHistogram: jest.fn(),
      configure: jest.fn(),
    },
  };
};

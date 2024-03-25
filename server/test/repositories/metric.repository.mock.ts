import { IMetricRepository } from 'src/interfaces/metric.interface';

export const newMetricRepositoryMock = (): jest.Mocked<IMetricRepository> => {
  return {
    addToCounter: jest.fn(),
    updateGauge: jest.fn(),
    updateHistogram: jest.fn(),
  };
};

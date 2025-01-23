import { IMapRepository } from 'src/types';
import { Mocked } from 'vitest';

export const newMapRepositoryMock = (): Mocked<IMapRepository> => {
  return {
    init: vitest.fn(),
    reverseGeocode: vitest.fn(),
    getMapMarkers: vitest.fn(),
  };
};

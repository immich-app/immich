import { IMapRepository } from 'src/interfaces/map.interface';
import { Mocked } from 'vitest';

export const newMapRepositoryMock = (): Mocked<IMapRepository> => {
  return {
    init: vitest.fn(),
    reverseGeocode: vitest.fn(),
    getMapMarkers: vitest.fn(),
    fetchStyle: vitest.fn(),
  };
};

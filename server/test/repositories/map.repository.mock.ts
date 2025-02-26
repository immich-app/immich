import { MapRepository } from 'src/repositories/map.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked } from 'vitest';

export const newMapRepositoryMock = (): Mocked<RepositoryInterface<MapRepository>> => {
  return {
    init: vitest.fn(),
    reverseGeocode: vitest.fn(),
    getMapMarkers: vitest.fn(),
  };
};

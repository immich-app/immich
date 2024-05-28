import { IMapRepository } from 'src/interfaces/map.interface';
import { Mocked } from 'vitest';

export const newMapRepositoryMock = (): Mocked<IMapRepository> => {
  return {
    fetchStyle: vitest.fn(),
  };
};

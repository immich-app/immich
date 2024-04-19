import { ISessionRepository } from 'src/interfaces/session.interface';
import { Mocked, vitest } from 'vitest';

export const newSessionRepositoryMock = (): Mocked<ISessionRepository> => {
  return {
    create: vitest.fn(),
    update: vitest.fn(),
    delete: vitest.fn(),
    getByToken: vitest.fn(),
    getByUserId: vitest.fn(),
  };
};

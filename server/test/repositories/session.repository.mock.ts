import { ISessionRepository } from 'src/interfaces/session.interface';
import { Mocked, vitest } from 'vitest';

export const newSessionRepositoryMock = (): Mocked<ISessionRepository> => {
  return {
    search: vitest.fn(),
    create: vitest.fn() as any,
    update: vitest.fn() as any,
    delete: vitest.fn(),
    getByToken: vitest.fn(),
    getByUserId: vitest.fn(),
  };
};

import { SessionRepository } from 'src/repositories/session.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newSessionRepositoryMock = (): Mocked<RepositoryInterface<SessionRepository>> => {
  return {
    search: vitest.fn(),
    create: vitest.fn() as any,
    update: vitest.fn() as any,
    delete: vitest.fn(),
    getByToken: vitest.fn(),
    getByUserId: vitest.fn(),
  };
};

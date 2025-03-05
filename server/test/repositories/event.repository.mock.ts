import { EventRepository } from 'src/repositories/event.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newEventRepositoryMock = (): Mocked<RepositoryInterface<EventRepository>> => {
  return {
    setup: vitest.fn(),
    emit: vitest.fn() as any,
    clientSend: vitest.fn() as any,
    clientBroadcast: vitest.fn() as any,
    serverSend: vitest.fn(),
    afterInit: vitest.fn(),
    handleConnection: vitest.fn(),
    handleDisconnect: vitest.fn(),
    setAuthFn: vitest.fn(),
  };
};

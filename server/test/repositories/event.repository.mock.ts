import { IEventRepository } from 'src/interfaces/event.interface';
import { Mocked, vitest } from 'vitest';

export const newEventRepositoryMock = (): Mocked<IEventRepository> => {
  return {
    setup: vitest.fn(),
    on: vitest.fn() as any,
    emit: vitest.fn() as any,
    clientSend: vitest.fn() as any,
    clientBroadcast: vitest.fn() as any,
    serverSend: vitest.fn(),
  };
};

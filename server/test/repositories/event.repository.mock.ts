import { IEventRepository } from 'src/interfaces/event.interface';
import { Mocked, vitest } from 'vitest';

export const newEventRepositoryMock = (): Mocked<IEventRepository> => {
  return {
    on: vitest.fn() as any,
    emit: vitest.fn() as any,
    clientSend: vitest.fn(),
    clientBroadcast: vitest.fn(),
    serverSend: vitest.fn(),
  };
};

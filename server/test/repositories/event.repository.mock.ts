import { IEventRepository } from 'src/interfaces/event.interface';
import { Mocked, vitest } from 'vitest';

export const newEventRepositoryMock = (): Mocked<IEventRepository> => {
  return {
    clientSend: vitest.fn(),
    clientBroadcast: vitest.fn(),
    serverSend: vitest.fn(),
    serverSendAsync: vitest.fn(),
  };
};

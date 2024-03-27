import { IEventRepository } from 'src/interfaces/event.interface';

export const newEventRepositoryMock = (): jest.Mocked<IEventRepository> => {
  return {
    clientSend: jest.fn(),
    clientBroadcast: jest.fn(),
    serverSend: jest.fn(),
    serverSendAsync: jest.fn(),
  };
};

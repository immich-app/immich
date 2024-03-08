import { ICommunicationRepository } from '@app/domain';

export const newCommunicationRepositoryMock = (): jest.Mocked<ICommunicationRepository> => {
  return {
    send: jest.fn(),
    broadcast: jest.fn(),
    on: jest.fn(),
    sendServerEvent: jest.fn(),
  };
};

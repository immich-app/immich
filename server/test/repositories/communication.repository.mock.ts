import { ICommunicationRepository } from 'src/interfaces/communication.repository';

export const newCommunicationRepositoryMock = (): jest.Mocked<ICommunicationRepository> => {
  return {
    send: jest.fn(),
    broadcast: jest.fn(),
    on: jest.fn(),
    sendServerEvent: jest.fn(),
    emit: jest.fn(),
    emitAsync: jest.fn(),
  };
};

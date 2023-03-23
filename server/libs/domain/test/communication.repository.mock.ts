import { ICommunicationRepository } from '../src';

export const newCommunicationRepositoryMock = (): jest.Mocked<ICommunicationRepository> => {
  return {
    send: jest.fn(),
  };
};

import { ICommunicationRepository } from '@app/domain';

export const newCommunicationRepositoryMock = (): jest.Mocked<ICommunicationRepository> => {
  return {
    send: jest.fn(),
  };
};

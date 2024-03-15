import { ICommunicationRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newCommunicationRepositoryMock = (): Mocked<ICommunicationRepository> => {
  return {
    send: vi.fn(),
    broadcast: vi.fn(),
    on: vi.fn() as any,
    sendServerEvent: vi.fn(),
  };
};

import { ICryptoRepository } from '../src';

export const newCryptoRepositoryMock = (): jest.Mocked<ICryptoRepository> => {
  return {
    randomBytes: jest.fn().mockReturnValue(Buffer.from('random-bytes', 'utf8')),
    compareSync: jest.fn().mockReturnValue(true),
    hash: jest.fn().mockImplementation((input) => Promise.resolve(`${input} (hashed)`)),
  };
};

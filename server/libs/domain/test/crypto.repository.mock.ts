import { ICryptoRepository } from '../src';

export const newCryptoRepositoryMock = (): jest.Mocked<ICryptoRepository> => {
  return {
    randomBytes: jest.fn().mockReturnValue(Buffer.from('random-bytes', 'utf8')),
    compareBcrypt: jest.fn().mockReturnValue(true),
    hashBcrypt: jest.fn().mockImplementation((input) => Promise.resolve(`${input} (hashed)`)),
    hashSha256: jest.fn().mockImplementation((input) => `${input} (hashed)`),
    randomUUID: jest.fn().mockReturnValue('ad43b70e-e3ad-11ed-b5ea-0242ac120002'),
  };
};

import { ICryptoRepository } from '@app/domain';

export const newCryptoRepositoryMock = (): jest.Mocked<ICryptoRepository> => {
  return {
    randomUUID: jest.fn().mockReturnValue('random-uuid'),
    randomBytes: jest.fn().mockReturnValue(Buffer.from('random-bytes', 'utf8')),
    compareBcrypt: jest.fn().mockReturnValue(true),
    hashBcrypt: jest.fn().mockImplementation((input) => Promise.resolve(`${input} (hashed)`)),
    hashSha256: jest.fn().mockImplementation((input) => `${input} (hashed)`),
    hashFile: jest.fn().mockImplementation((input) => `${input} (file-hashed)`),
  };
};

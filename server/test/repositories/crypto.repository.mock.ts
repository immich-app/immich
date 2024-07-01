import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { Mocked, vitest } from 'vitest';

export const newCryptoRepositoryMock = (): Mocked<ICryptoRepository> => {
  return {
    randomUUID: vitest.fn().mockReturnValue('random-uuid'),
    randomBytes: vitest.fn().mockReturnValue(Buffer.from('random-bytes', 'utf8')),
    compareBcrypt: vitest.fn().mockReturnValue(true),
    hashBcrypt: vitest.fn().mockImplementation((input) => Promise.resolve(`${input} (hashed)`)),
    hashSha256: vitest.fn().mockImplementation((input) => `${input} (hashed)`),
    verifySha256: vitest.fn().mockImplementation(() => true),
    hashSha1: vitest.fn().mockImplementation((input) => Buffer.from(`${input.toString()} (hashed)`)),
    hashFile: vitest.fn().mockImplementation((input) => `${input} (file-hashed)`),
    newPassword: vitest.fn().mockReturnValue(Buffer.from('random-bytes').toString('base64')),
  };
};

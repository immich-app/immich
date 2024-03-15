import { ICryptoRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newCryptoRepositoryMock = (): Mocked<ICryptoRepository> => {
  return {
    randomUUID: vi.fn().mockReturnValue('random-uuid'),
    randomBytes: vi.fn().mockReturnValue(Buffer.from('random-bytes', 'utf8')),
    compareBcrypt: vi.fn().mockReturnValue(true),
    hashBcrypt: vi.fn().mockImplementation((input) => Promise.resolve(`${input} (hashed)`)),
    hashSha256: vi.fn().mockImplementation((input) => `${input} (hashed)`),
    hashSha1: vi.fn().mockImplementation((input) => Buffer.from(`${input.toString()} (hashed)`)),
    hashFile: vi.fn().mockImplementation((input) => `${input} (file-hashed)`),
  };
};

import { CryptoRepository } from 'src/repositories/crypto.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newCryptoRepositoryMock = (): Mocked<RepositoryInterface<CryptoRepository>> => {
  return {
    randomUUID: vitest.fn().mockReturnValue('random-uuid'),
    randomBytes: vitest.fn().mockReturnValue(Buffer.from('random-bytes', 'utf8')),
    compareBcrypt: vitest.fn().mockReturnValue(true),
    hashBcrypt: vitest.fn().mockImplementation((input) => Promise.resolve(`${input} (hashed)`)),
    hashSha256: vitest.fn().mockImplementation((input) => Buffer.from(`${input} (hashed)`)),
    verifySha256: vitest.fn().mockImplementation(() => true),
    hashSha1: vitest.fn().mockImplementation((input) => Buffer.from(`${input.toString()} (hashed)`)),
    hashFile: vitest.fn().mockImplementation((input) => `${input} (file-hashed)`),
    randomBytesAsText: vitest.fn().mockReturnValue(Buffer.from('random-bytes').toString('base64')),
    signJwt: vitest.fn().mockReturnValue('mock-jwt-token'),
    verifyJwt: vitest.fn().mockImplementation((token) => ({ verified: true, token })),
    generateDek: vitest.fn().mockReturnValue(Buffer.from('dek', 'utf8')),
    generateKekSalt: vitest.fn().mockReturnValue(Buffer.from('kek-salt', 'utf8')),
    deriveKek: vitest.fn().mockReturnValue(Buffer.from('kek', 'utf8')),
    wrapDek: vitest.fn().mockReturnValue({
      wrappedDek: Buffer.from('wrapped-dek', 'utf8'),
      nonce: Buffer.from('nonce', 'utf8'),
    }),
    unwrapDek: vitest.fn().mockReturnValue(Buffer.from('dek', 'utf8')),
    deriveSessionKek: vitest.fn().mockReturnValue(Buffer.from('session-kek', 'utf8')),
    createEncryptStream: vitest.fn(),
    createDecryptStream: vitest.fn(),
  };
};

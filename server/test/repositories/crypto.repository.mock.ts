import { PassThrough } from 'node:stream';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newCryptoRepositoryMock = (): Mocked<RepositoryInterface<CryptoRepository>> => {
  return {
    randomUUID: vitest.fn().mockReturnValue('random-uuid'),
    randomBytes: vitest.fn().mockReturnValue(Buffer.from('random-bytes', 'utf8')),
    compareBcrypt: vitest.fn().mockReturnValue(true),
    hashBcrypt: vitest.fn().mockImplementation((input) => Promise.resolve(`${input} (hashed)`)),
    hashSha256: vitest.fn().mockImplementation((input) => `${input} (hashed)`),
    verifySha256: vitest.fn().mockImplementation(() => true),
    hashSha1: vitest.fn().mockImplementation((input) => Buffer.from(`${input.toString()} (hashed)`)),
    hashFile: vitest.fn().mockImplementation((input) => `${input} (file-hashed)`),
    randomBytesAsText: vitest.fn().mockReturnValue(Buffer.from('random-bytes').toString('base64')),
    signJwt: vitest.fn().mockReturnValue('mock-jwt-token'),
    verifyJwt: vitest.fn().mockImplementation((token) => ({ verified: true, token })),
    // Encryption methods
    generateEncryptionKey: vitest.fn().mockReturnValue(Buffer.alloc(32, 'key')),
    encryptAesGcm: vitest.fn().mockReturnValue({
      ciphertext: Buffer.from('encrypted'),
      iv: Buffer.alloc(16, 'iv'),
      authTag: Buffer.alloc(16, 'tag'),
    }),
    decryptAesGcm: vitest.fn().mockReturnValue(Buffer.from('decrypted')),
    wrapKey: vitest.fn().mockReturnValue('wrapped-key-base64'),
    unwrapKey: vitest.fn().mockReturnValue(Buffer.alloc(32, 'unwrapped')),
    encryptRsa: vitest.fn().mockReturnValue(Buffer.from('rsa-encrypted')),
    decryptRsa: vitest.fn().mockReturnValue(Buffer.from('rsa-decrypted')),
    createEncryptStream: vitest.fn().mockReturnValue(new PassThrough()),
    createDecryptStream: vitest.fn().mockReturnValue(new PassThrough()),
  };
};

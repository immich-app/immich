import { Injectable } from '@nestjs/common';
import { compareSync, hash } from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  CipherGCM,
  createCipheriv,
  createDecipheriv,
  createHash,
  createPublicKey,
  createVerify,
  DecipherGCM,
  randomBytes,
  randomUUID,
  scryptSync,
} from 'node:crypto';
import { createReadStream } from 'node:fs';

const DEK_LENGTH = 32;
const KEK_LENGTH = 32;
const KEK_SALT_LENGTH = 16;
const GCM_NONCE_LENGTH = 12;
const GCM_AUTH_TAG_LENGTH = 16;

@Injectable()
export class CryptoRepository {
  randomUUID(): string {
    return randomUUID();
  }

  randomBytes(size: number) {
    return randomBytes(size);
  }

  hashBcrypt(data: string | Buffer, saltOrRounds: string | number) {
    return hash(data, saltOrRounds);
  }

  compareBcrypt(data: string | Buffer, encrypted: string) {
    return compareSync(data, encrypted);
  }

  hashSha256(value: string) {
    return createHash('sha256').update(value).digest();
  }

  verifySha256(value: string, encryptedValue: string, publicKey: string) {
    const publicKeyBuffer = Buffer.from(publicKey, 'base64');
    const cryptoPublicKey = createPublicKey({
      key: publicKeyBuffer,
      type: 'spki',
      format: 'pem',
    });

    const verifier = createVerify('SHA256');
    verifier.update(value);
    verifier.end();
    const encryptedValueBuffer = Buffer.from(encryptedValue, 'base64');
    return verifier.verify(cryptoPublicKey, encryptedValueBuffer);
  }

  hashSha1(value: string | Buffer): Buffer {
    return createHash('sha1').update(value).digest();
  }

  hashFile(filepath: string | Buffer): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const hash = createHash('sha1');
      const stream = createReadStream(filepath);
      stream.on('error', (error) => reject(error));
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest()));
    });
  }

  randomBytesAsText(bytes: number) {
    return randomBytes(bytes).toString('base64').replaceAll(/\W/g, '');
  }

  signJwt(payload: string | object | Buffer, secret: string, options?: jwt.SignOptions): string {
    return jwt.sign(payload, secret, { algorithm: 'HS256', ...options });
  }

  verifyJwt<T = any>(token: string, secret: string): T {
    return jwt.verify(token, secret, { algorithms: ['HS256'] }) as T;
  }

  /** Generates a new random data encryption key (DEK). */
  generateDek(): Buffer {
    return randomBytes(DEK_LENGTH);
  }

  /** Generates a new random salt to use when deriving a key encryption key (KEK) from a password. */
  generateKekSalt(): Buffer {
    return randomBytes(KEK_SALT_LENGTH);
  }

  /** Derives a key encryption key (KEK) from a password and salt. The same password and salt always produce the same KEK. */
  deriveKek(password: string, salt: Buffer): Buffer {
    return scryptSync(password, salt, KEK_LENGTH);
  }

  /** Wraps (encrypts) a DEK with a KEK using AES-256-GCM. */
  wrapDek(dek: Buffer, kek: Buffer): { wrappedDek: Buffer; nonce: Buffer } {
    const nonce = randomBytes(GCM_NONCE_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', kek, nonce);
    const ciphertext = Buffer.concat([cipher.update(dek), cipher.final()]);
    const wrappedDek = Buffer.concat([ciphertext, cipher.getAuthTag()]);
    return { wrappedDek, nonce };
  }

  /** Unwraps (decrypts) a DEK that was wrapped with `wrapDek`. Throws if the KEK or nonce is incorrect. */
  unwrapDek(wrappedDek: Buffer, nonce: Buffer, kek: Buffer): Buffer {
    const authTag = wrappedDek.subarray(wrappedDek.length - GCM_AUTH_TAG_LENGTH);
    const ciphertext = wrappedDek.subarray(0, wrappedDek.length - GCM_AUTH_TAG_LENGTH);
    const decipher = createDecipheriv('aes-256-gcm', kek, nonce);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  /**
   * Derives a key encryption key (KEK) for a login session from its own raw access token, so that an active
   * session can wrap/unwrap a DEK for its lifetime without needing the account password again. Uses a
   * domain-separation label so this is never the same value as `hashSha256(token)`, which is already used
   * elsewhere as the session's lookup hash (reusing that verbatim as key material would be key reuse across two
   * different purposes). No slow KDF needed here, unlike `deriveKek` — the token already has 256 bits of CSPRNG
   * entropy, unlike a human password.
   */
  deriveSessionKek(token: string): Buffer {
    return this.hashSha256(`immich-session-dek:${token}`);
  }

  /**
   * Creates a fresh AES-256-GCM cipher stream for encrypting a file's bytes with a DEK, along with the random
   * nonce/IV it used. The caller must read `cipher.getAuthTag()` only after the stream has finished (`'finish'`
   * or the destination write stream's `'close'`), and persist both the nonce and the auth tag alongside the
   * ciphertext to be able to decrypt it later.
   */
  createEncryptStream(dek: Buffer): { nonce: Buffer; cipher: CipherGCM } {
    const nonce = randomBytes(GCM_NONCE_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', dek, nonce);
    return { nonce, cipher };
  }

  /**
   * Creates an AES-256-GCM decipher stream for a file that was encrypted with `createEncryptStream`. The auth
   * tag is set up front so it can be used as a plain `Transform` stream; verification happens when the stream
   * ends, emitting an `'error'` event if the ciphertext, nonce, or auth tag don't match.
   */
  createDecryptStream(dek: Buffer, nonce: Buffer, authTag: Buffer): DecipherGCM {
    const decipher = createDecipheriv('aes-256-gcm', dek, nonce);
    decipher.setAuthTag(authTag);
    return decipher;
  }
}

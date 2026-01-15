import { Injectable } from '@nestjs/common';
import { compareSync, hash } from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createPublicKey,
  createVerify,
  constants as cryptoConstants,
  privateDecrypt,
  publicEncrypt,
  randomBytes,
  randomUUID,
} from 'node:crypto';
import { createReadStream } from 'node:fs';
import { Transform } from 'node:stream';

export interface AesGcmEncryptResult {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

export interface AesGcmDecryptOptions {
  ciphertext: Buffer;
  key: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

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
    return createHash('sha256').update(value).digest('base64');
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

  /**
   * Generate a random 256-bit (32 byte) encryption key
   */
  generateEncryptionKey(): Buffer {
    return randomBytes(32);
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encryptAesGcm(plaintext: Buffer, key: Buffer): AesGcmEncryptResult {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return { ciphertext, iv, authTag };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decryptAesGcm(options: AesGcmDecryptOptions): Buffer {
    const { ciphertext, key, iv, authTag } = options;
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  /**
   * Create a transform stream for AES-256-GCM encryption
   * The stream expects plaintext and outputs ciphertext
   */
  createEncryptStream(key: Buffer, iv: Buffer): Transform {
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    return cipher;
  }

  /**
   * Create a transform stream for AES-256-GCM decryption
   * Note: authTag must be set before the stream ends
   */
  createDecryptStream(key: Buffer, iv: Buffer, authTag: Buffer): Transform {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return decipher;
  }

  /**
   * Encrypt data with RSA-OAEP public key
   */
  encryptRsa(data: Buffer, publicKeyPem: string): Buffer {
    return publicEncrypt(
      {
        key: publicKeyPem,
        padding: cryptoConstants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      data,
    );
  }

  /**
   * Decrypt data with RSA-OAEP private key
   */
  decryptRsa(data: Buffer, privateKeyPem: string): Buffer {
    return privateDecrypt(
      {
        key: privateKeyPem,
        padding: cryptoConstants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      data,
    );
  }

  /**
   * Wrap a key (DEK) with another key (KEK) using AES-256-GCM
   */
  wrapKey(dek: Buffer, kek: Buffer): string {
    const result = this.encryptAesGcm(dek, kek);
    // Format: base64(iv || ciphertext || authTag)
    return Buffer.concat([result.iv, result.ciphertext, result.authTag]).toString('base64');
  }

  /**
   * Unwrap a key (DEK) using the KEK
   */
  unwrapKey(wrappedKey: string, kek: Buffer): Buffer {
    const data = Buffer.from(wrappedKey, 'base64');
    const iv = data.subarray(0, 16);
    const authTag = data.subarray(-16);
    const ciphertext = data.subarray(16, -16);
    return this.decryptAesGcm({ ciphertext, key: kek, iv, authTag });
  }
}

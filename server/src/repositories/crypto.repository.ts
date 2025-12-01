import { Injectable } from '@nestjs/common';
import { compareSync, hash } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createCipheriv, createDecipheriv, createHash, createPublicKey, createVerify, randomBytes, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { EncryptionAlgo, generateIv } from 'src/utils/encryption';

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

  // Derive a 32-byte KEK from a secret string using sha256
  deriveKek(secret: string): Buffer {
    return createHash('sha256').update(secret).digest();
  }

  // Wrap a DEK using AES-256-GCM with KEK; returns ciphertext, iv, tag
  wrapDek(kek: Buffer, dek: Buffer, algo: EncryptionAlgo = 'AES-256-GCM') {
    const iv = generateIv();
    const cipher = createCipheriv('aes-256-gcm', kek, iv);
    const wrapped = Buffer.concat([cipher.update(dek), cipher.final()]);
    const tag = cipher.getAuthTag();
    return { wrapped, iv, tag, algo };
  }

  // Unwrap a DEK using AES-256-GCM with KEK and provided iv/tag
  unwrapDek(kek: Buffer, wrapped: Buffer, iv: Buffer, tag: Buffer, algo: EncryptionAlgo = 'AES-256-GCM') {
    const decipher = createDecipheriv('aes-256-gcm', kek, iv);
    decipher.setAuthTag(tag);
    const dek = Buffer.concat([decipher.update(wrapped), decipher.final()]);
    return { dek, algo };
  }
}

import { CipherGCMTypes, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Readable, Transform, TransformCallback, Writable } from 'node:stream';

export type EncryptionAlgo = 'AES-256-GCM';

export interface EnvelopeParams {
  algo: EncryptionAlgo;
  iv: Buffer;
  encryptedDek: Buffer; // DEK wrapped by KEK
  version: number;
}

export interface EncryptParams {
  algo: EncryptionAlgo;
  iv: Buffer;
  dek: Buffer; // plaintext DEK
}

export interface DecryptParams {
  algo: EncryptionAlgo;
  iv: Buffer;
  dek: Buffer; // plaintext DEK
  authTag?: Buffer; // optional external tag if not embedded
}

export function generateIv(length = 12): Buffer {
  // GCM standard 12-byte IV
  return randomBytes(length);
}

export function generateDek(length = 32): Buffer {
  // 32 bytes for AES-256
  return randomBytes(length);
}

export function createEncryptStream(params: EncryptParams): {
  cipher: ReturnType<typeof createCipheriv>;
  stream: Transform;
  getAuthTag: () => Buffer;
} {
  const { algo, iv, dek } = params;
  const nodeAlgo: CipherGCMTypes = algo === 'AES-256-GCM' ? 'aes-256-gcm' : 'aes-256-gcm';
  const cipher = createCipheriv(nodeAlgo, dek, iv, { authTagLength: 16 });

  const stream = new Transform({
    transform(chunk: Buffer, _enc: BufferEncoding, cb: TransformCallback) {
      try {
        const encrypted = cipher.update(chunk);
        cb(null, encrypted);
      } catch (e) {
        cb(e as Error);
      }
    },
    flush(cb: TransformCallback) {
      try {
        const final = cipher.final();
        if (final.length) this.push(final);
        cb();
      } catch (e) {
        cb(e as Error);
      }
    },
  });

  const getAuthTag = () => cipher.getAuthTag();
  return { cipher, stream, getAuthTag };
}

export function createDecryptStream(params: DecryptParams): {
  decipher: ReturnType<typeof createDecipheriv>;
  stream: Transform;
} {
  const { algo, iv, dek, authTag } = params;
  const nodeAlgo: CipherGCMTypes = algo === 'AES-256-GCM' ? 'aes-256-gcm' : 'aes-256-gcm';
  const decipher = createDecipheriv(nodeAlgo, dek, iv);
  if (authTag) {
    decipher.setAuthTag(authTag);
  }

  const stream = new Transform({
    transform(chunk: Buffer, _enc: BufferEncoding, cb: TransformCallback) {
      try {
        const decrypted = decipher.update(chunk);
        cb(null, decrypted);
      } catch (e) {
        cb(e as Error);
      }
    },
    flush(cb: TransformCallback) {
      try {
        const final = decipher.final();
        if (final.length) this.push(final);
        cb();
      } catch (e) {
        cb(e as Error);
      }
    },
  });

  return { decipher, stream };
}

// Helper to pipe read->encrypt->write and return authTag
export async function encryptFileStream(
  input: Readable,
  output: Writable,
  params: EncryptParams,
): Promise<Buffer> {
  const { stream, getAuthTag } = createEncryptStream(params);
  await new Promise<void>((resolve, reject) => {
    input
      .on('error', reject)
      .pipe(stream)
      .on('error', reject)
      .pipe(output)
      .on('error', reject)
      .on('finish', () => resolve());
  });
  return getAuthTag();
}

// Helper to pipe read->decrypt->write
export async function decryptFileStream(
  input: Readable,
  output: Writable,
  params: DecryptParams,
): Promise<void> {
  const { stream } = createDecryptStream(params);
  await new Promise<void>((resolve, reject) => {
    input
      .on('error', reject)
      .pipe(stream)
      .on('error', reject)
      .pipe(output)
      .on('error', reject)
      .on('finish', () => resolve());
  });
}

import { ICryptoRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { compareSync, hash } from 'bcrypt';
import { Span } from 'nestjs-otel';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';

@Injectable()
export class CryptoRepository implements ICryptoRepository {
  @Span()
  randomUUID() {
    return randomUUID();
  }

  @Span()
  randomBytes(size: number) {
    return randomBytes(size);
  }

  @Span()
  hashBcrypt(data: string | Buffer, saltOrRounds: string | number) {
    return hash(data, saltOrRounds);
  }

  @Span()
  compareBcrypt(data: string | Buffer, encrypted: string) {
    return compareSync(data, encrypted);
  }

  @Span()
  hashSha256(value: string) {
    return createHash('sha256').update(value).digest('base64');
  }

  @Span()
  hashSha1(value: string | Buffer): Buffer {
    return createHash('sha1').update(value).digest();
  }

  @Span()
  hashFile(filepath: string | Buffer): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const hash = createHash('sha1');
      const stream = createReadStream(filepath);
      stream.on('error', (error) => reject(error));
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest()));
    });
  }
}

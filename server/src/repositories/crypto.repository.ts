import { Injectable } from '@nestjs/common';
import { compareSync, hash } from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { Instrumentation } from 'src/utils/instrumentation';

@Instrumentation()
@Injectable()
export class CryptoRepository implements ICryptoRepository {
  randomUUID() {
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

  newPassword(bytes: number) {
    return randomBytes(bytes).toString('base64').replaceAll(/\W/g, '');
  }
}

import { ICryptoRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { compareSync, hash } from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { createReadStream } from 'fs';

@Injectable()
export class CryptoRepository implements ICryptoRepository {
  randomUUID = randomUUID;
  randomBytes = randomBytes;

  hashBcrypt = hash;
  compareBcrypt = compareSync;

  hashSha256(value: string) {
    return createHash('sha256').update(value).digest('base64');
  }

  hashFile(filepath: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const hash = createHash('sha1');
      const stream = createReadStream(filepath);
      stream.on('error', (err) => reject(err));
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest()));
    });
  }
}

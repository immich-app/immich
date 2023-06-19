import { ICryptoRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { compareSync, hash } from 'bcrypt';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class CryptoRepository implements ICryptoRepository {
  randomBytes = randomBytes;

  hashBcrypt = hash;
  compareBcrypt = compareSync;

  hashSha256(value: string) {
    return createHash('sha256').update(value).digest('base64');
  }
}

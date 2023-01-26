import { ICryptoRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { compareSync, hash } from 'bcrypt';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class CryptoRepository implements ICryptoRepository {
  constructor(private jwtService: JwtService) {}

  randomBytes = randomBytes;

  hashBcrypt = hash;
  compareBcrypt = compareSync;

  hashSha256(value: string) {
    return createHash('sha256').update(value).digest('base64');
  }

  compareSha256(data: string, hashed: string): boolean {
    return this.hashSha256(data) === hashed;
  }

  signJwt(payload: string | Buffer | object) {
    return this.jwtService.sign(payload);
  }

  verifyJwtAsync<T extends object = any>(token: string, options?: JwtVerifyOptions): Promise<T> {
    return this.jwtService.verifyAsync(token, options);
  }
}

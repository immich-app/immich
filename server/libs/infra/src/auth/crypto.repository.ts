import { ICryptoRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { compareSync, hash } from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class CryptoRepository implements ICryptoRepository {
  constructor(private jwtService: JwtService) {}

  randomBytes = randomBytes;
  hash = hash;
  compareSync = compareSync;

  signJwt(payload: string | Buffer | object) {
    return this.jwtService.sign(payload);
  }

  verifyJwtAsync<T extends object = any>(token: string, options?: JwtVerifyOptions): Promise<T> {
    return this.jwtService.verifyAsync(token, options);
  }
}

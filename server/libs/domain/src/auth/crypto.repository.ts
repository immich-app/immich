import { JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';

export const ICryptoRepository = 'ICryptoRepository';

export interface ICryptoRepository {
  randomBytes(size: number): Buffer;
  hashSha256(data: string): string;
  hashBcrypt(data: string | Buffer, saltOrRounds: string | number): Promise<string>;
  compareBcrypt(data: string | Buffer, encrypted: string): boolean;
  signJwt(payload: string | Buffer | object, options?: JwtSignOptions): string;
  verifyJwtAsync<T extends object = any>(token: string, options?: JwtVerifyOptions): Promise<T>;
}

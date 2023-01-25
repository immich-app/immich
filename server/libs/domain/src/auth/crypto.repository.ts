import { JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';

export const ICryptoRepository = 'ICryptoRepository';

export interface ICryptoRepository {
  randomBytes(size: number): Buffer;
  hash(data: string | Buffer, saltOrRounds: string | number): Promise<string>;
  compareSync(data: Buffer | string, encrypted: string): boolean;
  signJwt(payload: string | Buffer | object, options?: JwtSignOptions): string;
  verifyJwtAsync<T extends object = any>(token: string, options?: JwtVerifyOptions): Promise<T>;
}

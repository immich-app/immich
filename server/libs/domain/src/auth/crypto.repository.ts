export const ICryptoRepository = 'ICryptoRepository';

export interface ICryptoRepository {
  randomBytes(size: number): Buffer;
  hash(data: string | Buffer, saltOrRounds: string | number): Promise<string>;
  compareSync(data: Buffer | string, encrypted: string): boolean;
}

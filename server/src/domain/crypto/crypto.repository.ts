export const ICryptoRepository = 'ICryptoRepository';

export interface ICryptoRepository {
  randomBytes(size: number): Buffer;
  randomUUID(): string;
  hashFile(filePath: string): Promise<Buffer>;
  hashSha256(data: string): string;
  hashBcrypt(data: string | Buffer, saltOrRounds: string | number): Promise<string>;
  compareBcrypt(data: string | Buffer, encrypted: string): boolean;
}

export const ICryptoRepository = 'ICryptoRepository';

export interface ICryptoRepository {
  randomBytes(size: number): Buffer;
  randomUUID(): string;
  hashFile(filePath: string | Buffer): Promise<Buffer>;
  hashSha256(data: string): string;
  hashSha1(data: string | Buffer): Buffer;
  hashBcrypt(data: string | Buffer, saltOrRounds: string | number): Promise<string>;
  compareBcrypt(data: string | Buffer, encrypted: string): boolean;
  newPassword(bytes: number): string;
}

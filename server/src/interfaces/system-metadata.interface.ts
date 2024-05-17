import { SystemMetadata } from 'src/entities/system-metadata.entity';

export const ISystemMetadataRepository = 'ISystemMetadataRepository';

export interface ISystemMetadataRepository {
  get<T extends keyof SystemMetadata>(key: T): Promise<SystemMetadata[T] | null>;
  set<T extends keyof SystemMetadata>(key: T, value: SystemMetadata[T]): Promise<void>;
  fetchStyle(url: string): Promise<any>;
  readFile(filename: string): Promise<string>;
}

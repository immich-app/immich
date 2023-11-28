import { SystemMetadata } from '@app/infra/entities';

export const ISystemMetadataRepository = 'ISystemMetadataRepository';

export interface ISystemMetadataRepository {
  get<T extends keyof SystemMetadata>(key: T): Promise<SystemMetadata[T] | null>;
  set<T extends keyof SystemMetadata>(key: T, value: SystemMetadata[T]): Promise<void>;
}

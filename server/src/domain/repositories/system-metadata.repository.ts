import { Metadata } from '@app/infra/entities';

export const ISystemMetadataRepository = 'ISystemMetadataRepository';

export interface ISystemMetadataRepository {
  get<T extends keyof Metadata>(key: T): Promise<Metadata[T] | null>;
  set<T extends keyof Metadata>(key: T, value: Metadata[T]): Promise<void>;
}

import { VersionHistoryEntity } from 'src/entities/version-history.entity';

export const IVersionHistoryRepository = 'IVersionHistoryRepository';

export interface IVersionHistoryRepository {
  create(version: Omit<VersionHistoryEntity, 'id' | 'createdAt'>): Promise<VersionHistoryEntity>;
  getAll(): Promise<VersionHistoryEntity[]>;
  getLatest(): Promise<VersionHistoryEntity | null>;
}

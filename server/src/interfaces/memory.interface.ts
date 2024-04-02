import { MemoryEntity } from 'src/entities/memory.entity';

export const IMemoryRepository = 'IMemoryRepository';

export interface IMemoryRepository {
  search(ownerId: string): Promise<MemoryEntity[]>;
  get(id: string): Promise<MemoryEntity | null>;
  create(memory: Partial<MemoryEntity>): Promise<MemoryEntity>;
  update(memory: Partial<MemoryEntity>): Promise<MemoryEntity>;
  delete(id: string): Promise<void>;
  getAssetIds(id: string, assetIds: string[]): Promise<Set<string>>;
  addAssetIds(id: string, assetIds: string[]): Promise<void>;
  removeAssetIds(id: string, assetIds: string[]): Promise<void>;
}

import { MemoryEntity } from 'src/entities/memory.entity';
import { IBulkAsset } from 'src/utils/asset.util';

export const IMemoryRepository = 'IMemoryRepository';

export interface IMemoryRepository extends IBulkAsset {
  search(ownerId: string): Promise<MemoryEntity[]>;
  get(id: string): Promise<MemoryEntity | null>;
  create(memory: Partial<MemoryEntity>): Promise<MemoryEntity>;
  update(memory: Partial<MemoryEntity>): Promise<MemoryEntity>;
  delete(id: string): Promise<void>;
}

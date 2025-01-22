import { Insertable, Updateable } from 'kysely';
import { Memories } from 'src/db';
import { MemoryEntity, OnThisDayData } from 'src/entities/memory.entity';
import { IBulkAsset } from 'src/utils/asset.util';

export const IMemoryRepository = 'IMemoryRepository';

export interface IMemoryRepository extends IBulkAsset {
  search(ownerId: string): Promise<MemoryEntity[]>;
  get(id: string): Promise<MemoryEntity | undefined>;
  create(
    memory: Omit<Insertable<Memories>, 'data'> & { data: OnThisDayData },
    assetIds: Set<string>,
  ): Promise<MemoryEntity>;
  update(id: string, memory: Updateable<Memories>): Promise<MemoryEntity>;
  delete(id: string): Promise<void>;
}

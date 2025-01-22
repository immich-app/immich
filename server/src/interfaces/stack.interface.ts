import { Updateable } from 'kysely';
import { StackEntity } from 'src/entities/stack.entity';

export const IStackRepository = 'IStackRepository';

export interface StackSearch {
  ownerId: string;
  primaryAssetId?: string;
}

export interface IStackRepository {
  search(query: StackSearch): Promise<StackEntity[]>;
  create(stack: { ownerId: string; assetIds: string[] }): Promise<StackEntity>;
  update(id: string, entity: Updateable<StackEntity>): Promise<StackEntity>;
  delete(id: string): Promise<void>;
  deleteAll(ids: string[]): Promise<void>;
  getById(id: string): Promise<StackEntity | undefined>;
}

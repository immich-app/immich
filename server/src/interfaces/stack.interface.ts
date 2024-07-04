import { StackEntity } from 'src/entities/stack.entity';
import { IBulkAsset } from 'src/utils/asset.util';

export const IStackRepository = 'IStackRepository';

export interface IStackRepository extends IBulkAsset {
  create(assetStack: Partial<StackEntity>): Promise<StackEntity>;
  update(asset: Pick<StackEntity, 'id'> & Partial<StackEntity>): Promise<StackEntity>;
  delete(id: string): Promise<void>;
  deleteAll(ids: string[]): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  getById(id: string): Promise<StackEntity | null>;
  updatePrimaryAssets(): Promise<void>;
}

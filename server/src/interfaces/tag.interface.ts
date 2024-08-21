import { TagEntity } from 'src/entities/tag.entity';
import { IBulkAsset } from 'src/utils/asset.util';

export const ITagRepository = 'ITagRepository';

export interface ITagRepository extends IBulkAsset {
  getAll(userId: string): Promise<TagEntity[]>;
  getByValue(userId: string, value: string): Promise<TagEntity | null>;

  create(tag: Partial<TagEntity>): Promise<TagEntity>;
  get(id: string): Promise<TagEntity | null>;
  delete(id: string): Promise<void>;

  upsertAssetTags({ assetId, tagIds }: { assetId: string; tagIds: string[] }): Promise<void>;
}

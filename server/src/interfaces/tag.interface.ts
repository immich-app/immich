import { TagEntity } from 'src/entities/tag.entity';
import { IBulkAsset } from 'src/utils/asset.util';

export const ITagRepository = 'ITagRepository';

export type AssetTagItem = { assetId: string; tagId: string };

export interface ITagRepository extends IBulkAsset {
  getAll(userId: string): Promise<TagEntity[]>;
  getByValue(userId: string, value: string): Promise<TagEntity | null>;
  upsertValue(request: { userId: string; value: string; parent?: TagEntity }): Promise<TagEntity>;

  create(tag: Partial<TagEntity>): Promise<TagEntity>;
  get(id: string): Promise<TagEntity | null>;
  update(tag: { id: string } & Partial<TagEntity>): Promise<TagEntity>;
  delete(id: string): Promise<void>;

  upsertAssetTags({ assetId, tagIds }: { assetId: string; tagIds: string[] }): Promise<void>;
  upsertAssetIds(items: AssetTagItem[]): Promise<AssetTagItem[]>;
  deleteEmptyTags(): Promise<void>;
}

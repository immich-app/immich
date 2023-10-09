import { AssetEntity, TagEntity } from '@app/infra/entities';

export const ITagRepository = 'ITagRepository';

export interface ITagRepository {
  getById(userId: string, tagId: string): Promise<TagEntity | null>;
  getAll(userId: string): Promise<TagEntity[]>;
  create(tag: Partial<TagEntity>): Promise<TagEntity>;
  update(tag: Partial<TagEntity>): Promise<TagEntity>;
  remove(tag: TagEntity): Promise<void>;
  hasName(userId: string, name: string): Promise<boolean>;
  hasAsset(userId: string, tagId: string, assetId: string): Promise<boolean>;
  getAssets(userId: string, tagId: string): Promise<AssetEntity[]>;
  addAssets(userId: string, tagId: string, assetIds: string[]): Promise<void>;
  removeAssets(userId: string, tagId: string, assetIds: string[]): Promise<void>;
}

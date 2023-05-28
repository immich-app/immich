import { TagEntity } from '@app/infra/entities';

export const ITagRepository = 'ITagRepository';

export interface ITagRepository {
  getById(userId: string, tagId: string): Promise<TagEntity | null>;
  getAll(userId: string): Promise<TagEntity[]>;
  create(tag: Partial<TagEntity>): Promise<TagEntity>;
  update(tag: Partial<TagEntity>): Promise<TagEntity>;
  remove(tag: TagEntity): Promise<void>;
}

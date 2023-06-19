import { SharedLinkEntity } from '@app/infra/entities';

export const ISharedLinkRepository = 'ISharedLinkRepository';

export interface ISharedLinkRepository {
  getAll(userId: string): Promise<SharedLinkEntity[]>;
  get(userId: string, id: string): Promise<SharedLinkEntity | null>;
  getByKey(key: Buffer): Promise<SharedLinkEntity | null>;
  create(entity: Omit<SharedLinkEntity, 'id' | 'user'>): Promise<SharedLinkEntity>;
  update(entity: Partial<SharedLinkEntity>): Promise<SharedLinkEntity>;
  remove(entity: SharedLinkEntity): Promise<void>;
}

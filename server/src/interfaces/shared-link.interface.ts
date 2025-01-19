import { Insertable, Updateable } from 'kysely';
import { SharedLinks } from 'src/db';
import { SharedLinkEntity } from 'src/entities/shared-link.entity';

export const ISharedLinkRepository = 'ISharedLinkRepository';

export interface ISharedLinkRepository {
  getAll(userId: string): Promise<SharedLinkEntity[]>;
  get(userId: string, id: string): Promise<SharedLinkEntity | undefined>;
  getByKey(key: Buffer): Promise<SharedLinkEntity | undefined>;
  create(entity: Insertable<SharedLinks> & { assetIds?: string[] }): Promise<SharedLinkEntity>;
  update(entity: Updateable<SharedLinks> & { id: string; assetIds?: string[] }): Promise<SharedLinkEntity>;
  remove(entity: SharedLinkEntity): Promise<void>;
}

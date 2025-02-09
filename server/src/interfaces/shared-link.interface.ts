import { Insertable, Updateable } from 'kysely';
import { SharedLinks } from 'src/db';
import { SharedLinkEntity } from 'src/entities/shared-link.entity';

export const ISharedLinkRepository = 'ISharedLinkRepository';

export type SharedLinkSearchOptions = {
  userId: string;
  albumId?: string;
};

export interface ISharedLinkRepository {
  getAll(options: SharedLinkSearchOptions): Promise<SharedLinkEntity[]>;
  get(userId: string, id: string): Promise<SharedLinkEntity | undefined>;
  getByKey(key: Buffer): Promise<SharedLinkEntity | undefined>;
  create(entity: Insertable<SharedLinks> & { assetIds?: string[] }): Promise<SharedLinkEntity>;
  update(entity: Updateable<SharedLinks> & { id: string; assetIds?: string[] }): Promise<SharedLinkEntity>;
  remove(entity: SharedLinkEntity): Promise<void>;
}

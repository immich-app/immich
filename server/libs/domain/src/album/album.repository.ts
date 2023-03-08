import { AlbumEntity } from '@app/infra/db/entities';

export const IAlbumRepository = 'IAlbumRepository';

export interface IAlbumRepository {
  getByIds(ids: string[]): Promise<AlbumEntity[]>;
  deleteAll(userId: string): Promise<void>;
  getAll(): Promise<AlbumEntity[]>;
  save(album: Partial<AlbumEntity>): Promise<AlbumEntity>;
}

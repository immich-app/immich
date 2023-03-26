import { AlbumEntity } from '@app/infra/db/entities';

export const IAlbumRepository = 'IAlbumRepository';

export interface AlbumAssetCount {
  albumId: string;
  assetCount: number;
}

export interface IAlbumRepository {
  getByIds(ids: string[]): Promise<AlbumEntity[]>;
  getByAssetId(ownerId: string, assetId: string): Promise<AlbumEntity[]>;
  getAssetCountForIds(ids: string[]): Promise<AlbumAssetCount[]>;
  getInvalidThumbnail(): Promise<string[]>;
  getOwned(ownerId: string): Promise<AlbumEntity[]>;
  getShared(ownerId: string): Promise<AlbumEntity[]>;
  getNotShared(ownerId: string): Promise<AlbumEntity[]>;
  deleteAll(userId: string): Promise<void>;
  getAll(): Promise<AlbumEntity[]>;
  save(album: Partial<AlbumEntity>): Promise<AlbumEntity>;
}

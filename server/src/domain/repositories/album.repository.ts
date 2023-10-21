import { AlbumEntity } from '@app/infra/entities';

export const IAlbumRepository = 'IAlbumRepository';

export interface AlbumAssetCount {
  albumId: string;
  assetCount: number;
}

export interface AlbumInfoOptions {
  withAssets: boolean;
}

export interface AlbumAsset {
  albumId: string;
  assetId: string;
}

export interface AlbumAssets {
  albumId: string;
  assetIds: string[];
}

export interface IAlbumRepository {
  getById(id: string, options: AlbumInfoOptions): Promise<AlbumEntity | null>;
  getByIds(ids: string[]): Promise<AlbumEntity[]>;
  getByAssetId(ownerId: string, assetId: string): Promise<AlbumEntity[]>;
  addAssets(assets: AlbumAssets): Promise<void>;
  hasAsset(asset: AlbumAsset): Promise<boolean>;
  removeAsset(assetId: string): Promise<void>;
  removeAssets(assets: AlbumAssets): Promise<void>;
  getAssetCountForIds(ids: string[]): Promise<AlbumAssetCount[]>;
  getInvalidThumbnail(): Promise<string[]>;
  getOwned(ownerId: string): Promise<AlbumEntity[]>;
  getShared(ownerId: string): Promise<AlbumEntity[]>;
  getNotShared(ownerId: string): Promise<AlbumEntity[]>;
  restoreAll(userId: string): Promise<void>;
  softDeleteAll(userId: string): Promise<void>;
  deleteAll(userId: string): Promise<void>;
  getAll(): Promise<AlbumEntity[]>;
  create(album: Partial<AlbumEntity>): Promise<AlbumEntity>;
  update(album: Partial<AlbumEntity>): Promise<AlbumEntity>;
  delete(album: AlbumEntity): Promise<void>;
  updateThumbnails(): Promise<number | undefined>;
}

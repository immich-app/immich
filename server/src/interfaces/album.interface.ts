import { AlbumEntity } from 'src/entities/album.entity';
import { IBulkAsset } from 'src/utils/asset.util';

export const IAlbumRepository = 'IAlbumRepository';

export interface AlbumAssetCount {
  albumId: string;
  assetCount: number;
  startDate: Date | undefined;
  endDate: Date | undefined;
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

export interface IAlbumRepository extends IBulkAsset {
  getById(id: string, options: AlbumInfoOptions): Promise<AlbumEntity | null>;
  getByIds(ids: string[]): Promise<AlbumEntity[]>;
  getByAssetId(ownerId: string, assetId: string): Promise<AlbumEntity[]>;
  getAssetIds(albumId: string, assetIds?: string[]): Promise<Set<string>>;
  hasAsset(asset: AlbumAsset): Promise<boolean>;
  removeAsset(assetId: string): Promise<void>;
  removeAssetIds(albumId: string, assetIds: string[]): Promise<void>;
  getMetadataForIds(ids: string[]): Promise<AlbumAssetCount[]>;
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

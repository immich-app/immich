import { Insertable, Updateable } from 'kysely';
import { Albums } from 'src/db';
import { AlbumUserCreateDto } from 'src/dtos/album.dto';
import { AlbumEntity } from 'src/entities/album.entity';
import { IBulkAsset } from 'src/utils/asset.util';

export const IAlbumRepository = 'IAlbumRepository';

export interface AlbumAssetCount {
  albumId: string;
  assetCount: number;
  startDate: Date | null;
  endDate: Date | null;
}

export interface AlbumInfoOptions {
  withAssets: boolean;
}

export interface IAlbumRepository extends IBulkAsset {
  getById(id: string, options: AlbumInfoOptions): Promise<AlbumEntity | undefined>;
  getByAssetId(ownerId: string, assetId: string): Promise<AlbumEntity[]>;
  removeAsset(assetId: string): Promise<void>;
  getMetadataForIds(ids: string[]): Promise<AlbumAssetCount[]>;
  getOwned(ownerId: string): Promise<AlbumEntity[]>;
  getShared(ownerId: string): Promise<AlbumEntity[]>;
  getNotShared(ownerId: string): Promise<AlbumEntity[]>;
  restoreAll(userId: string): Promise<void>;
  softDeleteAll(userId: string): Promise<void>;
  deleteAll(userId: string): Promise<void>;
  create(album: Insertable<Albums>, assetIds: string[], albumUsers: AlbumUserCreateDto[]): Promise<AlbumEntity>;
  update(id: string, album: Updateable<Albums>): Promise<AlbumEntity>;
  delete(id: string): Promise<void>;
  updateThumbnails(): Promise<number | undefined>;
}

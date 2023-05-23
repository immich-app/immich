import { AlbumEntity, AssetEntity, UserEntity } from '@app/infra/entities';
import { BoundingBox } from '../smart-info';

export interface IBaseJob {
  force?: boolean;
}

export interface IAlbumJob extends IBaseJob {
  album: AlbumEntity;
}

export interface IAssetJob extends IBaseJob {
  asset: AssetEntity;
}

export interface IAssetFaceJob extends IBaseJob {
  assetId: string;
  personId: string;
}

export interface IFaceThumbnailJob extends IAssetFaceJob {
  imageWidth: number;
  imageHeight: number;
  boundingBox: BoundingBox;
  assetId: string;
  personId: string;
}

export interface IBulkEntityJob extends IBaseJob {
  ids: string[];
}

export interface IDeleteFilesJob extends IBaseJob {
  files: Array<string | null | undefined>;
}

export interface IUserDeletionJob extends IBaseJob {
  user: UserEntity;
}

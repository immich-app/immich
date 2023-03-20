import { AlbumEntity, AssetEntity, UserEntity } from '@app/infra/db/entities';

export interface IBaseJob {
  force?: boolean;
}

export interface IAlbumJob extends IBaseJob {
  album: AlbumEntity;
}

export interface IAssetJob extends IBaseJob {
  asset: AssetEntity;
}

export interface IBulkEntityJob extends IBaseJob {
  ids: string[];
}

export interface IAssetUploadedJob extends IBaseJob {
  asset: AssetEntity;
  fileName: string;
}

export interface IDeleteFilesJob extends IBaseJob {
  files: Array<string | null | undefined>;
}

export interface IUserDeletionJob extends IBaseJob {
  user: UserEntity;
}

export interface IReverseGeocodingJob extends IBaseJob {
  assetId: string;
  latitude: number;
  longitude: number;
}

export type IMetadataExtractionJob = IAssetUploadedJob | IReverseGeocodingJob;

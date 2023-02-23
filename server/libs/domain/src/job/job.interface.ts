import { AssetEntity, UserEntity } from '@app/infra/db/entities';

export interface IAssetJob {
  asset: AssetEntity;
}

export interface IAssetUploadedJob {
  asset: AssetEntity;
  fileName: string;
}

export interface IDeleteFilesJob {
  files: Array<string | null | undefined>;
}

export interface IUserDeletionJob {
  user: UserEntity;
}

export interface IReverseGeocodingJob {
  assetId: string;
  latitude: number;
  longitude: number;
}

export type IMetadataExtractionJob = IAssetUploadedJob | IReverseGeocodingJob;

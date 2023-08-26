import { BoundingBox } from '../smart-info';

export interface IBaseJob {
  force?: boolean;
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

export interface IEntityJob extends IBaseJob {
  id: string;
  source?: 'upload';
}

export interface IOfflineLibraryFileJob extends IEntityJob {
  assetId: string;
  assetPath: string;
  emptyTrash: boolean;
}

export interface ILibraryFileJob extends IEntityJob {
  ownerId: string;
  assetPath: string;
  forceRefresh: boolean;
  emptyTrash: boolean;
}

export interface ILibraryRefreshJob extends IEntityJob {
  ownerId: string;
  refreshModifiedFiles: boolean;
  refreshAllFiles: boolean;
  emptyTrash: boolean;
}

export interface IBulkEntityJob extends IBaseJob {
  ids: string[];
}

export interface IDeleteFilesJob extends IBaseJob {
  files: Array<string | null | undefined>;
}

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

export interface IOfflineLibraryFileJob extends IBaseJob {
  libraryId: string;
  assetId: string;
  assetPath: string;
  emptyTrash: boolean;
}

export interface ILibraryFileJob extends IBaseJob {
  libraryId: string;
  ownerId: string;
  assetPath: string;
  analyze: boolean;
  emptyTrash: boolean;
}

export interface ILibraryJob extends IBaseJob {
  libraryId: string;
}

export interface IBulkEntityJob extends IBaseJob {
  ids: string[];
}

export interface IDeleteFilesJob extends IBaseJob {
  files: Array<string | null | undefined>;
}

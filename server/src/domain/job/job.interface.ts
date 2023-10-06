export interface IBaseJob {
  force?: boolean;
}

export interface IAssetFaceJob extends IBaseJob {
  assetId: string;
  personId: string;
}

export interface IEntityJob extends IBaseJob {
  id: string;
  source?: 'upload';
}

export interface IAssetDeletionJob extends IEntityJob {
  fromExternal?: boolean;
}

export interface IOfflineLibraryFileJob extends IEntityJob {
  assetPath: string;
}

export interface ILibraryFileJob extends IEntityJob {
  ownerId: string;
  assetPath: string;
  forceRefresh: boolean;
}

export interface ILibraryRefreshJob extends IEntityJob {
  refreshModifiedFiles: boolean;
  refreshAllFiles: boolean;
}

export interface IBulkEntityJob extends IBaseJob {
  ids: string[];
}

export interface IDeleteFilesJob extends IBaseJob {
  files: Array<string | null | undefined>;
}

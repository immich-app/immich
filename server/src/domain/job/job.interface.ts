export interface IBaseJob {
  force?: boolean;
}

export interface IEntityJob extends IBaseJob {
  id: string;
  source?: 'upload' | 'sidecar-write';
}

export interface IAssetDeletionJob extends IEntityJob {
  fromExternal?: boolean;
}

export interface ILibraryFileJob extends IEntityJob {
  ownerId: string;
  assetPath: string;
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

export interface ISidecarWriteJob extends IEntityJob {
  description?: string;
  dateTimeOriginal?: string;
  latitude?: number;
  longitude?: number;
}

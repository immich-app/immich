export enum WorkflowTrigger {
  AssetCreate = 'AssetCreate',
  PersonRecognized = 'PersonRecognized',
}

export enum WorkflowType {
  AssetV1 = 'AssetV1',
  AssetPersonV1 = 'AssetPersonV1',
}

export enum AssetType {
  Image = 'IMAGE',
  Video = 'VIDEO',
  Audio = 'AUDIO',
  Other = 'OTHER',
}

export enum AssetStatus {
  Active = 'active',
  Trashed = 'trashed',
  Deleted = 'deleted',
}

export enum AssetVisibility {
  Archive = 'archive',
  Timeline = 'timeline',

  /**
   * Video part of the LivePhotos and MotionPhotos
   */
  Hidden = 'hidden',
  Locked = 'locked',
}

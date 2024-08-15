export enum AssetType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  OTHER = 'OTHER',
}

export enum AlbumUserRole {
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export enum AssetOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum DatabaseAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum EntityType {
  ASSET = 'ASSET',
  ALBUM = 'ALBUM',
}

export enum MemoryType {
  /** pictures taken on this day X years ago */
  ON_THIS_DAY = 'on_this_day',
}

export enum Permission {
  ACTIVITY_CREATE = 'activity.create',
  ACTIVITY_DELETE = 'activity.delete',

  // ASSET_CREATE = 'asset.create',
  ASSET_READ = 'asset.read',
  ASSET_UPDATE = 'asset.update',
  ASSET_DELETE = 'asset.delete',
  ASSET_RESTORE = 'asset.restore',
  ASSET_SHARE = 'asset.share',
  ASSET_VIEW = 'asset.view',
  ASSET_DOWNLOAD = 'asset.download',
  ASSET_UPLOAD = 'asset.upload',

  // ALBUM_CREATE = 'album.create',
  ALBUM_READ = 'album.read',
  ALBUM_UPDATE = 'album.update',
  ALBUM_DELETE = 'album.delete',
  ALBUM_ADD_ASSET = 'album.addAsset',
  ALBUM_REMOVE_ASSET = 'album.removeAsset',
  ALBUM_SHARE = 'album.share',
  ALBUM_DOWNLOAD = 'album.download',

  AUTH_DEVICE_DELETE = 'authDevice.delete',

  ARCHIVE_READ = 'archive.read',

  TIMELINE_READ = 'timeline.read',
  TIMELINE_DOWNLOAD = 'timeline.download',

  MEMORY_READ = 'memory.read',
  MEMORY_WRITE = 'memory.write',
  MEMORY_DELETE = 'memory.delete',

  PERSON_READ = 'person.read',
  PERSON_WRITE = 'person.write',
  PERSON_MERGE = 'person.merge',
  PERSON_CREATE = 'person.create',
  PERSON_REASSIGN = 'person.reassign',

  PARTNER_UPDATE = 'partner.update',
}

export enum SharedLinkType {
  ALBUM = 'ALBUM',

  /**
   * Individual asset
   * or group of assets that are not in an album
   */
  INDIVIDUAL = 'INDIVIDUAL',
}

export enum SystemMetadataKey {
  REVERSE_GEOCODING_STATE = 'reverse-geocoding-state',
  FACIAL_RECOGNITION_STATE = 'facial-recognition-state',
  ADMIN_ONBOARDING = 'admin-onboarding',
  SYSTEM_CONFIG = 'system-config',
  VERSION_CHECK_STATE = 'version-check-state',
  LICENSE = 'license',
}

export enum UserMetadataKey {
  PREFERENCES = 'preferences',
  LICENSE = 'license',
}

export enum UserAvatarColor {
  PRIMARY = 'primary',
  PINK = 'pink',
  RED = 'red',
  YELLOW = 'yellow',
  BLUE = 'blue',
  GREEN = 'green',
  PURPLE = 'purple',
  ORANGE = 'orange',
  GRAY = 'gray',
  AMBER = 'amber',
}

export enum UserStatus {
  ACTIVE = 'active',
  REMOVING = 'removing',
  DELETED = 'deleted',
}

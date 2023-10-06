export enum AssetAction {
  ARCHIVE = 'archive',
  UNARCHIVE = 'unarchive',
  FAVORITE = 'favorite',
  UNFAVORITE = 'unfavorite',
  TRASH = 'trash',
  RESTORE = 'restore',
}

export enum AppRoute {
  ADMIN_USER_MANAGEMENT = '/admin/user-management',
  ADMIN_SETTINGS = '/admin/system-settings',
  ADMIN_STATS = '/admin/server-status',
  ADMIN_JOBS = '/admin/jobs-status',

  ALBUMS = '/albums',
  LIBRARIES = '/libraries',
  ARCHIVE = '/archive',
  FAVORITES = '/favorites',
  PEOPLE = '/people',
  PHOTOS = '/photos',
  EXPLORE = '/explore',
  SHARING = '/sharing',
  SHARED_LINKS = '/sharing/sharedlinks',
  SEARCH = '/search',
  MAP = '/map',
  USER_SETTINGS = '/user-settings',
  MEMORY = '/memory',
  TRASH = '/trash',

  AUTH_LOGIN = '/auth/login',
  AUTH_LOGOUT = '/auth/logout',
  AUTH_REGISTER = '/auth/register',
  AUTH_CHANGE_PASSWORD = '/auth/change-password',
}

export enum ProjectionType {
  EQUIRECTANGULAR = 'EQUIRECTANGULAR',
  CUBEMAP = 'CUBEMAP',
  CUBESTRIP = 'CUBESTRIP',
  EQUIRECTANGULAR_STEREO = 'EQUIRECTANGULAR_STEREO',
  CUBEMAP_STEREO = 'CUBEMAP_STEREO',
  CUBESTRIP_STEREO = 'CUBESTRIP_STEREO',
  CYLINDER = 'CYLINDER',
  NONE = 'NONE',
}

export const dateFormats = {
  album: <Intl.DateTimeFormatOptions>{
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  },
};

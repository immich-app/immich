export enum AssetAction {
  ARCHIVE = 'archive',
  UNARCHIVE = 'unarchive',
  FAVORITE = 'favorite',
  UNFAVORITE = 'unfavorite',
  TRASH = 'trash',
  DELETE = 'delete',
  // RESTORE = 'restore',
  ADD = 'add',
}

export enum AppRoute {
  ADMIN_USER_MANAGEMENT = '/admin/user-management',
  ADMIN_SETTINGS = '/admin/system-settings',
  ADMIN_STATS = '/admin/server-status',
  ADMIN_JOBS = '/admin/jobs-status',
  ADMIN_REPAIR = '/admin/repair',

  ALBUMS = '/albums',
  LIBRARIES = '/libraries',
  ARCHIVE = '/archive',
  FAVORITES = '/favorites',
  PEOPLE = '/people',
  PLACES = '/places',
  PHOTOS = '/photos',
  EXPLORE = '/explore',
  SHARE = '/share',
  SHARING = '/sharing',
  SHARED_LINKS = '/sharing/sharedlinks',
  SEARCH = '/search',
  MAP = '/map',
  USER_SETTINGS = '/user-settings',
  MEMORY = '/memory',
  TRASH = '/trash',
  PARTNERS = '/partners',

  AUTH_LOGIN = '/auth/login',
  AUTH_REGISTER = '/auth/register',
  AUTH_CHANGE_PASSWORD = '/auth/change-password',
  AUTH_ONBOARDING = '/auth/onboarding',
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

export enum QueryParameter {
  ACTION = 'action',
  ASSET_INDEX = 'assetIndex',
  IS_OPEN = 'isOpen',
  MEMORY_INDEX = 'memoryIndex',
  ONBOARDING_STEP = 'step',
  OPEN_SETTING = 'openSetting',
  PREVIOUS_ROUTE = 'previousRoute',
  QUERY = 'query',
  SEARCHED_PEOPLE = 'searchedPeople',
  SEARCH_TERM = 'q',
  SMART_SEARCH = 'smartSearch',
  PAGE = 'page',
}

export enum OpenSettingQueryParameterValue {
  OAUTH = 'oauth',
  JOB = 'job',
  STORAGE_TEMPLATE = 'storageTemplate',
}

export enum ActionQueryParameterValue {
  MERGE = 'merge',
}

export const maximumLengthSearchPeople: number = 20;

// time to load the map before displaying the loading spinner
export const timeToLoadTheMap: number = 100;

export const timeBeforeShowLoadingSpinner: number = 100;

// should be the same values as the ones in the app.html
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

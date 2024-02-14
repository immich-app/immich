export const MOBILE_REDIRECT = 'app.immich:/';
export const LOGIN_URL = '/auth/login?autoLaunch=0';
export const IMMICH_ACCESS_COOKIE = 'immich_access_token';
export const IMMICH_IS_AUTHENTICATED = 'immich_is_authenticated';
export const IMMICH_AUTH_TYPE_COOKIE = 'immich_auth_type';
export const IMMICH_API_KEY_NAME = 'api_key';
export const IMMICH_API_KEY_HEADER = 'x-api-key';
export const IMMICH_SHARED_LINK_ACCESS_COOKIE = 'immich_shared_link_token';
export enum AuthType {
  PASSWORD = 'password',
  OAUTH = 'oauth',
}

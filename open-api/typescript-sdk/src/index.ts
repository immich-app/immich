import { defaults } from './fetch-client.js';
export { Orientation as LameGeneratedOrientation } from './fetch-client.js';

export * from './fetch-client.js';
export * from './fetch-errors.js';

export interface InitOptions {
  baseUrl: string;
  apiKey: string;
}

export enum Orientation {
  Rotate0 = 1,
  Rotate0Mirrored = 2,
  Rotate90 = 8,
  Rotate90Mirrored = 7,
  Rotate180 = 3,
  Rotate180Mirrored = 4,
  Rotate270 = 6,
  Rotate270Mirrored = 5,
}

export const init = ({ baseUrl, apiKey }: InitOptions) => {
  setBaseUrl(baseUrl);
  setApiKey(apiKey);
};

export const getBaseUrl = () => defaults.baseUrl;

export const setBaseUrl = (baseUrl: string) => {
  defaults.baseUrl = baseUrl;
};

export const setApiKey = (apiKey: string) => {
  defaults.headers = defaults.headers || {};
  defaults.headers['x-api-key'] = apiKey;
};

export const getAssetOriginalPath = (id: string) => `/assets/${id}/original`;

export const getAssetThumbnailPath = (id: string) => `/assets/${id}/thumbnail`;

export const getAssetPlaybackPath = (id: string) =>
  `/assets/${id}/video/playback`;

export const getUserProfileImagePath = (userId: string) =>
  `/users/${userId}/profile-image`;

export const getPeopleThumbnailPath = (personId: string) =>
  `/people/${personId}/thumbnail`;

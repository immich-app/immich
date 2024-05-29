import { defaults } from './fetch-client.js';

export * from './fetch-client.js';
export * from './fetch-errors.js';

export interface InitOptions {
  baseUrl: string;
  apiKey: string;
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

export const getAssetOriginalPath = (id: string) => `/asset/file/${id}`;

export const getAssetThumbnailPath = (id: string) => `/asset/thumbnail/${id}`;

export const getUserProfileImagePath = (userId: string) =>
  `/users/${userId}/profile-image`;

export const getPeopleThumbnailPath = (personId: string) =>
  `/people/${personId}/thumbnail`;

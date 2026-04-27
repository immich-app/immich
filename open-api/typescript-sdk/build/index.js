import { defaults } from './fetch-client.js';
export * from './fetch-client.js';
export * from './fetch-errors.js';
export const init = ({ baseUrl, apiKey, headers }) => {
    setBaseUrl(baseUrl);
    setApiKey(apiKey);
    if (headers) {
        setHeaders(headers);
    }
};
export const getBaseUrl = () => defaults.baseUrl;
export const setBaseUrl = (baseUrl) => {
    defaults.baseUrl = baseUrl;
};
export const setApiKey = (apiKey) => {
    defaults.headers = defaults.headers || {};
    defaults.headers['x-api-key'] = apiKey;
};
export const setHeader = (key, value) => {
    assertNoApiKey(key);
    defaults.headers = defaults.headers || {};
    defaults.headers[key] = value;
};
export const setHeaders = (headers) => {
    defaults.headers = defaults.headers || {};
    for (const [key, value] of Object.entries(headers)) {
        assertNoApiKey(key);
        defaults.headers[key] = value;
    }
};
const assertNoApiKey = (headerKey) => {
    if (headerKey.toLowerCase() === 'x-api-key') {
        throw new Error('The API key header can only be set using setApiKey().');
    }
};
export const getAssetOriginalPath = (id) => `/assets/${id}/original`;
export const getAssetThumbnailPath = (id) => `/assets/${id}/thumbnail`;
export const getAssetPlaybackPath = (id) => `/assets/${id}/video/playback`;
export const getUserProfileImagePath = (userId) => `/users/${userId}/profile-image`;
export const getPeopleThumbnailPath = (personId) => `/people/${personId}/thumbnail`;

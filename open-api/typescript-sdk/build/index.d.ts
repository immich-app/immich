export * from './fetch-client.js';
export * from './fetch-errors.js';
export interface InitOptions {
    baseUrl: string;
    apiKey: string;
    headers?: Record<string, string>;
}
export declare const init: ({ baseUrl, apiKey, headers }: InitOptions) => void;
export declare const getBaseUrl: () => string;
export declare const setBaseUrl: (baseUrl: string) => void;
export declare const setApiKey: (apiKey: string) => void;
export declare const setHeader: (key: string, value: string) => void;
export declare const setHeaders: (headers: Record<string, string>) => void;
export declare const getAssetOriginalPath: (id: string) => string;
export declare const getAssetThumbnailPath: (id: string) => string;
export declare const getAssetPlaybackPath: (id: string) => string;
export declare const getUserProfileImagePath: (userId: string) => string;
export declare const getPeopleThumbnailPath: (personId: string) => string;

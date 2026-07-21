import {
  AssetMediaSize,
  AssetTypeEnum,
  MemoryType,
  finishOAuth,
  getAssetOriginalPath,
  getAssetPlaybackPath,
  getAssetThumbnailPath,
  getBaseUrl,
  getPeopleThumbnailPath,
  getUserProfileImagePath,
  linkOAuthAccount,
  startOAuth,
  unlinkOAuthAccount,
  type AssetResponseDto,
  type MemoryResponseDto,
  type PersonResponseDto,
  type ServerVersionResponseDto,
  type SharedLinkResponseDto,
  type UserResponseDto,
} from '@immich/sdk';
import { toastManager, type ActionItem, type IfLike } from '@immich/ui';
import { init, register, t } from 'svelte-i18n';
import { derived, get } from 'svelte/store';
import { defaultLang, locales } from '$lib/constants';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { downloadManager } from '$lib/managers/download-manager.svelte';
import { alwaysLoadOriginalFile, lang } from '$lib/stores/preferences.store';
import { isWebCompatibleImage } from '$lib/utils/asset-utils';
import { handleError } from '$lib/utils/handle-error';
import { convertBCP47, langs } from '$lib/utils/i18n';

interface DownloadRequestOptions<T = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: T;
  signal?: AbortSignal;
  onDownloadProgress?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
}

interface DateFormatter {
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
  formatDateTime: (date: Date) => string;
}

export const initLanguage = async () => {
  const preferenceLang = get(lang);
  for (const { code, loader } of langs) {
    register(convertBCP47(code), loader);
  }

  await init({ fallbackLocale: preferenceLang === 'dev' ? 'dev' : defaultLang.code, initialLocale: preferenceLang });
};

interface UploadRequestOptions {
  url: string;
  method?: 'POST' | 'PUT';
  data: FormData;
  onUploadProgress?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
}

export class AbortError extends Error {
  override name = 'AbortError';
}

class ApiError extends Error {
  override name = 'ApiError';

  constructor(
    public override message: string,
    public statusCode: number,
    public details: string,
  ) {
    super(message);
  }
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

let unsubscribeId = 0;
const uploads: Record<number, () => void> = {};

const trackUpload = (unsubscribe: () => void) => {
  const id = unsubscribeId++;
  uploads[id] = unsubscribe;
  return () => {
    delete uploads[id];
  };
};

export const cancelUploadRequests = () => {
  for (const unsubscribe of Object.values(uploads)) {
    unsubscribe();
  }
};

export const uploadRequest = async <T>(options: UploadRequestOptions): Promise<{ data: T; status: number }> => {
  const { onUploadProgress: onProgress, data, url } = options;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const unsubscribe = trackUpload(() => xhr.abort());

    xhr.addEventListener('error', (error) => {
      unsubscribe();
      reject(error);
    });

    xhr.addEventListener('load', () => {
      unsubscribe();
      if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
        resolve({ data: xhr.response as T, status: xhr.status });
      } else {
        reject(new ApiError(xhr.statusText, xhr.status, xhr.response));
      }
    });

    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => onProgress(event));
    }

    xhr.open(options.method || 'POST', url);
    xhr.responseType = 'json';
    xhr.send(data);
  });
};

export const downloadRequest = <TBody = unknown>(options: DownloadRequestOptions<TBody> | string) => {
  if (typeof options === 'string') {
    options = { url: options };
  }

  const { signal, method, url, data: body, onDownloadProgress: onProgress } = options;

  return new Promise<{ data: Blob; status: number }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.addEventListener('error', (error) => reject(error));
    xhr.addEventListener('abort', () => reject(new AbortError()));
    xhr.addEventListener('load', () => {
      if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
        resolve({ data: xhr.response as Blob, status: xhr.status });
      } else {
        reject(new ApiError(xhr.statusText, xhr.status, xhr.responseText));
      }
    });

    if (onProgress) {
      xhr.addEventListener('progress', (event) => onProgress(event));
    }

    if (signal) {
      signal.addEventListener('abort', () => xhr.abort());
    }

    xhr.open(method || 'GET', url);
    xhr.responseType = 'blob';

    if (body) {
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(body));
    } else {
      xhr.send();
    }
  });
};

let _sharedLink: SharedLinkResponseDto | undefined;

export const setSharedLink = (sharedLink: typeof _sharedLink) => (_sharedLink = sharedLink);
export const getSharedLink = (): typeof _sharedLink => _sharedLink;

const createUrl = (path: string, parameters?: Record<string, unknown>) => {
  const searchParameters = new URLSearchParams();
  for (const key in parameters) {
    const value = parameters[key];
    if (value !== undefined && value !== null) {
      searchParameters.set(key, value.toString());
    }
  }

  const url = new URL(path, 'https://example.com');
  url.search = searchParameters.toString();

  return getBaseUrl() + url.pathname + url.search + url.hash;
};

type AssetUrlOptions = { id: string; cacheKey?: string | null; edited?: boolean; size?: AssetMediaSize };

export const getAssetUrl = ({
  asset,
  sharedLink,
  forceOriginal = false,
}: {
  asset: AssetResponseDto | undefined;
  sharedLink?: SharedLinkResponseDto;
  forceOriginal?: boolean;
}) => {
  if (!asset) {
    return;
  }
  const id = asset.id;
  const cacheKey = asset.thumbhash;
  if (sharedLink && (!sharedLink.allowDownload || !sharedLink.showMetadata)) {
    return getAssetMediaUrl({ id, size: AssetMediaSize.Preview, cacheKey });
  }
  const size = targetImageSize(asset, forceOriginal);
  return getAssetMediaUrl({ id, size, cacheKey });
};

export function getAssetUrls(asset: AssetResponseDto, sharedLink?: SharedLinkResponseDto) {
  return {
    thumbnail: getAssetMediaUrl({ id: asset.id, cacheKey: asset.thumbhash, size: AssetMediaSize.Thumbnail }),
    preview: getAssetUrl({ asset, sharedLink })!,
    original: getAssetUrl({ asset, sharedLink, forceOriginal: true })!,
  };
}

const forceUseOriginal = (asset: AssetResponseDto) => {
  return asset.type === AssetTypeEnum.Image && asset.duration;
};

export const targetImageSize = (asset: AssetResponseDto, forceOriginal: boolean) => {
  if (forceOriginal || get(alwaysLoadOriginalFile) || forceUseOriginal(asset)) {
    return asset.type === AssetTypeEnum.Video || isWebCompatibleImage(asset)
      ? AssetMediaSize.Original
      : AssetMediaSize.Fullsize;
  }
  return AssetMediaSize.Preview;
};

export const getAssetMediaUrl = (options: AssetUrlOptions) => {
  const { id, size, cacheKey: c, edited = true } = options;
  const isOriginal = size === AssetMediaSize.Original;
  const path = isOriginal ? getAssetOriginalPath(id) : getAssetThumbnailPath(id);
  return createUrl(path, { ...authManager.params, size: isOriginal ? undefined : size, c, edited });
};

export const getAssetPlaybackUrl = (options: AssetUrlOptions) => {
  const { id, cacheKey: c } = options;
  return createUrl(getAssetPlaybackPath(id), { ...authManager.params, c });
};

export const getAssetHlsUrl = (id: string) => {
  return createUrl(`/assets/${id}/video/stream/main.m3u8`, authManager.params);
};

export const getAssetHlsSessionUrl = (id: string, sessionId: string) => {
  return createUrl(`/assets/${id}/video/stream/${sessionId}`, authManager.params);
};

export const getProfileImageUrl = (user: UserResponseDto) =>
  createUrl(getUserProfileImagePath(user.id), { updatedAt: user.profileChangedAt });

export const getPeopleThumbnailUrl = (person: PersonResponseDto, updatedAt?: string) =>
  createUrl(getPeopleThumbnailPath(person.id), { updatedAt: updatedAt ?? person.updatedAt });

export const copyToClipboard = async (secret: string | unknown) => {
  const $t = get(t);

  try {
    const value = typeof secret === 'string' ? secret : JSON.stringify(secret, jsonReplacer, 2);
    await navigator.clipboard.writeText(value);
    toastManager.info($t('copied_to_clipboard'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_copy_to_clipboard'));
  }
};

// https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify/43636793#43636793
const jsonReplacer = (_key: string, value: unknown) =>
  value instanceof Object && !Array.isArray(value)
    ? Object.keys(value)
        .sort()
        // eslint-disable-next-line unicorn/no-array-reduce
        .reduce((sorted: { [key: string]: unknown }, key) => {
          sorted[key] = (value as { [key: string]: unknown })[key];
          return sorted;
        }, {})
    : value;

export const downloadUrl = (url: string, filename: string) => {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;

  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
};

export const downloadBlob = (data: Blob, filename: string) => downloadUrl(URL.createObjectURL(data), filename);

export const downloadJson = (data: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(data, jsonReplacer, 2)], { type: 'application/json' });
  const downloadKey = filename;
  downloadManager.add(downloadKey, blob.size);
  downloadManager.update(downloadKey, blob.size);
  downloadBlob(blob, downloadKey);
  setTimeout(() => downloadManager.clear(downloadKey), 5000);
};

export const oauth = {
  isCallback: (location: Location) => {
    const search = location.search;
    return search.includes('code=') || search.includes('error=');
  },
  isAutoLaunchDisabled: (location: Location) => {
    const values = ['autoLaunch=0', 'password=1', 'password=true'];
    for (const value of values) {
      if (location.search.includes(value)) {
        return true;
      }
    }
    return false;
  },
  isAutoLaunchEnabled: (location: Location) => {
    const value = 'autoLaunch=1';
    return location.search.includes(value);
  },
  authorize: async (location: Location) => {
    const $t = get(t);
    try {
      const redirectUri = location.href.split('?', 1)[0];
      const { url } = await startOAuth({ oAuthConfigDto: { redirectUri } });
      globalThis.location.assign(url);
      return true;
    } catch (error) {
      handleError(error, $t('errors.unable_to_login_with_oauth'));
      return false;
    }
  },
  login: (location: Location) => {
    return finishOAuth({ oAuthCallbackDto: { url: location.href } });
  },
  link: (location: Location) => {
    return linkOAuthAccount({ oAuthCallbackDto: { url: location.href } });
  },
  unlink: () => {
    return unlinkOAuthAccount();
  },
};

export const findLocale = (code: string | undefined) => {
  const language = locales.find((lang) => lang.code === code);
  return {
    code: language?.code,
    name: language?.name,
  };
};

export const asyncTimeout = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const handlePromiseError = <T>(promise: Promise<T>): void => {
  promise.catch((error) => console.error(`[utils.ts]:handlePromiseError ${error}`, error));
};

export const memoryLaneTitle = derived(t, ($t) => {
  return (memory: MemoryResponseDto) => {
    const now = new Date();
    if (memory.type === MemoryType.OnThisDay) {
      return $t('years_ago', { values: { years: now.getFullYear() - memory.data.year } });
    }

    return $t('unknown');
  };
});

export const withError = async <T>(fn: () => Promise<T>): Promise<[undefined, T] | [unknown, undefined]> => {
  try {
    const result = await fn();
    return [undefined, result];
  } catch (error) {
    return [error, undefined];
  }
};

// eslint-disable-next-line unicorn/prefer-code-point
export const decodeBase64 = (data: string) => Uint8Array.from(atob(data), (c) => c.charCodeAt(0));

export function createDateFormatter(localeCode: string | undefined): DateFormatter {
  return {
    formatDate: (date: Date): string =>
      date.toLocaleString(localeCode, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),

    formatTime: (date: Date): string =>
      date.toLocaleString(localeCode, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),

    formatDateTime: (date: Date): string => {
      const formattedDate = date.toLocaleString(localeCode, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const formattedTime = date.toLocaleString(localeCode, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return `${formattedDate} ${formattedTime}`;
    },
  };
}

export const semverToName = ({ major, minor, patch, prerelease }: ServerVersionResponseDto) =>
  `v${major}.${minor}.${patch}${prerelease === null ? '' : `-rc.${prerelease}`}`;

export const withoutIcons = (actions: ActionItem[]): ActionItem[] =>
  actions.map((action) => ({ ...action, icon: undefined }));

export const isEnabled = ({ $if }: IfLike) => $if?.() ?? true;

export const transformToTitleCase = (text: string) => {
  if (text.length === 0) {
    return text;
  }
  if (text.length === 1) {
    return text.charAt(0).toUpperCase();
  }

  let result = '';
  for (const word of text.toLowerCase().split(' ')) {
    result += word.charAt(0).toUpperCase() + word.slice(1) + ' ';
  }
  return result.trim();
};

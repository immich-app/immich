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

export class ApiError extends Error {
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
      if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
        unsubscribe();
        resolve({ data: xhr.response as T, status: xhr.status });
      } else {
        unsubscribe();
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

interface StreamingUploadRequestOptions {
  url: string;
  method?: 'POST' | 'PUT';
  data: FormData;
  onUploadProgress?: (progress: { loaded: number; total: number }) => void;
}

let streamingUploadSupport: boolean | undefined;

export const supportsStreamingUpload = (): boolean => {
  if (streamingUploadSupport === undefined) {
    try {
      let duplexAccessed = false;
      const hasContentType = new Request('https://localhost/', {
        body: new ReadableStream(),
        method: 'POST',
        get duplex() {
          duplexAccessed = true;
          return 'half';
        },
      } as RequestInit).headers.has('content-type');
      streamingUploadSupport = duplexAccessed && !hasContentType;
    } catch {
      streamingUploadSupport = false;
    }
  }

  return streamingUploadSupport;
};

const encoder = new TextEncoder();

// per RFC 2388, quotes and newlines in names/filenames are percent-encoded
const escapeMultipartValue = (value: string) =>
  value.replaceAll('\r', '%0D').replaceAll('\n', '%0A').replaceAll('"', '%22');

export const buildMultipartParts = (data: FormData, boundary: string): Array<Uint8Array | File> => {
  const parts: Array<Uint8Array | File> = [];
  for (const [name, value] of data) {
    const disposition = `--${boundary}\r\nContent-Disposition: form-data; name="${escapeMultipartValue(name)}"`;
    if (typeof value === 'string') {
      parts.push(encoder.encode(`${disposition}\r\n\r\n${value}\r\n`));
    } else {
      parts.push(
        encoder.encode(
          `${disposition}; filename="${escapeMultipartValue(value.name)}"\r\nContent-Type: ${value.type || 'application/octet-stream'}\r\n\r\n`,
        ),
        value,
        encoder.encode('\r\n'),
      );
    }
  }

  parts.push(encoder.encode(`--${boundary}--\r\n`));
  return parts;
};

async function* generateMultipartChunks(parts: Array<Uint8Array | File>) {
  for (const part of parts) {
    if (part instanceof Uint8Array) {
      yield part;
      continue;
    }

    const reader = part.stream().getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      yield value;
    }
  }
}

// Streams the multipart body via fetch() instead of XHR, so the request goes out without a
// Content-Length header. Proxies that enforce a maximum request body size based on that header
// (e.g. Cloudflare's 100 MB limit) let streamed requests through — the same mechanism the mobile
// app relies on for large uploads. Chromium only allows request streaming over HTTP/2 or later;
// on an HTTP/1.1 connection the fetch rejects with a TypeError before anything is sent.
export const uploadRequestStreaming = async <T>(
  options: StreamingUploadRequestOptions,
): Promise<{ data: T; status: number }> => {
  const { url, data, onUploadProgress: onProgress } = options;

  // crypto.randomUUID() is unavailable in non-secure contexts (plain-http deployments)
  const boundary = `----immich-multipart-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  const parts = buildMultipartParts(data, boundary);
  const total = parts.reduce((size, part) => size + (part instanceof Uint8Array ? part.byteLength : part.size), 0);
  const chunks = generateMultipartChunks(parts);
  let loaded = 0;

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await chunks.next();
      if (done) {
        controller.close();
        return;
      }

      loaded += value.byteLength;
      onProgress?.({ loaded, total });
      controller.enqueue(value);
    },
    cancel() {
      void chunks.return(undefined);
    },
  });

  const abortController = new AbortController();
  const unsubscribe = trackUpload(() => abortController.abort());

  try {
    const response = await fetch(url, {
      method: options.method || 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body,
      signal: abortController.signal,
      duplex: 'half',
    } as RequestInit);

    if (response.status < 200 || response.status >= 300) {
      throw new ApiError(response.statusText, response.status, await response.text());
    }

    return { data: (await response.json()) as T, status: response.status };
  } finally {
    unsubscribe();
  }
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
      const redirectUri = location.href.split('?')[0];
      const { url } = await startOAuth({ oAuthConfigDto: { redirectUri } });
      globalThis.location.href = url;
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
  } else if (text.length === 1) {
    return text.charAt(0).toUpperCase();
  }

  let result = '';
  for (const word of text.toLowerCase().split(' ')) {
    result += word.charAt(0).toUpperCase() + word.slice(1) + ' ';
  }
  return result.trim();
};

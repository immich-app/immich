import { defaultLang, langs, locales } from '$lib/constants';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { alwaysLoadOriginalFile, lang } from '$lib/stores/preferences.store';
import { isWebCompatibleImage } from '$lib/utils/asset-utils';
import { handleError } from '$lib/utils/handle-error';
import {
  AssetJobName,
  AssetMediaSize,
  AssetTypeEnum,
  MemoryType,
  QueueName,
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
import { toastManager } from '@immich/ui';
import { mdiCogRefreshOutline, mdiDatabaseRefreshOutline, mdiHeadSyncOutline, mdiImageRefreshOutline } from '@mdi/js';
import { init, register, t } from 'svelte-i18n';
import { derived, get } from 'svelte/store';

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
    register(code, loader);
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

export const uploadRequest = async <T>(options: UploadRequestOptions): Promise<{ data: T; status: number }> => {
  const { onUploadProgress: onProgress, data, url } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.addEventListener('error', (error) => reject(error));
    xhr.addEventListener('load', () => {
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

export const getQueueName = derived(t, ($t) => {
  return (name: QueueName) => {
    const names: Record<QueueName, string> = {
      [QueueName.ThumbnailGeneration]: $t('admin.thumbnail_generation_job'),
      [QueueName.MetadataExtraction]: $t('admin.metadata_extraction_job'),
      [QueueName.Sidecar]: $t('admin.sidecar_job'),
      [QueueName.SmartSearch]: $t('admin.machine_learning_smart_search'),
      [QueueName.DuplicateDetection]: $t('admin.machine_learning_duplicate_detection'),
      [QueueName.FaceDetection]: $t('admin.face_detection'),
      [QueueName.FacialRecognition]: $t('admin.machine_learning_facial_recognition'),
      [QueueName.VideoConversion]: $t('admin.video_conversion_job'),
      [QueueName.StorageTemplateMigration]: $t('admin.storage_template_migration'),
      [QueueName.Migration]: $t('admin.migration_job'),
      [QueueName.BackgroundTask]: $t('admin.background_task_job'),
      [QueueName.Search]: $t('search'),
      [QueueName.Library]: $t('external_libraries'),
      [QueueName.Notifications]: $t('notifications'),
      [QueueName.BackupDatabase]: $t('admin.backup_database'),
      [QueueName.Ocr]: $t('admin.machine_learning_ocr'),
      [QueueName.Workflow]: $t('workflows'),
    };

    return names[name];
  };
});

let _sharedLink: SharedLinkResponseDto | undefined;

export const setSharedLink = (sharedLink: SharedLinkResponseDto) => (_sharedLink = sharedLink);
export const getSharedLink = (): SharedLinkResponseDto | undefined => _sharedLink;

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

type AssetUrlOptions = { id: string; cacheKey?: string | null };

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
    return getAssetThumbnailUrl({ id, size: AssetMediaSize.Preview, cacheKey });
  }
  const targetSize = targetImageSize(asset, forceOriginal);
  return targetSize === 'original'
    ? getAssetOriginalUrl({ id, cacheKey })
    : getAssetThumbnailUrl({ id, size: targetSize, cacheKey });
};

const forceUseOriginal = (asset: AssetResponseDto) => {
  return asset.type === AssetTypeEnum.Image && asset.duration && !asset.duration.includes('0:00:00.000');
};

export const targetImageSize = (asset: AssetResponseDto, forceOriginal: boolean) => {
  if (forceOriginal || get(alwaysLoadOriginalFile) || forceUseOriginal(asset)) {
    return isWebCompatibleImage(asset) ? 'original' : AssetMediaSize.Fullsize;
  }
  return AssetMediaSize.Preview;
};

export const getAssetOriginalUrl = (options: string | AssetUrlOptions) => {
  if (typeof options === 'string') {
    options = { id: options };
  }
  const { id, cacheKey } = options;
  return createUrl(getAssetOriginalPath(id), { ...authManager.params, c: cacheKey });
};

export const getAssetThumbnailUrl = (options: string | (AssetUrlOptions & { size?: AssetMediaSize })) => {
  if (typeof options === 'string') {
    options = { id: options };
  }
  const { id, size, cacheKey } = options;
  return createUrl(getAssetThumbnailPath(id), { ...authManager.params, size, c: cacheKey });
};

export const getAssetPlaybackUrl = (options: string | AssetUrlOptions) => {
  if (typeof options === 'string') {
    options = { id: options };
  }
  const { id, cacheKey } = options;
  return createUrl(getAssetPlaybackPath(id), { ...authManager.params, c: cacheKey });
};

export const getProfileImageUrl = (user: UserResponseDto) =>
  createUrl(getUserProfileImagePath(user.id), { updatedAt: user.profileChangedAt });

export const getPeopleThumbnailUrl = (person: PersonResponseDto, updatedAt?: string) =>
  createUrl(getPeopleThumbnailPath(person.id), { updatedAt: updatedAt ?? person.updatedAt });

export const getAssetJobName = derived(t, ($t) => {
  return (job: AssetJobName) => {
    const names: Record<AssetJobName, string> = {
      [AssetJobName.RefreshFaces]: $t('refresh_faces'),
      [AssetJobName.RefreshMetadata]: $t('refresh_metadata'),
      [AssetJobName.RegenerateThumbnail]: $t('refresh_thumbnails'),
      [AssetJobName.TranscodeVideo]: $t('refresh_encoded_videos'),
    };

    return names[job];
  };
});

export const getAssetJobMessage = derived(t, ($t) => {
  return (job: AssetJobName) => {
    const messages: Record<AssetJobName, string> = {
      [AssetJobName.RefreshFaces]: $t('refreshing_faces'),
      [AssetJobName.RefreshMetadata]: $t('refreshing_metadata'),
      [AssetJobName.RegenerateThumbnail]: $t('regenerating_thumbnails'),
      [AssetJobName.TranscodeVideo]: $t('refreshing_encoded_video'),
    };

    return messages[job];
  };
});

export const getAssetJobIcon = (job: AssetJobName) => {
  const names: Record<AssetJobName, string> = {
    [AssetJobName.RefreshFaces]: mdiHeadSyncOutline,
    [AssetJobName.RefreshMetadata]: mdiDatabaseRefreshOutline,
    [AssetJobName.RegenerateThumbnail]: mdiImageRefreshOutline,
    [AssetJobName.TranscodeVideo]: mdiCogRefreshOutline,
  };

  return names[job];
};

export const copyToClipboard = async (secret: string) => {
  const $t = get(t);

  try {
    await navigator.clipboard.writeText(secret);
    toastManager.info($t('copied_to_clipboard'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_copy_to_clipboard'));
  }
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

export const getReleaseType = (
  current: ServerVersionResponseDto,
  newVersion: ServerVersionResponseDto,
): 'major' | 'minor' | 'patch' | 'none' => {
  if (current.major !== newVersion.major) {
    return 'major';
  }

  if (current.minor !== newVersion.minor) {
    return 'minor';
  }

  if (current.patch !== newVersion.patch) {
    return 'patch';
  }

  return 'none';
};

export const semverToName = ({ major, minor, patch }: ServerVersionResponseDto) => `v${major}.${minor}.${patch}`;

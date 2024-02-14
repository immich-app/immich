import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { defaults } from '@immich/sdk';
import { AssetJobName, JobName, ThumbnailFormat, common } from '@immich/sdk/axios';
import { get } from 'svelte/store';

interface UpdateParamAction {
  param: string;
  value: string;
  add: boolean;
}

const getParamValues = (param: string) =>
  new Set((get(page).url.searchParams.get(param) || '').split(' ').filter((x) => x !== ''));

export const hasParamValue = (param: string, value: string) => getParamValues(param).has(value);

export const updateParamList = async ({ param, value, add }: UpdateParamAction) => {
  const values = getParamValues(param);

  if (add) {
    values.add(value);
  } else {
    values.delete(value);
  }

  const searchParams = new URLSearchParams(get(page).url.searchParams);
  searchParams.set(param, [...values.values()].join(' '));

  if (values.size === 0) {
    searchParams.delete(param);
  }

  await goto(`?${searchParams.toString()}`, { replaceState: true, noScroll: true, keepFocus: true });
};

export const getJobName = (jobName: JobName) => {
  const names: Record<JobName, string> = {
    [JobName.ThumbnailGeneration]: 'Generate Thumbnails',
    [JobName.MetadataExtraction]: 'Extract Metadata',
    [JobName.Sidecar]: 'Sidecar Metadata',
    [JobName.SmartSearch]: 'Smart Search',
    [JobName.FaceDetection]: 'Face Detection',
    [JobName.FacialRecognition]: 'Facial Recognition',
    [JobName.VideoConversion]: 'Transcode Videos',
    [JobName.StorageTemplateMigration]: 'Storage Template Migration',
    [JobName.Migration]: 'Migration',
    [JobName.BackgroundTask]: 'Background Tasks',
    [JobName.Search]: 'Search',
    [JobName.Library]: 'Library',
  };

  return names[jobName];
};

let _key: string | undefined;

export const setKey = (key: string) => {
  _key = key;
};

export const getKey = (): string | undefined => {
  return _key;
};

export const isSharedLink = () => {
  return !!_key;
};

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

  return defaults.baseUrl + common.toPathString(url);
};

export const getAssetFileUrl = (...[assetId, isWeb, isThumb]: [string, boolean, boolean]) => {
  const path = `/asset/file/${assetId}`;
  return createUrl(path, { isThumb, isWeb, key: getKey() });
};

export const getAssetThumbnailUrl = (...[assetId, format]: [string, ThumbnailFormat | undefined]) => {
  const path = `/asset/thumbnail/${assetId}`;
  return createUrl(path, { format, key: getKey() });
};

export const getProfileImageUrl = (...[userId]: [string]) => {
  const path = `/user/profile-image/${userId}`;
  return createUrl(path);
};

export const getPeopleThumbnailUrl = (personId: string) => {
  const path = `/person/${personId}/thumbnail`;
  return createUrl(path);
};

export const getAssetJobName = (job: AssetJobName) => {
  const names: Record<AssetJobName, string> = {
    [AssetJobName.RefreshMetadata]: 'Refresh metadata',
    [AssetJobName.RegenerateThumbnail]: 'Refresh thumbnails',
    [AssetJobName.TranscodeVideo]: 'Refresh encoded videos',
  };

  return names[job];
};

export const getAssetJobMessage = (job: AssetJobName) => {
  const messages: Record<AssetJobName, string> = {
    [AssetJobName.RefreshMetadata]: 'Refreshing metadata',
    [AssetJobName.RegenerateThumbnail]: `Regenerating thumbnails`,
    [AssetJobName.TranscodeVideo]: `Refreshing encoded video`,
  };

  return messages[job];
};

import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { JobName } from '@immich/sdk/axios';
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

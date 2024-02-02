import { derived, writable } from 'svelte/store';

export interface DownloadProgress {
  progress: number;
  total: number;
  percentage: number;
  abort: AbortController | null;
}

export const downloadAssets = writable<Record<string, DownloadProgress>>({});

export const isDownloading = derived(downloadAssets, ($downloadAssets) => {
  if (Object.keys($downloadAssets).length === 0) {
    return false;
  }

  return true;
});

const update = (key: string, value: Partial<DownloadProgress> | null) => {
  downloadAssets.update((state) => {
    const newState = { ...state };

    if (value === null) {
      delete newState[key];
      return newState;
    }

    if (!newState[key]) {
      newState[key] = { progress: 0, total: 0, percentage: 0, abort: null };
    }

    const item = newState[key];
    Object.assign(item, value);
    item.percentage = Math.min(Math.floor((item.progress / item.total) * 100), 100);

    return newState;
  });
};

export const downloadManager = {
  add: (key: string, total: number, abort?: AbortController) => update(key, { total, abort }),
  clear: (key: string) => update(key, null),
  update: (key: string, progress: number, total?: number) => {
    const download: Partial<DownloadProgress> = { progress };
    if (total !== undefined) {
      download.total = total;
    }
    update(key, download);
  },
};

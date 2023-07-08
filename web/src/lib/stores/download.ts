import { derived, writable } from 'svelte/store';

export const downloadAssets = writable<Record<string, number>>({});

export const isDownloading = derived(downloadAssets, ($downloadAssets) => {
  if (Object.keys($downloadAssets).length == 0) {
    return false;
  }

  return true;
});

const update = (key: string, value: number | null) => {
  downloadAssets.update((state) => {
    const newState = { ...state };
    if (value === null) {
      delete newState[key];
    } else {
      newState[key] = value;
    }
    return newState;
  });
};

export const clearDownload = (key: string) => update(key, null);
export const updateDownload = (key: string, value: number) => update(key, value);

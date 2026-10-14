import { SvelteMap } from 'svelte/reactivity';

export interface DownloadState {
  url: string;
  assetIds: string[];
  archiveName: string;
  total: number;
  downloaded: boolean;
  archiveIndex?: number;
  archiveTotal?: number;
}

class DownloadManager {
  assets = new SvelteMap<string, DownloadState>();

  isDownloading = $derived(this.assets.size > 0);

  archiveProgress = $derived.by(() => {
    const values = Object.values(this.assets);
    const current = values.find((value) => value.archiveTotal);
    return current ? { index: current.archiveIndex ?? 0, total: current.archiveTotal ?? 0 } : null;
  });

  add(
    key: string,
    url: string,
    assetIds: string[],
    archiveName: string,
    total: number,
    archiveIndex = 0,
    archiveTotal = 0,
  ) {
    this.assets.set(key, { url, assetIds, archiveName, total, downloaded: false, archiveIndex, archiveTotal });
  }

  clearAll() {
    this.assets.clear();
  }

  markDownloaded(key: string) {
    const state = this.assets.get(key);
    if (state) {
      this.assets.set(key, { ...state, downloaded: true });
    }
  }
}

export const downloadManager = new DownloadManager();

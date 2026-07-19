import { SvelteMap } from 'svelte/reactivity';

export interface DownloadState {
  url: string;
  payload: unknown;
  total: number;
  downloaded: boolean;
}

class DownloadManager {
  assets = new SvelteMap<string, DownloadState>();

  isDownloading = $derived(this.assets.size > 0);

  add(key: string, url: string, payload: unknown, total: number) {
    this.assets.set(key, { url, payload, total, downloaded: false });
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

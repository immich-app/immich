export interface DownloadState {
  url: string;
  payload: unknown;
  total: number;
  downloaded: boolean;
}

class DownloadManager {
  assets = $state<Record<string, DownloadState>>({});

  isDownloading = $derived(Object.keys(this.assets).length > 0);

  #update(key: string, value: Partial<DownloadState> | null) {
    if (value === null) {
      delete this.assets[key];
      return;
    }

    if (!this.assets[key]) {
      this.assets[key] = { url: '', payload: undefined, total: 0, downloaded: false };
    }

    const item = this.assets[key];
    Object.assign(item, value);
  }

  add(key: string, url: string, payload: unknown, total: number) {
    this.#update(key, { url, payload, total });
  }

  clearAll() {
    this.assets = {};
  }

  markDownloaded(key: string) {
    this.#update(key, { downloaded: true });
  }
}

export const downloadManager = new DownloadManager();

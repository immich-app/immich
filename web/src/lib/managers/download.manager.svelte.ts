export interface DownloadProgress {
  progress: number;
  total: number;
  percentage: number;
  abort: AbortController | null;
}

class DownloadManager {
  #assets = $state<Record<string, DownloadProgress>>({});
  #isDownloading = $derived(Object.keys(this.#assets).length > 0);

  #update(key: string, value: Partial<DownloadProgress>) {
    if (!this.#assets[key]) {
      this.#assets[key] = { progress: 0, total: 0, percentage: 0, abort: null };
    }

    const item = this.#assets[key];
    Object.assign(item, value);
    item.percentage = Math.min(Math.floor((item.progress / item.total) * 100), 100);
  }

  get assets() {
    return this.#assets;
  }

  get isDownloading() {
    return this.#isDownloading;
  }

  add(key: string, total: number, abort?: AbortController) {
    this.#update(key, { total, abort });
  }

  clear(key: string) {
    delete this.#assets[key];
  }

  update(key: string, progress: number, total?: number) {
    const download: Partial<DownloadProgress> = { progress };
    if (total !== undefined) {
      download.total = total;
    }
    this.#update(key, download);
  }
}

export const downloadManager = new DownloadManager();

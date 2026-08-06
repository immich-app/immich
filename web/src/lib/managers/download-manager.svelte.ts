export interface DownloadProgress {
  progress: number;
  total: number;
  percentage: number;
  abort: AbortController | null;
  archiveIndex?: number;
  archiveTotal?: number;
}

class DownloadManager {
  assets = $state<Record<string, DownloadProgress>>({});

  isDownloading = $derived(Object.keys(this.assets).length > 0);

  archiveProgress = $derived.by(() => {
    const values = Object.values(this.assets);
    const current = values.find((value) => value.archiveTotal);
    return current ? { index: current.archiveIndex ?? 0, total: current.archiveTotal ?? 0 } : null;
  });

  #update(key: string, value: Partial<DownloadProgress> | null) {
    if (value === null) {
      delete this.assets[key];
      return;
    }

    if (!Object.hasOwn(this.assets, key)) {
      this.assets[key] = { progress: 0, total: 0, percentage: 0, abort: null, archiveIndex: 0, archiveTotal: 0 };
    }

    const item = this.assets[key];
    Object.assign(item, value);
    item.percentage = Math.min(Math.floor((item.progress / item.total) * 100), 100);
  }

  add(key: string, total: number, abort?: AbortController, archiveIndex = 0, archiveTotal = 0) {
    this.#update(key, { total, abort, archiveIndex, archiveTotal });
  }

  clear(key: string) {
    this.#update(key, null);
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

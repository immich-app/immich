import { WatchOptions } from 'chokidar';
import { StorageCore } from 'src/cores/storage.core';
import { IStorageRepository, WatchEvents } from 'src/interfaces/storage.interface';
import { Mocked, vitest } from 'vitest';

interface MockWatcherOptions {
  items?: Array<{ event: 'change' | 'add' | 'unlink' | 'error'; value: string }>;
  close?: () => Promise<void>;
}

export const makeMockWatcher =
  ({ items, close }: MockWatcherOptions) =>
  (paths: string[], options: WatchOptions, events: Partial<WatchEvents>) => {
    events.onReady?.();
    for (const item of items || []) {
      switch (item.event) {
        case 'add': {
          events.onAdd?.(item.value);
          break;
        }
        case 'change': {
          events.onChange?.(item.value);
          break;
        }
        case 'unlink': {
          events.onUnlink?.(item.value);
          break;
        }
        case 'error': {
          events.onError?.(new Error(item.value));
        }
      }
    }

    if (close) {
      return () => close();
    }

    return () => Promise.resolve();
  };

export const newStorageRepositoryMock = (reset = true): Mocked<IStorageRepository> => {
  if (reset) {
    StorageCore.reset();
  }

  return {
    createZipStream: vitest.fn(),
    createReadStream: vitest.fn(),
    readFile: vitest.fn(),
    createFile: vitest.fn(),
    createOrOverwriteFile: vitest.fn(),
    overwriteFile: vitest.fn(),
    unlink: vitest.fn(),
    unlinkDir: vitest.fn().mockResolvedValue(true),
    removeEmptyDirs: vitest.fn(),
    checkFileExists: vitest.fn(),
    mkdirSync: vitest.fn(),
    checkDiskUsage: vitest.fn(),
    readdir: vitest.fn(),
    realpath: vitest.fn().mockImplementation((filepath: string) => Promise.resolve(filepath)),
    stat: vitest.fn(),
    crawl: vitest.fn(),
    walk: vitest.fn().mockImplementation(async function* () {}),
    rename: vitest.fn(),
    copyFile: vitest.fn(),
    utimes: vitest.fn(),
    watch: vitest.fn().mockImplementation(makeMockWatcher({})),
  };
};

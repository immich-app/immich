import { IStorageRepository, StorageCore, StorageEventType, WatchEvents } from '@app/domain';
import { WatchOptions } from 'chokidar';

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
        case StorageEventType.ADD: {
          events.onAdd?.(item.value);
          break;
        }
        case StorageEventType.CHANGE: {
          events.onChange?.(item.value);
          break;
        }
        case StorageEventType.UNLINK: {
          events.onUnlink?.(item.value);
          break;
        }
        case StorageEventType.ERROR: {
          events.onError?.(new Error(item.value));
        }
      }
    }

    if (close) {
      return () => close();
    }

    return () => Promise.resolve();
  };

export const newStorageRepositoryMock = (reset = true): jest.Mocked<IStorageRepository> => {
  if (reset) {
    StorageCore.reset();
  }

  return {
    createZipStream: jest.fn(),
    createReadStream: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
    unlinkDir: jest.fn().mockResolvedValue(true),
    removeEmptyDirs: jest.fn(),
    checkFileExists: jest.fn(),
    mkdirSync: jest.fn(),
    checkDiskUsage: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    crawl: jest.fn(),
    rename: jest.fn(),
    copyFile: jest.fn(),
    utimes: jest.fn(),
    watch: jest.fn().mockImplementation(makeMockWatcher({})),
  };
};

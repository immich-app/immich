import { vitest } from 'vitest';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { StorageRepository } from 'src/repositories/storage.repository.js';
import { automock } from 'test/utils.js';

const mocks = vitest.hoisted(() => {
  const watcher = {
    close: vitest.fn(),
    on: vitest.fn(),
  };
  watcher.on.mockReturnValue(watcher);

  return { watch: vitest.fn(() => watcher), watcher, statfs: vitest.fn() };
});

vitest.mock('chokidar', () => ({ watch: mocks.watch }));

vitest.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, default: { ...actual.default, statfs: mocks.statfs } };
});

const getHandler = (event: string) => {
  const handler = mocks.watcher.on.mock.calls.find(([name]) => name === event)?.[1];
  if (!handler) {
    throw new Error(`Missing ${event} handler`);
  }
  return handler;
};

describe(StorageRepository.name, () => {
  let sut: StorageRepository;

  beforeEach(() => {
    // eslint-disable-next-line no-sparse-arrays
    sut = new StorageRepository(automock(LoggingRepository, { args: [, { getEnv: () => ({}) }], strict: false }));
    mocks.watch.mockReset().mockReturnValue(mocks.watcher);
    mocks.statfs.mockReset();
    mocks.watcher.on.mockReset().mockReturnValue(mocks.watcher);
    mocks.watcher.close.mockReset().mockResolvedValue(undefined);
  });

  describe('watch', () => {
    it('should register event handlers and close the watcher', async () => {
      const onReady = vitest.fn();
      const onAdd = vitest.fn();
      const onChange = vitest.fn();
      const onUnlink = vitest.fn();
      const onError = vitest.fn();
      const close = sut.watch(['/photos'], {}, { onAdd, onChange, onError, onReady, onUnlink });

      expect(mocks.watch).toHaveBeenCalledWith(
        ['/photos'],
        expect.objectContaining({ followSymlinks: false, ignored: expect.any(Function) }),
      );

      const error = new Error('watch error');
      getHandler('ready')();
      getHandler('add')('/photos/add.jpg');
      getHandler('change')('/photos/change.jpg');
      getHandler('unlink')('/photos/unlink.jpg');
      getHandler('error')(error);

      expect(onReady).toHaveBeenCalledWith();
      expect(onAdd).toHaveBeenCalledWith('/photos/add.jpg');
      expect(onChange).toHaveBeenCalledWith('/photos/change.jpg');
      expect(onUnlink).toHaveBeenCalledWith('/photos/unlink.jpg');
      expect(onError).toHaveBeenCalledWith(error);

      await close();
      expect(mocks.watcher.close).toHaveBeenCalledWith();
    });

    it('should convert ignored glob arrays to a case-insensitive matcher', () => {
      sut.watch(['/photos'], { ignored: ['**/excluded/**'] }, {});
      const [, options] = mocks.watch.mock.lastCall as unknown as [string[], { ignored?: unknown }];
      const ignored = options.ignored as (path: string) => boolean;

      expect(typeof ignored).toBe('function');
      expect(ignored('/photos/EXCLUDED/photo.jpg')).toBe(true);
      expect(ignored('/photos/included/photo.jpg')).toBe(false);
    });

    it('should tolerate missing event callbacks', () => {
      sut.watch(['/photos'], {}, {});

      expect(() => {
        getHandler('ready')();
        getHandler('add')('/photos/add.jpg');
        getHandler('change')('/photos/change.jpg');
        getHandler('unlink')('/photos/unlink.jpg');
        getHandler('error')(new Error('watch error'));
      }).not.toThrow();
    });
  });

  describe('checkDiskUsage', () => {
    it('should return disk usage in bytes', async () => {
      mocks.statfs.mockResolvedValue({
        type: 0,
        bsize: 4096,
        blocks: 300,
        bfree: 200,
        bavail: 100,
        files: 0,
        ffree: 0,
      });

      await expect(sut.checkDiskUsage('/photos')).resolves.toEqual({
        available: 409_600,
        free: 819_200,
        total: 1_228_800,
      });
      expect(mocks.statfs).toHaveBeenCalledWith('/photos');
    });
  });
});

import { vitest } from 'vitest';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { StorageRepository } from 'src/repositories/storage.repository.js';
import { automock, makeStream } from 'test/utils.js';

const mocks = vitest.hoisted(() => {
  const watcher = {
    close: vitest.fn(),
    on: vitest.fn(),
  };
  watcher.on.mockReturnValue(watcher);

  return { watch: vitest.fn(() => watcher), watcher, walkFiles: vitest.fn() };
});

vitest.mock('chokidar', () => ({ watch: mocks.watch }));
vitest.mock('@immich/walkrs', () => ({ walk: mocks.walkFiles }));

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
    mocks.watcher.on.mockReset().mockReturnValue(mocks.watcher);
    mocks.watcher.close.mockReset().mockResolvedValue(undefined);
    mocks.walkFiles.mockReset();
  });

  describe('walkWithMetadata', () => {
    it('preserves sidecar and metadata alignment while rebatching', async () => {
      mocks.walkFiles.mockReturnValue(
        makeStream([
          {
            files: ['/photos/a.jpg', '/photos/b.jpg'],
            size: [0, 0],
            modified: [1, 2],
            sidecars: ['/photos/a.xmp', null],
            errors: [],
          },
          { files: ['/photos/c.jpg'], size: [0], modified: [3], sidecars: [{ status: 'unknown' }], errors: [] },
        ]),
      );
      const batches = await Array.fromAsync(sut.walkWithMetadata({ pathsToWalk: ['/photos'], take: 2 }));
      expect(batches).toEqual([
        [
          { path: '/photos/a.jpg', modified: 1, sidecar: '/photos/a.xmp' },
          { path: '/photos/b.jpg', modified: 2, sidecar: null },
        ],
        [{ path: '/photos/c.jpg', modified: 3, sidecar: { status: 'unknown' } }],
      ]);
      expect(mocks.walkFiles).toHaveBeenCalledWith(
        expect.objectContaining({ includeMetadata: true, includeSidecars: true, followLinks: true }),
      );
    });

    it('rejects unaligned discovery columns', async () => {
      mocks.walkFiles.mockReturnValue(
        makeStream([{ files: ['/photos/a.jpg'], modified: [], sidecars: [null], errors: [] }]),
      );
      await expect(sut.walkWithMetadata({ pathsToWalk: ['/photos'], take: 2 }).next()).rejects.toThrow('unaligned');
    });

    it('rejects an invalid batch limit before starting a walk', async () => {
      await expect(sut.walkWithMetadata({ pathsToWalk: ['/photos'], take: 0 }).next()).rejects.toThrow(
        'positive safe integer',
      );
      expect(mocks.walkFiles).not.toHaveBeenCalled();
    });
  });

  describe('watch', () => {
    it('should register event handlers and close the watcher', async () => {
      const onReady = vitest.fn();
      const onAdd = vitest.fn();
      const onChange = vitest.fn();
      const onUnlink = vitest.fn();
      const onError = vitest.fn();
      const close = sut.watch(['/photos'], {}, { onAdd, onChange, onError, onReady, onUnlink });

      expect(mocks.watch).toHaveBeenCalledWith(['/photos'], expect.objectContaining({ ignored: expect.any(Function) }));

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
});

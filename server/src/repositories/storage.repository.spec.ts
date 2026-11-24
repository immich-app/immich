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

  return { watch: vitest.fn(() => watcher), watcher, walkOrdered: vitest.fn() };
});

vitest.mock('chokidar', () => ({ watch: mocks.watch }));
vitest.mock('@immich/walkrs', () => ({ walk: vitest.fn(), walkOrdered: mocks.walkOrdered }));

const onDisk = (walks: Record<string, string[][]>, errors: Record<string, string[]> = {}) =>
  mocks.walkOrdered.mockImplementation(({ path }: { path: string }) =>
    makeStream([
      { files: [], modified: [], errors: (errors[path] ?? []).map((message) => ({ message })) },
      ...(walks[path] ?? []).map((files) => ({ files, modified: files.map((file) => file.length), errors: [] })),
    ]),
  );

const collect = async (source: AsyncIterable<{ paths: string[]; modified: number[] }>) => {
  const paths: string[] = [];
  for await (const batch of source) {
    paths.push(...batch.paths);
  }
  return paths;
};

const getHandler = (event: string) => {
  const handler = mocks.watcher.on.mock.calls.find(([name]) => name === event)?.[1];
  if (!handler) {
    throw new Error(`Missing ${event} handler`);
  }
  return handler;
};

describe(StorageRepository.name, () => {
  let sut: StorageRepository;
  let logger: LoggingRepository;

  beforeEach(() => {
    // eslint-disable-next-line no-sparse-arrays
    logger = automock(LoggingRepository, { args: [, { getEnv: () => ({}) }], strict: false });
    sut = new StorageRepository(logger);
    mocks.walkOrdered.mockReset();
    mocks.watch.mockReset().mockReturnValue(mocks.watcher);
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

  describe('walkOrdered', () => {
    const options = { includeHidden: false, exclusionPatterns: ['**/raw/**'] };

    it('should walk disjoint import paths one after another in byte order', async () => {
      onDisk({ '/a': [['/a/x.jpg']], '/a-b': [['/a-b/x.jpg']], '/b': [['/b/x.jpg']] });

      await expect(collect(sut.walkOrdered({ pathsToCrawl: ['/b', '/a', '/a-b'], ...options }))).resolves.toEqual([
        '/a-b/x.jpg',
        '/a/x.jpg',
        '/b/x.jpg',
      ]);
      expect(mocks.walkOrdered).toHaveBeenCalledWith(expect.objectContaining({ path: '/a', ...options }));
    });

    it('should yield a file of nested import paths once', async () => {
      onDisk({ '/lib': [['/lib/a.jpg', '/lib/sub/b.jpg', '/lib/z.jpg']], '/lib/sub': [['/lib/sub/b.jpg']] });

      await expect(collect(sut.walkOrdered({ pathsToCrawl: ['/lib', '/lib/sub'], ...options }))).resolves.toEqual([
        '/lib/a.jpg',
        '/lib/sub/b.jpg',
        '/lib/z.jpg',
      ]);
    });

    it('should keep the files of a nested import path the outer walk skips', async () => {
      onDisk({ '/lib': [['/lib/a.jpg', '/lib/z.jpg']], '/lib/.hidden': [['/lib/.hidden/b.jpg']] });

      await expect(collect(sut.walkOrdered({ pathsToCrawl: ['/lib/.hidden', '/lib'], ...options }))).resolves.toEqual([
        '/lib/.hidden/b.jpg',
        '/lib/a.jpg',
        '/lib/z.jpg',
      ]);
    });

    it.each(['/lib/', '/lib//', '/lib/sub/..', '/lib/.'])(
      'should walk %s as the path stored assets use',
      async (pathToCrawl) => {
        onDisk({ '/lib': [['/lib/a.jpg']] });

        await expect(collect(sut.walkOrdered({ pathsToCrawl: [pathToCrawl, '/lib'], ...options }))).resolves.toEqual([
          '/lib/a.jpg',
        ]);
        expect(mocks.walkOrdered.mock.calls).toEqual([[expect.objectContaining({ path: '/lib' })]]);
      },
    );

    it('should log walk errors and keep walking', async () => {
      onDisk({ '/lib': [['/lib/a.jpg']] }, { '/lib': ['Permission denied'] });

      await expect(collect(sut.walkOrdered({ pathsToCrawl: ['/lib'], ...options }))).resolves.toEqual(['/lib/a.jpg']);
      expect(logger.warn).toHaveBeenCalledWith('Unable to walk: Permission denied');
    });

    it('should yield nothing without import paths', async () => {
      await expect(collect(sut.walkOrdered({ pathsToCrawl: [], ...options }))).resolves.toEqual([]);
      expect(mocks.walkOrdered).not.toHaveBeenCalled();
    });
  });
});

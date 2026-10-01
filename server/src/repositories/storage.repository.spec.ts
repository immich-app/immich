import { R_OK } from 'node:constants';
import { mkdir, mkdtempDisposable, stat, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { vitest } from 'vitest';
import { WalkOptionsDto } from 'src/dtos/library.dto.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { StorageRepository } from 'src/repositories/storage.repository.js';
import { automock } from 'test/utils.js';

const mocks = vitest.hoisted(() => {
  const watcher = {
    close: vitest.fn(),
    on: vitest.fn(),
  };
  watcher.on.mockReturnValue(watcher);

  return { watch: vitest.fn(() => watcher), watcher };
});

vitest.mock('chokidar', () => ({ watch: mocks.watch }));

const getHandler = (event: string) => {
  const handler = mocks.watcher.on.mock.calls.find(([name]) => name === event)?.[1];
  if (!handler) {
    throw new Error(`Missing ${event} handler`);
  }
  return handler;
};

interface Test {
  test: string;
  options: WalkOptionsDto;
  files: Record<string, boolean>;
}

const tests: Test[] = [
  {
    test: 'should return empty when crawling an empty path list',
    options: {
      pathsToWalk: [],
    },
    files: {},
  },
  {
    test: 'should crawl a single path',
    options: {
      pathsToWalk: ['/photos/'],
    },
    files: {
      '/photos/image.jpg': true,
    },
  },
  {
    test: 'should exclude by file extension',
    options: {
      pathsToWalk: ['/photos/'],
      exclusionPatterns: ['**/*.tif'],
    },
    files: {
      '/photos/image.jpg': true,
      '/photos/image.tif': false,
    },
  },
  {
    test: 'should exclude by file extension without case sensitivity',
    options: {
      pathsToWalk: ['/photos/'],
      exclusionPatterns: ['**/*.TIF'],
    },
    files: {
      '/photos/image.jpg': true,
      '/photos/image.tif': false,
    },
  },
  {
    test: 'should exclude by folder',
    options: {
      pathsToWalk: ['/photos/'],
      exclusionPatterns: ['**/raw/**'],
    },
    files: {
      '/photos/image.jpg': true,
      '/photos/raw/image.jpg': false,
      '/photos/raw2/image.jpg': true,
      '/photos/folder/raw/image.jpg': false,
      '/photos/crawl/image.jpg': true,
    },
  },
  {
    test: 'should crawl multiple paths',
    options: {
      pathsToWalk: ['/photos/', '/images/', '/albums/'],
    },
    files: {
      '/photos/image1.jpg': true,
      '/images/image2.jpg': true,
      '/albums/image3.jpg': true,
    },
  },
  {
    test: 'should crawl a single path without trailing slash',
    options: {
      pathsToWalk: ['/photos'],
    },
    files: {
      '/photos/image.jpg': true,
    },
  },
  {
    test: 'should crawl a single path',
    options: {
      pathsToWalk: ['/photos/'],
    },
    files: {
      '/photos/image.jpg': true,
      '/photos/subfolder/image1.jpg': true,
      '/photos/subfolder/image2.jpg': true,
      '/image1.jpg': false,
    },
  },
  {
    test: 'should filter file extensions',
    options: {
      pathsToWalk: ['/photos/'],
    },
    files: {
      '/photos/image.jpg': true,
      '/photos/image.txt': false,
      '/photos/1': false,
    },
  },
  {
    test: 'should include photo and video extensions',
    options: {
      pathsToWalk: ['/photos/', '/videos/'],
    },
    files: {
      '/photos/image.jpg': true,
      '/photos/image.jpeg': true,
      '/photos/image.heic': true,
      '/photos/image.heif': true,
      '/photos/image.png': true,
      '/photos/image.gif': true,
      '/photos/image.tif': true,
      '/photos/image.tiff': true,
      '/photos/image.webp': true,
      '/photos/image.dng': true,
      '/photos/image.nef': true,
      '/videos/video.mp4': true,
      '/videos/video.mov': true,
      '/videos/video.webm': true,
    },
  },
  {
    test: 'should check file extensions without case sensitivity',
    options: {
      pathsToWalk: ['/photos/'],
    },
    files: {
      '/photos/image.jpg': true,
      '/photos/image.Jpg': true,
      '/photos/image.jpG': true,
      '/photos/image.JPG': true,
      '/photos/image.jpEg': true,
      '/photos/image.TIFF': true,
      '/photos/image.tif': true,
      '/photos/image.dng': true,
      '/photos/image.NEF': true,
    },
  },
  {
    test: 'should normalize the path',
    options: {
      pathsToWalk: ['/photos/1/../2'],
    },
    files: {
      '/photos/1/image.jpg': false,
      '/photos/2/image.jpg': true,
    },
  },
  {
    test: 'should return absolute paths',
    options: {
      pathsToWalk: ['photos'],
    },
    files: {
      ['/photos/1.jpg']: true,
      ['/photos/2.jpg']: true,
      ['/other/3.jpg']: false,
    },
  },
  {
    test: 'should support special characters in paths',
    options: {
      pathsToWalk: ['/photos (new)'],
    },
    files: {
      ['/photos (new)/1.jpg']: true,
    },
  },
];

describe(StorageRepository.name, () => {
  let sut: StorageRepository;

  beforeEach(() => {
    // eslint-disable-next-line no-sparse-arrays
    sut = new StorageRepository(automock(LoggingRepository, { args: [, { getEnv: () => ({}) }], strict: false }));
    mocks.watch.mockReset().mockReturnValue(mocks.watcher);
    mocks.watcher.on.mockReset().mockReturnValue(mocks.watcher);
    mocks.watcher.close.mockReset().mockResolvedValue(undefined);
  });

  describe('walk filtering', () => {
    for (const { test, options, files } of tests) {
      it(test, async () => {
        await using tempDir = await mkdtempDisposable(join(tmpdir(), 'immich-storage-walk-'));
        const resolve = (file: string) => join(tempDir.path, file.replace(/^\//, ''));
        await Promise.all(
          Object.keys(files).map(async (file) => {
            const filename = resolve(file);
            await mkdir(dirname(filename), { recursive: true });
            await writeFile(filename, '');
          }),
        );

        const batches = await Array.fromAsync(
          sut.walk({ ...options, pathsToWalk: options.pathsToWalk.map((file) => resolve(file)) }),
        );
        const actual = batches.flatMap((batch) => batch.files);
        const expected = Object.entries(files)
          .filter((entry) => entry[1])
          .map(([file]) => resolve(file));

        expect(actual.toSorted((a, b) => a.localeCompare(b))).toEqual(expected.toSorted((a, b) => a.localeCompare(b)));
      });
    }
  });

  describe('walk', () => {
    it('should return absolute paths when walking a relative path', async () => {
      await using tempDir = await mkdtempDisposable(join(tmpdir(), 'immich-storage-walk-'));
      const filename = join(tempDir.path, 'photo.jpg');
      await writeFile(filename, 'photo');

      const batches = await Array.fromAsync(sut.walk({ pathsToWalk: [relative(process.cwd(), tempDir.path)] }));

      expect(batches.flatMap((batch) => batch.files)).toEqual([filename]);
      expect(batches[0]).toMatchObject({ size: null, modified: null, created: null, errors: [] });
    });

    it('should return size, modification time, and birth time aligned with paths', async () => {
      await using tempDir = await mkdtempDisposable(join(tmpdir(), 'immich-storage-metadata-'));
      const expected = new Map();
      for (const [name, content] of [
        ['empty.jpg', ''],
        ['photo.jpg', 'photo content'],
      ]) {
        const filename = join(tempDir.path, name);
        await writeFile(filename, content);
        await utimes(filename, new Date(1_700_000_000_123), new Date(1_700_000_000_123));
        const stats = await stat(filename, { bigint: true });
        expected.set(filename, {
          size: Number(stats.size),
          modified: Number(stats.mtimeNs / 1_000_000n),
          created: stats.birthtimeNs === 0n ? null : Number(stats.birthtimeNs / 1_000_000n),
        });
      }

      const actual = new Map();
      for await (const batch of sut.walk({ pathsToWalk: [tempDir.path], includeMetadata: true })) {
        expect(batch.errors).toEqual([]);
        expect(batch.size).toHaveLength(batch.files.length);
        expect(batch.modified).toHaveLength(batch.files.length);
        expect(batch.created).toHaveLength(batch.files.length);
        for (const [index, filename] of batch.files.entries()) {
          actual.set(filename, {
            size: batch.size![index],
            modified: batch.modified![index],
            created: batch.created![index],
          });
        }
      }

      expect(actual).toEqual(expected);
    });

    it.each([
      { exclusionPatterns: [] },
      { exclusionPatterns: ['**/*.xmp'] },
      { exclusionPatterns: ['**/excluded/**'] },
    ])('should only return assets and respect exclusions: $exclusionPatterns', async ({ exclusionPatterns }) => {
      await using tempDir = await mkdtempDisposable(join(tmpdir(), 'immich-storage-walk-'));
      const photos = join(tempDir.path, 'photos');
      await mkdir(join(photos, 'excluded'), { recursive: true });
      await Promise.all(
        ['photo.jpg', 'photo.nef', 'photo.jpg.xmp', 'photo.xmp', 'excluded/photo.jpg', 'excluded/photo.xmp'].map(
          (file) => writeFile(join(photos, file), ''),
        ),
      );

      const batches = await Array.fromAsync(sut.walk({ pathsToWalk: [photos], exclusionPatterns }));

      expect(batches.flatMap((batch) => batch.errors)).toEqual([]);
      expect(batches.flatMap((batch) => batch.files).toSorted((a, b) => a.localeCompare(b))).toEqual(
        [
          join(photos, 'photo.jpg'),
          join(photos, 'photo.nef'),
          ...(exclusionPatterns.includes('**/excluded/**') ? [] : [join(photos, 'excluded/photo.jpg')]),
        ].toSorted((a, b) => a.localeCompare(b)),
      );
    });
  });

  describe('checkFileExists', () => {
    it.for(['PHOTO.xmp', 'photo.XMP'])(
      'should not match %s with different case on a case-sensitive filesystem',
      async (filename, { skip }) => {
        await using tempDir = await mkdtempDisposable(join(tmpdir(), 'immich-storage-sidecar-'));
        await writeFile(join(tempDir.path, 'case-probe'), 'test');
        if (await sut.checkFileExists(join(tempDir.path, 'CASE-PROBE'), R_OK)) {
          skip();
        }
        const candidate = join(tempDir.path, filename);
        await writeFile(candidate, 'test');

        await expect(sut.checkFileExists(candidate, R_OK)).resolves.toBe(true);
        await expect(sut.checkFileExists(join(tempDir.path, 'photo.xmp'), R_OK)).resolves.toBe(false);
      },
    );
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

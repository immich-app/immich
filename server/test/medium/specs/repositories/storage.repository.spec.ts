import { R_OK } from 'node:constants';
import { chmod, mkdir, mkdtemp, mkdtempDisposable, rename, rm, symlink, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { vitest } from 'vitest';
import { CrawlOptionsDto } from 'src/dtos/library.dto.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { StorageRepository, type WatchOptions } from 'src/repositories/storage.repository.js';
import { automock } from 'test/utils.js';

interface Test {
  test: string;
  options: CrawlOptionsDto;
  files: Record<string, boolean>;
}

const tests: Test[] = [
  {
    test: 'should return empty when crawling an empty path list',
    options: {
      pathsToCrawl: [],
    },
    files: {},
  },
  {
    test: 'should exclude by file extension without case sensitivity',
    options: {
      pathsToCrawl: ['/photos/'],
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
      pathsToCrawl: ['/photos/'],
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
    test: 'should walk multiple paths',
    options: {
      pathsToCrawl: ['/photos/', '/images/', '/albums/'],
    },
    files: {
      '/photos/image1.jpg': true,
      '/images/image2.jpg': true,
      '/albums/image3.jpg': true,
    },
  },
  {
    test: 'should walk a single path without trailing slash',
    options: {
      pathsToCrawl: ['/photos'],
    },
    files: {
      '/photos/image.jpg': true,
    },
  },
  {
    test: 'should walk a single path',
    options: {
      pathsToCrawl: ['/photos/'],
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
      pathsToCrawl: ['/photos/'],
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
      pathsToCrawl: ['/photos/', '/videos/'],
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
      pathsToCrawl: ['/photos/'],
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
      pathsToCrawl: ['/photos/1/../2'],
    },
    files: {
      '/photos/1/image.jpg': false,
      '/photos/2/image.jpg': true,
    },
  },
  {
    test: 'should support special characters in paths',
    options: {
      pathsToCrawl: ['/photos (new)'],
    },
    files: {
      ['/photos (new)/1.jpg']: true,
    },
  },
];

const newRoot = () => mkdtempDisposable(join(tmpdir(), 'immich-storage-'));

const writeFiles = async (root: string, files: string[]) => {
  for (const file of files) {
    await mkdir(dirname(root + file), { recursive: true });
    await writeFile(root + file, '');
  }
};

const inRoot = (root: string, options: CrawlOptionsDto): CrawlOptionsDto => ({
  ...options,
  pathsToCrawl: options.pathsToCrawl.map((path) => root + path),
});

describe(StorageRepository.name, () => {
  const annoyingExclusionPatterns = ['@', '#', '$', '%', '^', '&', '='];
  let sut: StorageRepository;
  let logger: LoggingRepository;
  let tempDir: string;
  let includedFile: string;
  let excludedFile: string;

  beforeEach(async () => {
    // eslint-disable-next-line no-sparse-arrays
    logger = automock(LoggingRepository, { args: [, { getEnv: () => ({}) }], strict: false });
    sut = new StorageRepository(logger);
    tempDir = await mkdtemp(join(tmpdir(), 'immich-storage-watch-'));
    includedFile = join(tempDir, 'included/photo.jpg');
    excludedFile = join(tempDir, 'excluded/photo.jpg');

    await Promise.all([
      mkdir(join(tempDir, 'included'), { recursive: true }),
      mkdir(join(tempDir, 'excluded'), { recursive: true }),
    ]);
    await Promise.all([writeFile(includedFile, 'included'), writeFile(excludedFile, 'excluded')]);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  const startWatching = (options: WatchOptions, root = tempDir) => {
    const paths: string[] = [];
    const changedPaths: string[] = [];
    const unlinkedPaths: string[] = [];
    let resolveReady!: () => void;

    const ready = new Promise<void>((resolve) => (resolveReady = resolve));
    const close = sut.watch([root], options, {
      onAdd: (path) => {
        paths.push(path);
      },
      onChange: (path) => {
        changedPaths.push(path);
      },
      onUnlink: (path) => {
        unlinkedPaths.push(path);
      },
      onReady: resolveReady,
    });

    return { close, paths, changedPaths, unlinkedPaths, ready };
  };

  it('should emit add events for initial files', async () => {
    const watcher = startWatching({ ignoreInitial: false });

    try {
      await watcher.ready;

      expect(watcher.paths.toSorted()).toEqual([includedFile, excludedFile].toSorted());
    } finally {
      await watcher.close();
    }
  });

  it('should not emit add events for ignored initial files', async () => {
    const watcher = startWatching({ ignoreInitial: false, ignored: ['**/excluded/**'] });

    try {
      await watcher.ready;

      expect(watcher.paths).toEqual([includedFile]);
    } finally {
      await watcher.close();
    }
  });

  it('should ignore symbolic links to files and directories', async () => {
    const outsideDir = await mkdtemp(join(tmpdir(), 'immich-storage-outside-'));

    try {
      await writeFile(join(outsideDir, 'secret.txt'), 'secret');
      await writeFile(join(outsideDir, 'photo.jpg'), 'outside');
      await symlink(join(outsideDir, 'secret.txt'), join(tempDir, 'file-link.jpg'));
      await symlink(outsideDir, join(tempDir, 'directory-link'));
      await symlink(includedFile, join(tempDir, 'internal-file-link.jpg'));
      await symlink(join(tempDir, 'included'), join(tempDir, 'internal-directory-link'));

      const watcher = startWatching({ ignoreInitial: false });

      try {
        await watcher.ready;

        expect(watcher.paths.toSorted()).toEqual([includedFile, excludedFile].toSorted());
      } finally {
        await watcher.close();
      }
    } finally {
      await rm(outsideDir, { recursive: true, force: true });
    }
  });

  it.each([
    { type: 'file', action: 'created' },
    { type: 'directory', action: 'created' },
    { type: 'file', action: 'retargeted' },
    { type: 'directory', action: 'retargeted' },
  ])('should ignore $type symlinks $action after the watcher is ready', async ({ type, action }) => {
    const outsideDir = await mkdtemp(join(tmpdir(), 'immich-storage-outside-'));

    try {
      const targetDir = join(outsideDir, 'target');
      const targetFile = join(targetDir, 'photo.jpg');
      await mkdir(targetDir);
      await writeFile(targetFile, 'outside');

      const link = join(tempDir, type === 'file' ? 'link.jpg' : 'link');
      const target = type === 'file' ? targetFile : targetDir;
      if (action === 'retargeted') {
        await symlink(type === 'file' ? includedFile : join(tempDir, 'included'), link);
      }

      // Use real Chokidar events without relying on platform-specific native watcher limits.
      const watcher = startWatching({ ignoreInitial: true, usePolling: true, interval: 50 });

      try {
        await watcher.ready;

        if (action === 'retargeted') {
          const replacementLink = join(outsideDir, 'replacement-link');
          await symlink(target, replacementLink);
          await rename(replacementLink, link);
        } else {
          await symlink(target, link);
        }
        // Confirm the watcher processes real file events before checking for unwanted symlink events.
        const newFile = join(tempDir, 'new-photo.jpg');
        await writeFile(newFile, 'new');
        await writeFile(includedFile, 'changed inside');
        await vitest.waitFor(
          () => {
            expect(watcher.paths).toContain(newFile);
            expect(watcher.changedPaths).toContain(includedFile);
          },
          { timeout: 3000 },
        );

        await writeFile(targetFile, 'changed outside');

        // Allow deferred filesystem events and Chokidar's directory rescan throttle to settle.
        await setTimeout(1500);

        expect(watcher.paths).toEqual([newFile]);
        expect(watcher.changedPaths).toEqual([includedFile]);
        expect(watcher.unlinkedPaths).toEqual([]);
      } finally {
        await watcher.close();
      }
    } finally {
      await rm(outsideDir, { recursive: true, force: true });
    }
  });

  it.each(annoyingExclusionPatterns)('should ignore folders with %s in their name', async (char) => {
    const ignoredFolder = `${char}folder`;
    const ignoredFile = join(tempDir, ignoredFolder, 'photo.jpg');
    await mkdir(join(tempDir, ignoredFolder), { recursive: true });
    await writeFile(ignoredFile, 'ignored');

    const watcher = startWatching({ ignoreInitial: false, ignored: [`**/${ignoredFolder}/**`] });

    try {
      await watcher.ready;

      expect(watcher.paths.toSorted()).toEqual([includedFile, excludedFile].toSorted());
    } finally {
      await watcher.close();
    }
  });

  it.each(['', '/'])('should emit events in new folders but not excluded ones, root suffix %j', async (suffix) => {
    const watcher = startWatching(
      { ignoreInitial: true, usePolling: true, interval: 50, ignored: ['**/excluded/**', '**/Raw', '**/*.tif'] },
      tempDir + suffix,
    );

    try {
      await watcher.ready;
      await writeFile(excludedFile, 'changed');
      await mkdir(join(tempDir, 'Raw/sub'), { recursive: true });
      await writeFile(join(tempDir, 'Raw/sub/photo.jpg'), 'excluded');
      await writeFile(join(tempDir, 'included/photo.tif'), 'excluded');
      const nestedFile = join(tempDir, 'included/2020/01/photo.jpg');
      await mkdir(dirname(nestedFile), { recursive: true });
      await writeFile(nestedFile, 'nested');
      await writeFile(includedFile, 'changed');

      await vitest.waitFor(
        () => {
          expect(watcher.paths).toContain(nestedFile);
          expect(watcher.changedPaths).toContain(includedFile);
        },
        { timeout: 3000 },
      );

      expect(watcher.paths).toEqual([nestedFile]);
      expect(watcher.changedPaths).toEqual([includedFile]);
    } finally {
      await watcher.close();
    }
  });

  it('should skip symbolic links to files and directories', async () => {
    await using root = await newRoot();
    await writeFiles(root.path, [
      '/photos/image.jpg',
      '/photos/subfolder/image.jpg',
      '/outside/secret.txt',
      '/outside/album/image.jpg',
    ]);
    await symlink(`${root.path}/outside/secret.txt`, `${root.path}/photos/file-link.jpg`);
    await symlink(`${root.path}/outside/album`, `${root.path}/photos/directory-link`);
    await symlink(`${root.path}/photos/image.jpg`, `${root.path}/photos/internal-file-link.jpg`);
    await symlink(`${root.path}/photos/subfolder`, `${root.path}/photos/internal-directory-link`);
    await symlink(`${root.path}/outside/missing.jpg`, `${root.path}/photos/broken-link.jpg`);

    const batches = await Array.fromAsync(sut.walk({ pathsToCrawl: [`${root.path}/photos`], take: 1 }));

    expect(batches.flat().toSorted()).toEqual([
      `${root.path}/photos/image.jpg`,
      `${root.path}/photos/subfolder/image.jpg`,
    ]);
  });

  describe('walk', () => {
    it('should yield batches of the requested size and the remainder last', async () => {
      await using root = await newRoot();
      await writeFiles(root.path, ['/photos/1.jpg', '/photos/2.jpg', '/photos/3.jpg']);

      const batches = await Array.fromAsync(sut.walk({ pathsToCrawl: [`${root.path}/photos`], take: 2 }));

      expect(batches.map((batch) => batch.length)).toEqual([2, 1]);
      expect(batches.flat().toSorted()).toEqual([
        `${root.path}/photos/1.jpg`,
        `${root.path}/photos/2.jpg`,
        `${root.path}/photos/3.jpg`,
      ]);
    });
  });

  const walkOrdered = async (root: string, pathsToCrawl: string[]) => {
    const batches = await Array.fromAsync(
      sut.walkOrdered({ pathsToCrawl: pathsToCrawl.map((path) => root + path), includeHidden: false }),
    );
    return batches.flatMap(({ files }) => files.map((file) => file.slice(root.length)));
  };

  describe('walkOrdered', () => {
    for (const { test, options, files } of tests) {
      it(test, async () => {
        await using root = await newRoot();
        await writeFiles(root.path, Object.keys(files));

        const batches = await Array.fromAsync(sut.walkOrdered(inRoot(root.path, options)));
        const expected = Object.entries(files)
          .filter((entry) => entry[1])
          .map(([file]) => root.path + file);

        expect(batches.flatMap(({ files }) => files).toSorted()).toEqual(expected.toSorted());
      });
    }

    it('should walk disjoint import paths one after another in byte order', async () => {
      await using root = await newRoot();
      await writeFiles(root.path, ['/a/x.jpg', '/a-b/x.jpg', '/b/x.jpg']);

      await expect(walkOrdered(root.path, ['/b', '/a', '/a-b'])).resolves.toEqual([
        '/a-b/x.jpg',
        '/a/x.jpg',
        '/b/x.jpg',
      ]);
    });

    it('should yield a file of nested import paths once', async () => {
      await using root = await newRoot();
      await writeFiles(root.path, ['/lib/a.jpg', '/lib/sub/b.jpg', '/lib/z.jpg']);

      await expect(walkOrdered(root.path, ['/lib', '/lib/sub'])).resolves.toEqual([
        '/lib/a.jpg',
        '/lib/sub/b.jpg',
        '/lib/z.jpg',
      ]);
    });

    it('should keep the files of a nested import path the outer walk skips', async () => {
      await using root = await newRoot();
      await writeFiles(root.path, ['/lib/.hidden/b.jpg', '/lib/a.jpg', '/lib/z.jpg']);

      await expect(walkOrdered(root.path, ['/lib/.hidden', '/lib'])).resolves.toEqual([
        '/lib/.hidden/b.jpg',
        '/lib/a.jpg',
        '/lib/z.jpg',
      ]);
    });

    it.each(['/lib/', '/lib//', '/lib/sub/..', '/lib/.'])('should walk %s as the same folder as /lib', async (path) => {
      await using root = await newRoot();
      await writeFiles(root.path, ['/lib/a.jpg', '/lib/sub/b.jpg']);

      await expect(walkOrdered(root.path, [path, '/lib'])).resolves.toEqual(['/lib/a.jpg', '/lib/sub/b.jpg']);
    });

    it('should yield nothing without import paths', async () => {
      await expect(Array.fromAsync(sut.walkOrdered({ pathsToCrawl: [] }))).resolves.toEqual([]);
    });

    it('should report the modification time of each file', async () => {
      await using root = await newRoot();
      await writeFiles(root.path, ['/lib/a.jpg', '/lib/b.jpg']);
      await utimes(`${root.path}/lib/a.jpg`, new Date(1_700_000_000_000), new Date(1_700_000_000_000));
      await utimes(`${root.path}/lib/b.jpg`, new Date(1_800_000_000_123), new Date(1_800_000_000_123));

      const batches = await Array.fromAsync(sut.walkOrdered({ pathsToCrawl: [`${root.path}/lib`] }));

      expect(batches.flatMap(({ modified }) => modified)).toEqual([1_700_000_000_000, 1_800_000_000_123]);
    });

    it.skipIf(process.getuid?.() === 0)('should log a folder that cannot be read and keep walking', async () => {
      await using root = await newRoot();
      await writeFiles(root.path, ['/lib/a.jpg', '/lib/locked/b.jpg', '/lib/z.jpg']);
      await chmod(`${root.path}/lib/locked`, 0o000);

      const paths = await walkOrdered(root.path, ['/lib']).finally(() => chmod(`${root.path}/lib/locked`, 0o755));

      expect(paths).toEqual(['/lib/a.jpg', '/lib/z.jpg']);
      expect(vitest.mocked(logger.warn).mock.calls).toEqual([
        [`Unable to walk ${root.path}/lib/locked: Permission denied (os error 13)`],
      ]);
    });
  });

  describe('checkFileExists', () => {
    it.for(['PHOTO.xmp', 'photo.XMP'])(
      'should not match %s with different case on a case-sensitive filesystem',
      async (filename, { skip }) => {
        await using tempDir = await newRoot();
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
});

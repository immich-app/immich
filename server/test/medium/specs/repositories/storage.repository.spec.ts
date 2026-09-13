import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { StorageRepository, type WatchOptions } from 'src/repositories/storage.repository.js';
import { automock } from 'test/utils.js';

describe(StorageRepository.name, () => {
  const annoyingExclusionPatterns = ['@', '#', '$', '%', '^', '&', '='];
  let sut: StorageRepository;
  let tempDir: string;
  let includedFile: string;
  let excludedFile: string;

  beforeEach(async () => {
    // eslint-disable-next-line no-sparse-arrays
    sut = new StorageRepository(automock(LoggingRepository, { args: [, { getEnv: () => ({}) }], strict: false }));
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

  const startWatching = (options: WatchOptions) => {
    const paths: string[] = [];
    let resolveReady!: () => void;

    const ready = new Promise<void>((resolve) => (resolveReady = resolve));
    const close = sut.watch([tempDir], options, {
      onAdd: (path) => {
        paths.push(path);
      },
      onReady: resolveReady,
    });

    return { close, paths, ready };
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
});

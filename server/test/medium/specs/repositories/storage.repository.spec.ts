import { mkdir, mkdtemp, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { vitest } from 'vitest';
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
    const changedPaths: string[] = [];
    const unlinkedPaths: string[] = [];
    let resolveReady!: () => void;

    const ready = new Promise<void>((resolve) => (resolveReady = resolve));
    const close = sut.watch([tempDir], options, {
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
});

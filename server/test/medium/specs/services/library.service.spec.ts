import { ChokidarOptions } from 'chokidar';
import { Kysely } from 'kysely';
import { JobName } from 'src/enum';
import { EventRepository } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LibraryRepository } from 'src/repositories/library.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { StorageRepository, WatchEvents } from 'src/repositories/storage.repository';
import { DB } from 'src/schema';
import { LibraryService } from 'src/services/library.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(LibraryService, {
    database: db || defaultDatabase,
    real: [LibraryRepository],
    mock: [EventRepository, JobRepository, LoggingRepository, StorageRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

const closeWatcher = () => Promise.resolve();

const setWatchMode = (sut: LibraryService) => {
  const service = sut as unknown as { lock: boolean; watchLibraries: boolean };
  service.lock = true;
  service.watchLibraries = true;
};

const makeMockWatcher =
  (paths: { add?: string[]; change?: string[]; unlink?: string[] }) =>
  (_paths: string[], options: ChokidarOptions, events: Partial<WatchEvents>): (() => Promise<void>) => {
    const ignored = options.ignored as ((path: string) => boolean) | undefined;
    events.onReady?.();
    for (const path of paths.add ?? []) {
      if (!ignored?.(path)) {
        events.onAdd?.(path);
      }
    }

    for (const path of paths.change ?? []) {
      if (!ignored?.(path)) {
        events.onChange?.(path);
      }
    }

    for (const path of paths.unlink ?? []) {
      if (!ignored?.(path)) {
        events.onUnlink?.(path);
      }
    }

    return closeWatcher;
  };

describe(`${LibraryService.name} (watch, medium)`, () => {
  it('should queue add and change events for supported files', async () => {
    const { sut, ctx } = setup();
    const storageRepo = ctx.getMock(StorageRepository);
    const jobRepo = ctx.getMock(JobRepository);

    jobRepo.queue.mockResolvedValue();
    setWatchMode(sut);

    const { user } = await ctx.newUser();
    const library = await sut.create({
      ownerId: user.id,
      importPaths: ['/test-assets/temp/watcher-behavior'],
      exclusionPatterns: ['**/@eaDir/**'],
    });

    storageRepo.watch.mockImplementation(
      makeMockWatcher({
        add: ['/test-assets/temp/watcher-behavior/add.png'],
        change: ['/test-assets/temp/watcher-behavior/change.jpg'],
      }),
    );

    await sut.watchAll();

    expect(jobRepo.queue).toHaveBeenCalledWith({
      name: JobName.LibrarySyncFiles,
      data: { libraryId: library.id, paths: ['/test-assets/temp/watcher-behavior/add.png'] },
    });
    expect(jobRepo.queue).toHaveBeenCalledWith({
      name: JobName.LibrarySyncFiles,
      data: { libraryId: library.id, paths: ['/test-assets/temp/watcher-behavior/change.jpg'] },
    });

    await sut.onShutdown();
  });

  it('should queue unlink events for tracked files', async () => {
    const { sut, ctx } = setup();
    const storageRepo = ctx.getMock(StorageRepository);
    const jobRepo = ctx.getMock(JobRepository);

    jobRepo.queue.mockResolvedValue();
    setWatchMode(sut);

    const { user } = await ctx.newUser();
    const library = await sut.create({
      ownerId: user.id,
      importPaths: ['/test-assets/temp/watcher-behavior'],
      exclusionPatterns: ['**/@eaDir/**'],
    });

    storageRepo.watch.mockImplementation(
      makeMockWatcher({
        unlink: ['/test-assets/temp/watcher-behavior/delete.png'],
      }),
    );

    await sut.watchAll();

    expect(jobRepo.queue).toHaveBeenCalledWith({
      name: JobName.LibraryRemoveAsset,
      data: { libraryId: library.id, paths: ['/test-assets/temp/watcher-behavior/delete.png'] },
    });

    await sut.onShutdown();
  });

  it('should ignore add, change, and unlink events in excluded directories', async () => {
    const { sut, ctx } = setup();
    const storageRepo = ctx.getMock(StorageRepository);
    const jobRepo = ctx.getMock(JobRepository);

    jobRepo.queue.mockResolvedValue();
    setWatchMode(sut);

    await ctx.newUser().then(({ user }) =>
      sut.create({
        ownerId: user.id,
        importPaths: ['/test-assets/temp/watcher-behavior'],
        exclusionPatterns: ['**/@eaDir/**'],
      }),
    );

    storageRepo.watch.mockImplementation(
      makeMockWatcher({
        add: ['/test-assets/temp/watcher-behavior/@eaDir/add.png'],
        change: ['/test-assets/temp/watcher-behavior/@eaDir/change.png'],
        unlink: ['/test-assets/temp/watcher-behavior/@eaDir/unlink.png'],
      }),
    );

    await sut.watchAll();

    expect(jobRepo.queue).not.toHaveBeenCalledWith(
      expect.objectContaining({
        name: JobName.LibrarySyncFiles,
      }),
    );
    expect(jobRepo.queue).not.toHaveBeenCalledWith(
      expect.objectContaining({
        name: JobName.LibraryRemoveAsset,
      }),
    );

    await sut.onShutdown();
  });
});

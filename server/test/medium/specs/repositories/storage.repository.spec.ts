import { Kysely } from 'kysely';
import { mkdtemp, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });

  return { ctx, sut: ctx.get(StorageRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

const watchForEvent = (
  sut: StorageRepository,
  folder: string,
  event: 'add' | 'change' | 'unlink',
  action: () => Promise<void>,
): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      void close().finally(() => reject(new Error(`Timed out waiting for ${event} event`)));
    }, 10_000);

    const onResolve = (path: string) => {
      clearTimeout(timeout);
      void close().finally(() => resolve(path));
    };

    const onReject = (error: Error) => {
      clearTimeout(timeout);
      void close().finally(() => reject(error));
    };

    const close = sut.watch(
      [folder],
      {
        ignoreInitial: true,
        usePolling: true,
        interval: 50,
      },
      {
        onReady: () => {
          void action().catch((error) => onReject(error as Error));
        },
        onAdd: (path) => {
          if (event === 'add') {
            onResolve(path);
          }
        },
        onChange: (path) => {
          if (event === 'change') {
            onResolve(path);
          }
        },
        onUnlink: (path) => {
          if (event === 'unlink') {
            onResolve(path);
          }
        },
        onError: (error) => onReject(error),
      },
    );
  });
};

describe(StorageRepository.name, () => {
  describe('watch', () => {
    it('should fire create (add) events', async () => {
      const { sut } = setup();
      const folder = await mkdtemp(join(tmpdir(), 'immich-storage-watch-add-'));
      const file = join(folder, 'created.jpg');

      try {
        const changedPath = await watchForEvent(sut, folder, 'add', async () => {
          await writeFile(file, 'created');
        });

        expect(changedPath).toBe(file);
      } finally {
        await rm(folder, { recursive: true, force: true });
      }
    });

    it('should fire change events', async () => {
      const { sut } = setup();
      const folder = await mkdtemp(join(tmpdir(), 'immich-storage-watch-change-'));
      const file = join(folder, 'changed.jpg');

      await writeFile(file, 'before');

      try {
        const changedPath = await watchForEvent(sut, folder, 'change', async () => {
          await writeFile(file, 'after');
        });

        expect(changedPath).toBe(file);
      } finally {
        await rm(folder, { recursive: true, force: true });
      }
    });

    it('should fire unlink events', async () => {
      const { sut } = setup();
      const folder = await mkdtemp(join(tmpdir(), 'immich-storage-watch-unlink-'));
      const file = join(folder, 'deleted.jpg');

      await writeFile(file, 'content');

      try {
        const changedPath = await watchForEvent(sut, folder, 'unlink', async () => {
          await unlink(file);
        });

        expect(changedPath).toBe(file);
      } finally {
        await rm(folder, { recursive: true, force: true });
      }
    });
  });
});

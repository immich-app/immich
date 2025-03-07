import { after } from 'lodash';
import { mkdirSync, mkdtemp, rm, rmSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { sep } from 'node:path';
import { AuthDto } from 'src/dtos/auth.dto';
import { LibraryResponseDto, WalkOptionsDto } from 'src/dtos/library.dto';
import { CrawlType, JobName, JobStatus } from 'src/enum';
import { LibraryService } from 'src/services/library.service';
import { TestContext, TestFactory } from 'test/factory';

import { readdir } from 'node:fs/promises';
import { LibraryEntity } from 'src/entities/library.entity';
import { getKyselyDB, newRandomImage, newTestService, ServiceMocks } from 'test/utils';

type sidecarCrawlTests = {
  description: string;
  sidecars: string[];
  files: string[];
};

type sidecarImportTests = {
  description: string;
  sidecars: string[];
};

describe(LibraryService.name, () => {
  let sut: LibraryService;
  let mocks: ServiceMocks;
  let context: TestContext;
  let tempDirectory: string;

  const removeTempDirectory = () => {
    if (tempDirectory) {
      try {
        rmSync(tempDirectory, { recursive: true, force: true });
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
    }
  };

  const cleanTempDirectory = async () => {
    removeTempDirectory();

    tempDirectory = await new Promise<string>((resolve, reject) => {
      mkdtemp(`${tmpdir()}${sep}library-service-test`, (err, directory) => {
        if (err) reject(err);
        else resolve(directory);
      });
    });

    if (!tempDirectory) {
      throw new Error('Temporary path not created');
    }
  };

  beforeAll(async () => {
    await cleanTempDirectory();

    const db = await getKyselyDB();
    context = await TestContext.from(db).withUser({ isAdmin: true }).create();

    ({ sut, mocks } = newTestService(LibraryService, context));
  });

  afterAll(() => {
    removeTempDirectory();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('Sidecar discovery and reconciliation', () => {
    let library: LibraryResponseDto;

    const crawlTests: sidecarCrawlTests[] = [
      {
        description: 'jpg file without sidecar',
        sidecars: [],
        files: ['image.jpg'],
      },
      {
        description: 'jpg file with .xmp',
        sidecars: ['image.jpg.xmp'],
        files: ['image.jpg'],
      },
      {
        description: 'jpg and png file with .xmp',
        sidecars: ['image.jpg.xmp'],
        files: ['image.jpg', 'image.png'],
      },
      {
        description: '.jpg.xmp without image file',
        sidecars: ['image.jpg.xmp'],
        files: [],
      },
      {
        description: '.xmp without image file',
        sidecars: ['image.xmp'],
        files: [],
      },
      {
        description: 'jpg file with .xmp',
        sidecars: ['image.xmp'],
        files: ['image.jpg'],
      },
      {
        description: 'jpg file with .xmp and .jpg.xmp',
        sidecars: ['image.jpg.xmp', 'image.xmp'],
        files: ['image.jpg'],
      },
      {
        description: 'jpg and png file with .jpg.xmp and .png.xmp',
        sidecars: ['image.jpg.xmp', 'image.png.xmp'],
        files: ['image.jpg', 'image.png'],
      },
      {
        description: 'jpg and png file with .jpg.xmp and .png.xmp and .xmp',
        sidecars: ['image.jpg.xmp', 'image.png.xmp', 'image.xmp'],
        files: ['image.jpg', 'image.png'],
      },
    ];

    const importTests: sidecarImportTests[] = [
      {
        description: 'jpg.xmp',
        sidecars: ['image.jpg.xmp'],
      },
      {
        description: '.xmp',
        sidecars: ['image.xmp'],
      },
      {
        description: 'both .xmp and .jpg.xmp',
        sidecars: ['image.xmp', 'image.jpg.xmp'],
      },
    ];

    beforeAll(async () => {
      const userDto = TestFactory.user();
      const sessionDto = TestFactory.session({ userId: userDto.id });
      const authDto = TestFactory.auth({ user: userDto });

      await context.getFactory().withUser(userDto).withSession(sessionDto).create();

      const user = await context.user.get(authDto.user.id, { withDeleted: false });
      if (!user) {
        expect.fail('First user should exist');
      }

      const libraryDto = TestFactory.library({}, user.id);

      library = await sut.create(libraryDto);
    });

    beforeEach(async () => {
      await cleanTempDirectory();
      mocks.job.queue.mockClear();
    });

    afterEach(() => {
      removeTempDirectory();
    });

    it.each(crawlTests)('Should crawl $description', async ({ sidecars, files }) => {
      for (const file of files) {
        const data = newRandomImage();
        await writeFile(`${tempDirectory}${sep}${file}`, data);
      }

      for (const sidecar of sidecars) {
        await writeFile(`${tempDirectory}${sep}${sidecar}`, '');
      }

      await sut.update(library.id, { importPaths: [tempDirectory] });

      await expect(sut.handleQueueSyncFiles({ id: library.id })).resolves.toBe(JobStatus.SUCCESS);

      if (sidecars.length > 0) {
        expect(mocks.job.queue).toHaveBeenCalledWith(
          expect.objectContaining({
            name: JobName.LIBRARY_SYNC_SIDECARS,
            data: expect.objectContaining({
              libraryId: library.id,
              paths: sidecars.map((sidecar) => `${tempDirectory}${sep}${sidecar}`),
            }),
          }),
        );
      } else {
        expect(mocks.job.queue).not.toHaveBeenCalledWith(
          expect.objectContaining({
            name: JobName.LIBRARY_SYNC_SIDECARS,
          }),
        );
      }

      if (files.length > 0) {
        expect(mocks.job.queue).toHaveBeenCalledWith(
          expect.objectContaining({
            name: JobName.LIBRARY_SYNC_FILES,
            data: expect.objectContaining({
              libraryId: library.id,
              paths: files.map((file) => `${tempDirectory}${sep}${file}`),
            }),
          }),
        );
      } else {
        expect(mocks.job.queue).not.toHaveBeenCalledWith(
          expect.objectContaining({
            name: JobName.LIBRARY_SYNC_FILES,
          }),
        );
      }
    });

    it.each(importTests)('Should import $description', async ({ sidecars }) => {
      await sut.update(library.id, { importPaths: [tempDirectory] });

      await expect(sut.handleSyncSidecars({ paths: sidecars, libraryId: library.id })).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.job.queueAll).toHaveBeenCalledWith(
        sidecars.map(() =>
          expect.objectContaining({
            name: JobName.SIDECAR_RECONCILIATION,
            data: expect.objectContaining({
              id: expect.any(String),
            }),
          }),
        ),
      );
    });
  });
});

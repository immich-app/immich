import { after } from 'lodash';
import { mkdirSync, mkdtemp, rm, rmSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { sep } from 'node:path';
import { AuthDto } from 'src/dtos/auth.dto';
import { WalkOptionsDto } from 'src/dtos/library.dto';
import { CrawlType, JobName, JobStatus } from 'src/enum';
import { LibraryService } from 'src/services/library.service';
import { TestContext, TestFactory } from 'test/factory';

import { readdir } from 'node:fs/promises';
import { getKyselyDB, newRandomImage, newTestService, ServiceMocks } from 'test/utils';

type SidecarTest = {
  description: string;
  sidecars: string[];
  files: string[];
};

describe(LibraryService.name, () => {
  let sut: LibraryService;
  let mocks: ServiceMocks;
  let context: TestContext;
  let tempDirectory: string;

  beforeAll(async () => {
    tempDirectory = await new Promise<string>((resolve, reject) => {
      mkdtemp(`${tmpdir()}${sep}library-service-test`, (err, directory) => {
        if (err) reject(err);
        else resolve(directory);
      });
    });

    if (!tempDirectory) {
      throw new Error('Temporary path not created');
    }

    const db = await getKyselyDB();
    context = await TestContext.from(db).withUser({ isAdmin: true }).create();

    ({ sut, mocks } = newTestService(LibraryService, context));
  });

  afterAll(async () => {
    if (tempDirectory) {
      rmSync(tempDirectory, { recursive: true });
    }
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueSyncFiles', () => {
    const sidecarTests: SidecarTest[] = [
      /* {
        description: 'should handle jpg file no sidecar',
        sidecars: [],
        files: ['image.jpg'],
      },
      {
        description: 'should handle jpg file with xmp',
        sidecars: ['image.jpg.xmp'],
        files: ['image.jpg'],
      },*/
      {
        description: 'should handle jpg file with xmp without extension',
        sidecars: ['image.xmp'],
        files: ['image.jpg'],
      },
      /*  {
        description: 'should handle jpg file both sidecars xmp',
        sidecars: ['image.jpg.xmp', 'image.xmp'],
        files: ['image.jpg'],
      },*/
    ];

    it.each(sidecarTests)('$description', async ({ sidecars, files }) => {
      for (const file of files) {
        const data = newRandomImage();
        await writeFile(`${tempDirectory}${sep}${file}`, data);
      }

      for (const sidecar of sidecars) {
        await writeFile(`${tempDirectory}${sep}${sidecar}`, '');
      }

      const userDto = TestFactory.user();
      const sessionDto = TestFactory.session({ userId: userDto.id });
      const authDto = TestFactory.auth({ user: userDto });

      await context.getFactory().withUser(userDto).withSession(sessionDto).create();

      const user = await context.user.get(authDto.user.id, { withDeleted: false });
      if (!user) {
        expect.fail('First user should exist');
      }

      const libraryDto = TestFactory.library({ importPaths: [tempDirectory] }, user.id);

      const library = await sut.create(libraryDto);

      await expect(sut.handleQueueSyncFiles({ id: library.id })).resolves.toBe(JobStatus.SUCCESS);

      if (sidecars.length > 0) {
        expect(mocks.job.queue).toHaveBeenCalledWith({
          name: JobName.LIBRARY_SYNC_SIDECARS,
          data: {
            libraryId: library.id,
            paths: sidecars.map((sidecar) => `${tempDirectory}${sep}${sidecar}`),
            progressCounter: expect.any(Number),
          },
        });
      }

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.LIBRARY_SYNC_FILES,
        data: {
          libraryId: library.id,
          paths: files.map((file) => `${tempDirectory}${sep}${file}`),
          progressCounter: expect.any(Number),
        },
      });

      for (const file of [...files, ...sidecars]) {
        rmSync(`${tempDirectory}${sep}${file}`);
      }
    });
  });
});

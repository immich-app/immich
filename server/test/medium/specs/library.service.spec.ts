import { Stats } from 'node:fs';
import { AuthDto } from 'src/dtos/auth.dto';
import { WalkOptionsDto } from 'src/dtos/library.dto';
import { CrawlType, JobStatus } from 'src/enum';
import { LibraryService } from 'src/services/library.service';
import { TestContext, TestFactory } from 'test/factory';
import { getKyselyDB, newTestService, ServiceMocks } from 'test/utils';

type SidecarTest = {
  description: string;
  sidecars: string[];
  files: string[];
};

describe(LibraryService.name, () => {
  let sut: LibraryService;
  let mocks: ServiceMocks;
  let auth: AuthDto;
  let context: TestContext;

  beforeAll(async () => {
    const db = await getKyselyDB();
    context = await TestContext.from(db).withUser({ isAdmin: true }).create();

    ({ sut, mocks } = newTestService(LibraryService, context));
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueSyncFiles', () => {
    const sidecarTests: SidecarTest[] = [
      {
        description: 'should handle jpg file no sidecar',
        sidecars: [],
        files: ['/image.jpg'],
      },
      {
        description: 'should handle jpg file with xmp',
        sidecars: ['/image.jpg.xmp'],
        files: ['/image.jpg'],
      },
      {
        description: 'should handle jpg file with xmp without extension',
        sidecars: ['/image.xmp'],
        files: ['/image.jpg'],
      },
      {
        description: 'should handle jpg file both sidecars xmp',
        sidecars: ['/image.jpg.xmp', '/image.xmp'],
        files: ['/image.jpg'],
      },
    ];

    it.each(sidecarTests)('$description', async ({ sidecars, files }) => {
      const userDto = TestFactory.user();
      const sessionDto = TestFactory.session({ userId: userDto.id });
      const authDto = TestFactory.auth({ user: userDto });

      await context.getFactory().withUser(userDto).withSession(sessionDto).create();

      const user = await context.user.get(authDto.user.id, { withDeleted: false });
      if (!user) {
        expect.fail('First user should exist');
      }

      const libraryDto = TestFactory.library({ importPaths: ['/'] }, user.id);

      // mocks.library.create.mockResolvedValue(libraryStub.externalLibraryWithImportPath);

      // mocks.library.get.mockResolvedValue(libraryStub.externalLibraryWithImportPath);
      mocks.storage.walk.mockImplementation(async function* (dto: WalkOptionsDto) {
        if (dto.crawlType === CrawlType.SIDECARS) {
          yield sidecars;
        } else {
          yield files;
        }
      });

      mocks.storage.stat.mockResolvedValue({ size: 123_456, isDirectory: () => true } as Stats);
      mocks.storage.checkFileExists.mockResolvedValue(true);
      /*  mocks.asset.filterNewExternalSidecarPaths.mockResolvedValue(sidecars);
        mocks.asset.filterNewExternalAssetPaths.mockResolvedValue(files); */

      await expect(sut.handleQueueSyncFiles({ id: libraryDto.id })).resolves.toBe(JobStatus.SUCCESS);

      /* expect(mocks.storage.walk).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            pathsToCrawl: libraryDto.importPaths,
            crawlType: CrawlType.SIDECARS,
          }),
        );

        expect(mocks.storage.walk).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            pathsToCrawl: libraryDto.importPaths,
            crawlType: CrawlType.ASSETS,
          }),
        );

        expect(mocks.job.queue).toHaveBeenNthCalledWith(1, {
          name: JobName.LIBRARY_SYNC_SIDECARS,
          data: {
            libraryId: libraryDto.id,
            paths: sidecars,
            progressCounter: expect.any(Number),
          },
        });

        expect(mocks.job.queue).toHaveBeenNthCalledWith(2, {
          name: JobName.LIBRARY_SYNC_FILES,
          data: {
            libraryId: libraryDto.id,
            paths: files,
            progressCounter: expect.any(Number),
          },
        });*/
    });
  });
});

import { AuthService, AuthUserDto, JobService, LibraryService, QueueName } from '@app/domain';
import { AssetService } from '@app/immich/api-v1/asset/asset.service';
import { AppModule } from '@app/immich/app.module';
import { AppService } from '@app/immich/app.service';
import { LibraryType } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppService as MicroAppService } from 'src/microservices/app.service';
import { MicroservicesModule } from 'src/microservices/microservices.module';

describe.skip('Asset', () => {
  let app: INestApplication;

  let authService: AuthService;
  let appService: AppService;
  let assetService: AssetService;

  let microAppService: MicroAppService;

  let libraryService: LibraryService;
  let jobService: JobService;

  let adminUser: AuthUserDto;

  beforeAll(async () => {
    jest.useRealTimers();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, MicroservicesModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    authService = app.get(AuthService);
    libraryService = app.get(LibraryService);
    jobService = app.get(JobService);
    appService = app.get(AppService);
    assetService = app.get(AssetService);
    microAppService = app.get(MicroAppService);
    await app.init();
    await appService.init();
    await microAppService.init();
  });

  describe('can import library', () => {
    beforeAll(async () => {
      // setup users
      const adminSignUpDto = await authService.adminSignUp({
        email: 'one@test.com',
        password: '1234',
        firstName: 'one',
        lastName: 'test',
      });
      adminUser = { ...adminSignUpDto, isAdmin: true }; // TODO: find out why adminSignUp doesn't have isAdmin (maybe can just return UserResponseDto)

      const library = await libraryService.create(adminUser, {
        type: LibraryType.EXTERNAL,
        name: 'Library',
        importPaths: ['e2e/assets/nature'],
        exclusionPatterns: [],
      });

      // We expect https://github.com/etnoy/immich-test-assets to be cloned into the e2e/assets folder

      await libraryService.refresh(adminUser, library.id, {});

      let isFinished = false;
      // TODO: this shouldn't be a while loop
      while (!isFinished) {
        const jobStatus = await jobService.getAllJobsStatus();

        let jobsActive = false;
        Object.values(jobStatus).forEach((job) => {
          if (job.queueStatus.isActive) {
            jobsActive = true;
          }
        });

        if (!jobsActive && jobStatus[QueueName.LIBRARY].jobCounts.completed > 0) {
          isFinished = true;
        }
      }
      console.log('Library has been refreshed now');
      // Library has been refreshed now
    });

    it('scans the library', async () => {
      const assets = await assetService.getAllAssets(adminUser, {});
      console.log(assets);
      const jobStatus = await jobService.getAllJobsStatus();
      console.log(jobStatus);

      // Should have imported the 7 test assets
      expect(assets).toHaveLength(7);
    });
  });

  afterAll(async () => {
    // await clearDb(database);
    await app.close();
  });
});

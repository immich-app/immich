import { AuthService, AuthUserDto, JobCommand, JobService, LibraryService, QueueName, UserService } from '@app/domain';
import { AssetService } from '@app/immich/api-v1/asset/asset.service';
import { AppModule } from '@app/immich/app.module';
import { AppService } from '@app/immich/app.service';
import { LibraryType } from '@app/infra/entities';
import { JobRepository } from '@app/infra/repositories/job.repository';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Job, QueueEvents } from 'bullmq';
import { queue } from 'sharp';
import { AppService as MicroAppService } from 'src/microservices/app.service';
import { MicroservicesModule } from 'src/microservices/microservices.module';
import { DataSource } from 'typeorm';
import { clearDb } from '../test/test-utils';

jest.setTimeout(30000);

describe('Asset', () => {
  let app: INestApplication;

  let database: DataSource;
  let authService: AuthService;
  let appService: AppService;
  let assetService: AssetService;

  let microAppService: MicroAppService;
  let userService: UserService;

  let jobRepository: JobRepository;
  let libraryService: LibraryService;
  let jobService: JobService;

  let adminUser: AuthUserDto;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, MicroservicesModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    database = app.get(DataSource);
    authService = app.get(AuthService);
    libraryService = app.get(LibraryService);
    jobService = app.get(JobService);
    appService = app.get(AppService);
    assetService = app.get(AssetService);
    userService = app.get(UserService);
    microAppService = app.get(MicroAppService);
    database = app.get(DataSource);
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

      const library = await libraryService.create(adminUser, { libraryType: LibraryType.IMPORT, name: 'Library' });

      // We expect https://github.com/etnoy/immich-test-assets to be cloned into the e2e/assets folder
      await libraryService.setImportPaths(adminUser, library.id, { importPaths: ['e2e/assets/nature'] });

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

        if (!jobsActive) {
          isFinished = true;
        }
      }

      // Library has been refreshed now
    });

    it('scans the library', async () => {
      const assets = await assetService.getAllAssets(adminUser, { withoutThumbs: true });
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

import { JobService, LoginResponseDto, QueueName } from '@app/domain';
import { AppModule } from '@app/immich/app.module';
import { LibraryType } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { api } from '@test/api';
import { db } from '@test/db';
import { sleep } from '@test/test-utils';
import { AppService as MicroAppService } from 'src/microservices/app.service';

import { MicroservicesModule } from 'src/microservices/microservices.module';

describe('libe2e', () => {
  let app: INestApplication;

  let microServices: INestApplication;

  let jobService: JobService;

  let server: any;

  let moduleFixture: TestingModule;
  let microFixture: TestingModule;

  let admin: LoginResponseDto;

  beforeAll(async () => {
    process.env.TYPESENSE_ENABLED = 'false';
    process.env.IMMICH_MACHINE_LEARNING_ENABLED = 'false';

    jest.useRealTimers();

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    microFixture = await Test.createTestingModule({
      imports: [MicroservicesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    server = app.getHttpServer();

    await app.init();
    app.enableShutdownHooks();

    jobService = moduleFixture.get(JobService);

    microServices = microFixture.createNestApplication();

    await microServices.init();
    microServices.enableShutdownHooks();

    await microFixture.get(MicroAppService).init();
  });

  describe('can import library', () => {
    beforeAll(async () => {
      await db.reset();

      await jobService.obliterateAll(true);

      await api.authApi.adminSignUp(server);
      admin = await api.authApi.adminLogin(server);
      await api.userApi.update(server, admin.accessToken, { id: admin.userId, externalPath: '/' });

      const library = await api.libraryApi.createLibrary(server, admin.accessToken, {
        type: LibraryType.EXTERNAL,
        name: 'Library',
        importPaths: [`${__dirname}/../assets/nature`],
        exclusionPatterns: [],
      });

      // We expect https://github.com/etnoy/immich-test-assets to be cloned into the e2e/assets folder

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, {});

      let isFinished = false;
      // TODO: this shouldn't be a while loop
      while (!isFinished) {
        await sleep(100);

        const jobStatus = await api.jobApi.getAllJobsStatus(server, admin.accessToken);
        console.log(jobStatus.library);

        let jobsActive = false;
        Object.values(jobStatus).forEach((job) => {
          if (job.queueStatus.isActive) {
            jobsActive = true;
          }
        });

        if (!jobsActive && jobStatus[QueueName.LIBRARY].jobCounts.completed > 0) {
          isFinished = true;
        }
        isFinished = true;

        await sleep(5000);
      }
    });

    it('scans the library', async () => {
      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
      expect(assets).toHaveLength(7);
    });
  });

  afterEach(async () => {
    await jobService.obliterateAll(true);
  });

  afterAll(async () => {
    await db.disconnect();
    await app.close();
    await microServices.close();
    await moduleFixture.close();
    await microFixture.close();
  });
});

import { JobService, LoginResponseDto, QueueName } from '@app/domain';
import { AppModule } from '@app/immich/app.module';
import { LibraryType } from '@app/infra/entities';
import { INestApplication, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { api } from '@test/api';
import { db } from '@test/db';
import { sleep } from '@test/test-utils';
import { AppService as MicroAppService } from 'src/microservices/app.service';

import { MetadataExtractionProcessor } from 'src/microservices/processors/metadata-extraction.processor';

describe('libe2e', () => {
  let app: INestApplication;

  let jobService: JobService;

  let server: any;

  let moduleFixture: TestingModule;

  let admin: LoginResponseDto;

  beforeAll(async () => {
    jest.useRealTimers();

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
      providers: [MetadataExtractionProcessor, MicroAppService],
    })
      .setLogger(new Logger())
      .compile();

    app = moduleFixture.createNestApplication();

    await app.init();
    app.enableShutdownHooks();
    server = app.getHttpServer();

    jobService = moduleFixture.get(JobService);

    await moduleFixture.get(MicroAppService).init();
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

      console.log(await api.libraryApi.getAll(server, admin.accessToken));

      // We expect https://github.com/etnoy/immich-test-assets to be cloned into the e2e/assets folder

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, {});

      let isFinished = false;
      // TODO: this shouldn't be a while loop
      while (!isFinished) {
        const jobStatus = await api.jobApi.getAllJobsStatus(server, admin.accessToken);

        let jobsActive = false;
        Object.values(jobStatus).forEach((job) => {
          if (job.queueStatus.isActive) {
            jobsActive = true;
          }
          if (job.queueStatus.active > 0 || job.queueStatus.waiting > 0) {
            jobsActive = true;
          }
        });

        if (!jobsActive) {
          isFinished = true;
        }

        await sleep(200);
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
    await moduleFixture.close();
  });
});

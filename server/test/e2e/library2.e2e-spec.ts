import {
  AuthService,
  AuthUserDto,
  ISystemConfigRepository,
  JobCommand,
  JobService,
  LibraryService,
  QueueName,
  SystemConfigCore,
} from '@app/domain';
import { AssetService } from '@app/immich/api-v1/asset/asset.service';
import { AppModule } from '@app/immich/app.module';
import { AppService } from '@app/immich/app.service';
import { RedisIoAdapter } from '@app/infra';
import { LibraryType } from '@app/infra/entities';
import { INestApplication, Logger } from '@nestjs/common';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { api } from '@test/api';
import { db } from '@test/db';
import { sleep } from '@test/test-utils';
import { AppService as MicroAppService } from 'src/microservices/app.service';
import { bootstrap } from 'src/microservices/main';

import { MicroservicesModule } from 'src/microservices/microservices.module';

describe('libe2e', () => {
  let app: INestApplication;

  let authService: AuthService;
  let appService: AppService;
  let assetService: AssetService;

  let microServices: INestApplication;

  let libraryService: LibraryService;
  let jobService: JobService;
  let microAppService: MicroAppService;

  let adminUser: AuthUserDto;

  let server: any;

  let moduleFixture: TestingModule;
  let microFixture: TestingModule;

  beforeAll(async () => {
    jest.useRealTimers();

    moduleFixture = await Test.createTestingModule({
      imports: [
        AppModule,
        ClientsModule.register([
          {
            name: 'microservices',
            transport: Transport.REDIS,
            options: {
              host: process.env.REDIS_HOSTNAME,
              port: Number(process.env.REDIS_PORT),
            },
          },
        ]),
      ],
    })
      //.setLogger(new Logger())
      .compile();

    microFixture = await Test.createTestingModule({
      imports: [
        MicroservicesModule,
        ClientsModule.register([
          {
            name: 'microservices',
            transport: Transport.REDIS,
            options: {
              host: process.env.REDIS_HOSTNAME,
              port: Number(process.env.REDIS_PORT),
            },
          },
        ]),
      ],
    })
      //  .setLogger(new Logger())
      .compile();

    const configCore = new SystemConfigCore(moduleFixture.get(ISystemConfigRepository));
    let config = await configCore.getConfig();
    config.machineLearning.enabled = false;
    console.log(config);
    await configCore.updateConfig(config);

    microServices = microFixture.createNestApplication();

    await microServices.init();

    app = moduleFixture.createNestApplication();
    server = app.getHttpServer();

    await app.init();

    await app.startAllMicroservices();

    await app.init();

    jobService = moduleFixture.get(JobService);

    await microFixture.get(MicroAppService).init();
  });

  describe('can import library', () => {
    beforeAll(async () => {
      await db.reset();
      await jobService.obliterateAll(true);

      await api.authApi.adminSignUp(server);
      const admin = await api.authApi.adminLogin(server);
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
        const jobStatus = await api.jobApi.getAllJobsStatus(server, admin.accessToken);
        console.log(jobStatus);

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
    await microServices.close();
  });
});

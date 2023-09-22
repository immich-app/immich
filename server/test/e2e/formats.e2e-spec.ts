import { JobService, LoginResponseDto, QueueName } from '@app/domain';
import { AppModule } from '@app/immich/app.module';
import { LibraryType } from '@app/infra/entities';
import { INestApplication, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { api } from '@test/api';
import { db } from '@test/db';
import { waitForQueues } from '@test/test-utils';
import { AppService as MicroAppService } from 'src/microservices/app.service';

import { MetadataExtractionProcessor } from 'src/microservices/processors/metadata-extraction.processor';

describe('File format (e2e)', () => {
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

    await moduleFixture.get(MicroAppService).init(true);
  });

  beforeEach(async () => {
    // We expect https://github.com/etnoy/immich-test-assets to be cloned into the e2e/assets folder

    await db.reset();

    await jobService.obliterateAll(true);

    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);
    await api.userApi.update(server, admin.accessToken, { id: admin.userId, externalPath: '/' });
  });

  it('should import a jpg file', async () => {
    const library = await api.libraryApi.createLibrary(server, admin.accessToken, {
      type: LibraryType.EXTERNAL,
      name: 'Library',
      importPaths: [`${__dirname}/../assets/formats/jpg`],
      exclusionPatterns: [],
    });

    await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, {});

    await waitForQueues(jobService);

    const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
    expect(assets).toHaveLength(1);
  });

  it('should import a heic file', async () => {
    const library = await api.libraryApi.createLibrary(server, admin.accessToken, {
      type: LibraryType.EXTERNAL,
      name: 'Library',
      importPaths: [`${__dirname}/../assets/formats/heic`],
      exclusionPatterns: [],
    });

    await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, {});

    await waitForQueues(jobService);

    const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
    expect(assets).toHaveLength(1);
    console.log(assets);
  });

  afterAll(async () => {
    console.log(await jobService.getAllJobsStatus());
    await jobService.obliterateAll(true);
    await app.close();
    await moduleFixture.close();
    await db.disconnect();
  });
});

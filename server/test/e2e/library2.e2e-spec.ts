import { JobService, LoginResponseDto } from '@app/domain';
import { AppModule } from '@app/immich/app.module';
import { RedisIoAdapter } from '@app/infra';
import { LibraryType } from '@app/infra/entities';
import { INestApplication, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { api } from '@test/api';
import { db } from '@test/db';
import { waitForQueues } from '@test/test-utils';
import { AppService as MicroAppService } from 'src/microservices/app.service';

import { MetadataExtractionProcessor } from 'src/microservices/processors/metadata-extraction.processor';

describe('Library queue e2e', () => {
  let app: INestApplication;
  let jobService: JobService;
  let server: any;
  let moduleFixture: TestingModule;
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await db.reset();

    jest.useRealTimers();

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
      providers: [MetadataExtractionProcessor, MicroAppService],
    })
      .setLogger(new Logger())
      .compile();

    app = moduleFixture.createNestApplication();

    app.useWebSocketAdapter(new RedisIoAdapter(app));

    await app.init();
    app.enableShutdownHooks();
    server = app.getHttpServer();

    jobService = moduleFixture.get(JobService);

    await moduleFixture.get(MicroAppService).init(true);
  });

  afterAll(async () => {
    await jobService.obliterateAll(true);
    await app.close();
    await moduleFixture.close();
    await db.disconnect();
  });

  describe('can import library', () => {
    beforeEach(async () => {
      // We expect https://github.com/etnoy/immich-test-assets to be cloned into the e2e/assets folder

      await db.reset();

      await jobService.obliterateAll(true);

      await api.authApi.adminSignUp(server);
      admin = await api.authApi.adminLogin(server);
      await api.userApi.update(server, admin.accessToken, { id: admin.userId, externalPath: '/' });
    });

    it('should scan the whole folder', async () => {
      const library = await api.libraryApi.createLibrary(server, admin.accessToken, {
        type: LibraryType.EXTERNAL,
        name: 'Library',
        importPaths: [`${__dirname}/../assets/nature`],
        exclusionPatterns: [],
      });

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, {});

      await waitForQueues(jobService);

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
      expect(assets).toHaveLength(7);
    });

    it('scan with exclusions', async () => {
      const library = await api.libraryApi.createLibrary(server, admin.accessToken, {
        type: LibraryType.EXTERNAL,
        name: 'Library',
        importPaths: [`${__dirname}/../assets/nature/`],
        exclusionPatterns: ['**/*o*/**', '**/*c*/**'],
      });

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, {});

      await waitForQueues(jobService);

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

      expect(assets).toHaveLength(1);
      expect(assets[0].originalFileName).toBe('silver_fir');
    });
  });
});

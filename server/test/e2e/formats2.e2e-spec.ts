import { JobService, LibraryResponseDto, LoginResponseDto } from '@app/domain';
import { AppModule } from '@app/immich/app.module';
import { RedisIoAdapter } from '@app/infra';
import { AssetType, LibraryType } from '@app/infra/entities';
import { INestApplication, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { api } from '@test/api';
import { waitForQueues } from '@test/test-utils';
import { AppService as MicroAppService } from 'src/microservices/app.service';

import { MetadataExtractionProcessor } from 'src/microservices/processors/metadata-extraction.processor';
import { DockerComposeEnvironment } from 'testcontainers';

describe('File format (e2e)', () => {
  let app: INestApplication;
  let jobService: JobService;
  let server: any;
  let moduleFixture: TestingModule;
  let admin: LoginResponseDto;

  beforeEach(async () => {
    // We expect https://github.com/etnoy/immich-test-assets to be cloned into the e2e/assets folder

    jest.useRealTimers();

    await jobService.obliterateAll(true);

    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);
    await api.userApi.update(server, admin.accessToken, { id: admin.userId, externalPath: '/' });
  });

  describe('File format', () => {
    let library: LibraryResponseDto;
    beforeEach(async () => {
      library = await api.libraryApi.createLibrary(server, admin.accessToken, {
        type: LibraryType.EXTERNAL,
        name: 'Library',
        importPaths: [`${__dirname}/../assets/formats/jpg`],
        exclusionPatterns: [],
      });
    });

    it('should import a jpg file', async () => {
      library = await api.libraryApi.setImportPaths(server, admin.accessToken, library.id, [
        `${__dirname}/../assets/formats/jpg`,
      ]);

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, {});

      await waitForQueues(jobService);

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
      expect(assets).toHaveLength(1);
      console.log(assets);
      const jpgAsset = assets[0];
      expect(jpgAsset.type).toBe(AssetType.IMAGE);
      expect(jpgAsset.originalFileName).toBe('el_torcal_rocks');
      expect(jpgAsset.exifInfo?.exifImageHeight).toBe(341);
      expect(jpgAsset.exifInfo?.exifImageWidth).toBe(512);
    });

    it('should import a jpeg file', async () => {
      library = await api.libraryApi.setImportPaths(server, admin.accessToken, library.id, [
        `${__dirname}/../assets/formats/jpeg`,
      ]);

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, {});

      await waitForQueues(jobService);

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
      expect(assets).toHaveLength(1);
      console.log(assets);
      const jpegAsset = assets[0];
      expect(jpegAsset.type).toBe(AssetType.IMAGE);
      expect(jpegAsset.originalFileName).toBe('el_torcal_rocks');
      expect(jpegAsset.exifInfo?.exifImageHeight).toBe(341);
      expect(jpegAsset.exifInfo?.exifImageWidth).toBe(512);
    });

    it('should import a heic file', async () => {
      library = await api.libraryApi.setImportPaths(server, admin.accessToken, library.id, [
        `${__dirname}/../assets/formats/heic`,
      ]);

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, {});

      await waitForQueues(jobService);

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
      expect(assets).toHaveLength(1);
      const heicAsset = assets[0];
      console.log(heicAsset);
      expect(heicAsset.type).toBe(AssetType.IMAGE);
      expect(heicAsset.originalFileName).toBe('IMG_2682');
      expect(heicAsset.duration).toBe(null);
      expect(heicAsset.fileCreatedAt).toBe('2029-03-21T11:04:00.000Z');
    });
  });
});

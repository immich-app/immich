import { JobCommand, JobName, LoginResponseDto, updateConfig } from '@immich/sdk';
import { cpSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, testAssetDir, utils } from 'src/utils';
import request from 'supertest';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

describe('/jobs', () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });
  });

  describe('PUT /jobs', () => {
    afterEach(async () => {
      await utils.jobCommand(admin.accessToken, JobName.MetadataExtraction, {
        command: JobCommand.Resume,
        force: false,
      });

      await utils.jobCommand(admin.accessToken, JobName.ThumbnailGeneration, {
        command: JobCommand.Resume,
        force: false,
      });

      await utils.jobCommand(admin.accessToken, JobName.FaceDetection, {
        command: JobCommand.Resume,
        force: false,
      });

      await utils.jobCommand(admin.accessToken, JobName.SmartSearch, {
        command: JobCommand.Resume,
        force: false,
      });

      await utils.jobCommand(admin.accessToken, JobName.DuplicateDetection, {
        command: JobCommand.Resume,
        force: false,
      });

      const config = await utils.getSystemConfig(admin.accessToken);
      config.machineLearning.duplicateDetection.enabled = false;
      config.machineLearning.enabled = false;
      config.metadata.faces.import = false;
      config.machineLearning.clip.enabled = false;
      await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });
    });

    it('should require authentication', async () => {
      const { status, body } = await request(app).put('/jobs/metadataExtraction');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should queue metadata extraction for missing assets', async () => {
      const path = `${testAssetDir}/formats/raw/Nikon/D700/philadelphia.nef`;

      await utils.jobCommand(admin.accessToken, JobName.MetadataExtraction, {
        command: JobCommand.Pause,
        force: false,
      });

      const { id } = await utils.createAsset(admin.accessToken, {
        assetData: { bytes: await readFile(path), filename: basename(path) },
      });

      await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');

      {
        const asset = await utils.getAssetInfo(admin.accessToken, id);

        expect(asset.exifInfo).toBeDefined();
        expect(asset.exifInfo?.make).toBeNull();
      }

      await utils.jobCommand(admin.accessToken, JobName.MetadataExtraction, {
        command: JobCommand.Empty,
        force: false,
      });

      await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');

      await utils.jobCommand(admin.accessToken, JobName.MetadataExtraction, {
        command: JobCommand.Resume,
        force: false,
      });

      await utils.jobCommand(admin.accessToken, JobName.MetadataExtraction, {
        command: JobCommand.Start,
        force: false,
      });

      await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');

      {
        const asset = await utils.getAssetInfo(admin.accessToken, id);

        expect(asset.exifInfo).toBeDefined();
        expect(asset.exifInfo?.make).toBe('NIKON CORPORATION');
      }
    });

    it('should not re-extract metadata for existing assets', async () => {
      const path = `${testAssetDir}/temp/metadata/asset.jpg`;

      cpSync(`${testAssetDir}/formats/raw/Nikon/D700/philadelphia.nef`, path);

      const { id } = await utils.createAsset(admin.accessToken, {
        assetData: { bytes: await readFile(path), filename: basename(path) },
      });

      await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');

      {
        const asset = await utils.getAssetInfo(admin.accessToken, id);

        expect(asset.exifInfo).toBeDefined();
        expect(asset.exifInfo?.model).toBe('NIKON D700');
      }

      cpSync(`${testAssetDir}/formats/raw/Nikon/D80/glarus.nef`, path);

      await utils.jobCommand(admin.accessToken, JobName.MetadataExtraction, {
        command: JobCommand.Start,
        force: false,
      });

      await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');

      {
        const asset = await utils.getAssetInfo(admin.accessToken, id);

        expect(asset.exifInfo).toBeDefined();
        expect(asset.exifInfo?.model).toBe('NIKON D700');
      }

      rmSync(path);
    });

    it('should queue thumbnail extraction for assets missing thumbs', async () => {
      const path = `${testAssetDir}/albums/nature/tanners_ridge.jpg`;

      await utils.jobCommand(admin.accessToken, JobName.ThumbnailGeneration, {
        command: JobCommand.Pause,
        force: false,
      });

      const { id } = await utils.createAsset(admin.accessToken, {
        assetData: { bytes: await readFile(path), filename: basename(path) },
      });

      await utils.waitForQueueFinish(admin.accessToken, JobName.MetadataExtraction);
      await utils.waitForQueueFinish(admin.accessToken, JobName.ThumbnailGeneration);

      const assetBefore = await utils.getAssetInfo(admin.accessToken, id);
      expect(assetBefore.thumbhash).toBeNull();

      await utils.jobCommand(admin.accessToken, JobName.ThumbnailGeneration, {
        command: JobCommand.Empty,
        force: false,
      });

      await utils.waitForQueueFinish(admin.accessToken, JobName.MetadataExtraction);
      await utils.waitForQueueFinish(admin.accessToken, JobName.ThumbnailGeneration);

      await utils.jobCommand(admin.accessToken, JobName.ThumbnailGeneration, {
        command: JobCommand.Resume,
        force: false,
      });

      await utils.jobCommand(admin.accessToken, JobName.ThumbnailGeneration, {
        command: JobCommand.Start,
        force: false,
      });

      await utils.waitForQueueFinish(admin.accessToken, JobName.MetadataExtraction);
      await utils.waitForQueueFinish(admin.accessToken, JobName.ThumbnailGeneration);

      const assetAfter = await utils.getAssetInfo(admin.accessToken, id);
      expect(assetAfter.thumbhash).not.toBeNull();
    });

    it('should not reload existing thumbnail when running thumb job for missing assets', async () => {
      const path = `${testAssetDir}/temp/thumbs/asset1.jpg`;

      cpSync(`${testAssetDir}/albums/nature/tanners_ridge.jpg`, path);

      const { id } = await utils.createAsset(admin.accessToken, {
        assetData: { bytes: await readFile(path), filename: basename(path) },
      });

      await utils.waitForQueueFinish(admin.accessToken, JobName.MetadataExtraction);
      await utils.waitForQueueFinish(admin.accessToken, JobName.ThumbnailGeneration);

      const assetBefore = await utils.getAssetInfo(admin.accessToken, id);

      cpSync(`${testAssetDir}/albums/nature/notocactus_minimus.jpg`, path);

      await utils.jobCommand(admin.accessToken, JobName.ThumbnailGeneration, {
        command: JobCommand.Resume,
        force: false,
      });

      // This runs the missing thumbnail job
      await utils.jobCommand(admin.accessToken, JobName.ThumbnailGeneration, {
        command: JobCommand.Start,
        force: false,
      });

      await utils.waitForQueueFinish(admin.accessToken, JobName.MetadataExtraction);
      await utils.waitForQueueFinish(admin.accessToken, JobName.ThumbnailGeneration);

      const assetAfter = await utils.getAssetInfo(admin.accessToken, id);

      // Asset 1 thumbnail should be untouched since its thumb should not have been reloaded, even though the file was changed
      expect(assetAfter.thumbhash).toEqual(assetBefore.thumbhash);

      rmSync(path);
    });
  });
});

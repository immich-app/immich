import { JobCommand, JobName, LoginResponseDto, updateConfig } from '@immich/sdk';
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
    });

    it('should require authentication', async () => {
      const { status, body } = await request(app).put('/jobs/metadataExtraction');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should queue metadata extraction for missing assets', async () => {
      const path1 = `${testAssetDir}/formats/raw/Nikon/D700/philadelphia.nef`;
      const path2 = `${testAssetDir}/formats/raw/Nikon/D80/glarus.nef`;

      await utils.createAsset(admin.accessToken, {
        assetData: { bytes: await readFile(path1), filename: basename(path1) },
      });

      await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');

      await utils.jobCommand(admin.accessToken, JobName.MetadataExtraction, {
        command: JobCommand.Pause,
        force: false,
      });

      const { id } = await utils.createAsset(admin.accessToken, {
        assetData: { bytes: await readFile(path2), filename: basename(path2) },
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

    it('should queue thumbnail extraction for missing assets', async () => {
      const path1 = `${testAssetDir}/formats/raw/Nikon/D700/philadelphia.nef`;
      const path2 = `${testAssetDir}/formats/raw/Nikon/D80/glarus.nef`;

      await utils.createAsset(admin.accessToken, {
        assetData: { bytes: await readFile(path1), filename: basename(path1) },
      });

      await utils.waitForQueueFinish(admin.accessToken, JobName.MetadataExtraction);
      await utils.waitForQueueFinish(admin.accessToken, JobName.ThumbnailGeneration);

      await utils.jobCommand(admin.accessToken, JobName.ThumbnailGeneration, {
        command: JobCommand.Pause,
        force: false,
      });

      const { id } = await utils.createAsset(admin.accessToken, {
        assetData: { bytes: await readFile(path2), filename: basename(path2) },
      });

      await utils.waitForQueueFinish(admin.accessToken, JobName.MetadataExtraction);
      await utils.waitForQueueFinish(admin.accessToken, JobName.ThumbnailGeneration);

      {
        const asset = await utils.getAssetInfo(admin.accessToken, id);

        expect(asset.thumbhash).toBeNull();
      }

      await utils.jobCommand(admin.accessToken, JobName.MetadataExtraction, {
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

      {
        const asset = await utils.getAssetInfo(admin.accessToken, id);

        expect(asset.thumbhash).not.toBeNull();
      }
    });

    it('should queue face detection for missing faces', async () => {
      const config = await utils.getSystemConfig(admin.accessToken);
      config.metadata.faces.import = true;
      config.machineLearning.enabled = true;
      await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

      const path = `${testAssetDir}/metadata/faces/solvay.jpg`;

      await utils.jobCommand(admin.accessToken, JobName.FaceDetection, {
        command: JobCommand.Pause,
        force: false,
      });

      await utils.jobCommand(admin.accessToken, JobName.FacialRecognition, {
        command: JobCommand.Pause,
        force: false,
      });

      const { id } = await utils.createAsset(admin.accessToken, {
        assetData: { bytes: await readFile(path), filename: basename(path) },
      });

      await utils.waitForQueueFinish(admin.accessToken, JobName.MetadataExtraction);
      await utils.waitForQueueFinish(admin.accessToken, JobName.ThumbnailGeneration);
      await utils.waitForQueueFinish(admin.accessToken, JobName.FaceDetection);

      {
        const asset = await utils.getAssetInfo(admin.accessToken, id);
        expect(asset.people).toEqual([]);
      }

      await utils.jobCommand(admin.accessToken, JobName.FaceDetection, {
        command: JobCommand.Empty,
        force: false,
      });

      await utils.waitForQueueFinish(admin.accessToken, JobName.MetadataExtraction);
      await utils.waitForQueueFinish(admin.accessToken, JobName.ThumbnailGeneration);
      await utils.waitForQueueFinish(admin.accessToken, JobName.FaceDetection);

      await utils.jobCommand(admin.accessToken, JobName.FaceDetection, {
        command: JobCommand.Resume,
        force: false,
      });

      await utils.jobCommand(admin.accessToken, JobName.FacialRecognition, {
        command: JobCommand.Resume,
        force: false,
      });

      await utils.jobCommand(admin.accessToken, JobName.FaceDetection, {
        command: JobCommand.Start,
        force: false,
      });

      await utils.waitForQueueFinish(admin.accessToken, JobName.MetadataExtraction);
      await utils.waitForQueueFinish(admin.accessToken, JobName.ThumbnailGeneration);
      await utils.waitForQueueFinish(admin.accessToken, JobName.FaceDetection, 60_000);
      await utils.waitForQueueFinish(admin.accessToken, JobName.FacialRecognition);

      {
        const asset = await utils.getAssetInfo(admin.accessToken, id);

        expect(asset.unassignedFaces?.length).toBeGreaterThan(10);
      }
    }, 120_000);
  });
});

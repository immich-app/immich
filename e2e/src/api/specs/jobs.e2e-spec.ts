import { JobCommand, JobName, LoginResponseDto } from '@immich/sdk';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { errorDto } from 'src/responses';
import { app, testAssetDir, utils } from 'src/utils';
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
  });
});

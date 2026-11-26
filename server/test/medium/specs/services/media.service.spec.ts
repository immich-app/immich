import { Kysely } from 'kysely';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { StorageCore } from 'src/cores/storage.core.js';
import { AssetFileType, AssetType, JobStatus } from 'src/enum.js';
import { AssetJobRepository } from 'src/repositories/asset-job.repository.js';
import { AssetRepository } from 'src/repositories/asset.repository.js';
import { ConfigRepository } from 'src/repositories/config.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { MediaRepository } from 'src/repositories/media.repository.js';
import { StorageRepository } from 'src/repositories/storage.repository.js';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository.js';
import { DB } from 'src/schema/index.js';
import { MediaService } from 'src/services/media.service.js';
import { ExifTestContext, newMediumService, testAssetsDir } from 'test/medium.factory.js';
import { mockEnvData } from 'test/repositories/config.repository.mock.js';
import { getKyselyDB } from 'test/utils.js';

let database: Kysely<DB>;
let mediaLocation: string;

const setup = () => {
  const { sut, ctx } = newMediumService(MediaService, {
    database,
    real: [AssetRepository, AssetJobRepository, MediaRepository, StorageRepository, SystemMetadataRepository],
    mock: [ConfigRepository, LoggingRepository],
  });

  ctx.getMock(ConfigRepository).getEnv.mockReturnValue(mockEnvData({}));

  return { sut, ctx };
};

const newExtractedVideo = async (fileName: string) => {
  const exif = new ExifTestContext(database);
  const { user } = await exif.newUser();
  const originalPath = resolve(testAssetsDir, 'videos', fileName);
  const { asset } = await exif.newAsset({ ownerId: user.id, originalPath, type: AssetType.Video });
  await exif.sut.handleMetadataExtraction({ id: asset.id });
  return asset;
};

const getEncodedVideo = (assetId: string) =>
  database
    .selectFrom('asset_file')
    .select('path')
    .where('assetId', '=', assetId)
    .where('type', '=', AssetFileType.EncodedVideo)
    .executeTakeFirst();

beforeAll(async () => {
  database = await getKyselyDB();
  mediaLocation = await mkdtemp(join(tmpdir(), 'immich-media-'));
  StorageCore.setMediaLocation(mediaLocation);
});

afterAll(async () => {
  await rm(mediaLocation, { recursive: true, force: true });
});

describe(MediaService.name, () => {
  describe('handleVideoConversion', () => {
    it('should remux a fragmented mp4 into one with a sample index', async () => {
      const { sut, ctx } = setup();
      const asset = await newExtractedVideo('fragmented.mp4');

      await expect(sut.handleVideoConversion({ id: asset.id })).resolves.toBe(JobStatus.Success);

      const encodedVideo = await getEncodedVideo(asset.id);
      const { videoStreams } = await ctx.get(MediaRepository).probe(encodedVideo!.path);
      expect(videoStreams[0].frameCount).toBe(62);
    });

    it('should not remux a regular mp4', async () => {
      const { sut } = setup();
      const asset = await newExtractedVideo('eiffel-tower.mp4');

      await expect(sut.handleVideoConversion({ id: asset.id })).resolves.toBe(JobStatus.Skipped);

      await expect(getEncodedVideo(asset.id)).resolves.toBeUndefined();
    });
  });
});

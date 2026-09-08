import { Kysely } from 'kysely';
import { AssetFileType, JobName, JobStatus } from 'src/enum';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MachineLearningRepository } from 'src/repositories/machine-learning.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { DB } from 'src/schema';
import { SmartInfoService } from 'src/services/smart-info.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const embedding = `[${Array.from({ length: 512 }, () => 0.01).join(', ')}]`;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(SmartInfoService, {
    database: db || defaultDatabase,
    real: [
      AssetRepository,
      AssetJobRepository,
      ConfigRepository,
      DatabaseRepository,
      SearchRepository,
      SystemMetadataRepository,
    ],
    mock: [JobRepository, LoggingRepository, MachineLearningRepository],
  });
};

const getEmbeddingCount = async (db: Kysely<DB>, assetId: string) => {
  const rows = await db.selectFrom('smart_search').select('assetId').where('assetId', '=', assetId).execute();
  return rows.length;
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SmartInfoService.name, () => {
  it('should work', () => {
    const { sut } = setup();
    expect(sut).toBeDefined();
  });

  describe('handleQueueEncodeClip', () => {
    it('should queue an edited asset that has a preview but no embedding', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, isEdited: true });
      await ctx.newJobStatus({ assetId: asset.id });
      await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, isEdited: false, path: 'preview.jpg' });
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        isEdited: true,
        path: 'preview_edited.jpg',
      });

      ctx.getMock(JobRepository).queueAll.mockResolvedValue();

      await expect(sut.handleQueueEncodeClip({ force: false })).resolves.toBe(JobStatus.Success);

      expect(ctx.getMock(JobRepository).queueAll).toHaveBeenCalledWith([
        { name: JobName.SmartSearch, data: { id: asset.id } },
      ]);
    });
  });

  describe('handleEncodeClip', () => {
    it('should encode the preview of an unedited asset', async () => {
      const { sut, ctx } = setup();
      const config = await ctx.getConfig();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: 'preview.jpg' });
      ctx.getMock(MachineLearningRepository).encodeImage.mockResolvedValue(embedding);

      await expect(sut.handleEncodeClip({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(ctx.getMock(MachineLearningRepository).encodeImage).toHaveBeenCalledWith(
        'preview.jpg',
        config.machineLearning.clip,
      );
      await expect(getEmbeddingCount(ctx.database, asset.id)).resolves.toBe(1);
    });

    it('should encode the edited preview of an edited asset', async () => {
      const { sut, ctx } = setup();
      const config = await ctx.getConfig();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, isEdited: true });
      await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, isEdited: false, path: 'preview.jpg' });
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        isEdited: true,
        path: 'preview_edited.jpg',
      });
      ctx.getMock(MachineLearningRepository).encodeImage.mockResolvedValue(embedding);

      await expect(sut.handleEncodeClip({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(ctx.getMock(MachineLearningRepository).encodeImage).toHaveBeenCalledWith(
        'preview_edited.jpg',
        config.machineLearning.clip,
      );
      await expect(getEmbeddingCount(ctx.database, asset.id)).resolves.toBe(1);
    });

    it('should fail when the asset has no preview file', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      await expect(sut.handleEncodeClip({ id: asset.id })).resolves.toBe(JobStatus.Failed);

      expect(ctx.getMock(MachineLearningRepository).encodeImage).not.toHaveBeenCalled();
      await expect(getEmbeddingCount(ctx.database, asset.id)).resolves.toBe(0);
    });
  });
});

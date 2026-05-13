import { Kysely } from 'kysely';
import { AssetFileType, JobStatus } from 'src/enum';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MachineLearningRepository } from 'src/repositories/machine-learning.repository';
import { OcrRepository } from 'src/repositories/ocr.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { DB } from 'src/schema';
import { OcrService } from 'src/services/ocr.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(OcrService, {
    database: db || defaultDatabase,
    real: [AssetRepository, AssetJobRepository, ConfigRepository, OcrRepository, SystemMetadataRepository],
    mock: [JobRepository, LoggingRepository, MachineLearningRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(OcrService.name, () => {
  it('should work', () => {
    const { sut } = setup();
    expect(sut).toBeDefined();
  });

  it('should parse asset', async () => {
    const { sut, ctx } = setup();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: 'preview.jpg' });

    const machineLearningMock = ctx.getMock(MachineLearningRepository);
    machineLearningMock.ocr.mockResolvedValue({
      box: [10, 10, 50, 10, 50, 50, 10, 50],
      boxScore: [0.99],
      text: ['Test OCR'],
      textScore: [0.95],
    });

    await expect(sut.handleOcr({ id: asset.id })).resolves.toBe(JobStatus.Success);

    const ocrRepository = ctx.get(OcrRepository);
    await expect(ocrRepository.getByAssetId(asset.id)).resolves.toEqual([
      {
        assetId: asset.id,
        boxScore: 0.99,
        id: expect.any(String),
        text: 'Test OCR',
        textScore: 0.95,
        isVisible: true,
        x1: 10,
        y1: 10,
        x2: 50,
        y2: 10,
        x3: 50,
        y3: 50,
        x4: 10,
        y4: 50,
      },
    ]);
    await expect(
      ctx.database.selectFrom('ocr_search').selectAll().where('assetId', '=', asset.id).executeTakeFirst(),
    ).resolves.toEqual({
      assetId: asset.id,
      text: 'Test OCR',
    });
    await expect(
      ctx.database
        .selectFrom('asset_job_status')
        .select('asset_job_status.ocrAt')
        .where('assetId', '=', asset.id)
        .executeTakeFirst(),
    ).resolves.toEqual({ ocrAt: expect.any(Date) });
  });

  it('should handle multiple boxes', async () => {
    const { sut, ctx } = setup();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: 'preview.jpg' });

    const machineLearningMock = ctx.getMock(MachineLearningRepository);
    machineLearningMock.ocr.mockResolvedValue({
      box: Array.from({ length: 8 * 5 }, (_, i) => i),
      boxScore: [0.7, 0.67, 0.65, 0.62, 0.6],
      text: ['One', 'Two', 'Three', 'Four', 'Five'],
      textScore: [0.9, 0.89, 0.88, 0.87, 0.86],
    });

    await expect(sut.handleOcr({ id: asset.id })).resolves.toBe(JobStatus.Success);

    const ocrRepository = ctx.get(OcrRepository);
    await expect(ocrRepository.getByAssetId(asset.id)).resolves.toEqual([
      {
        assetId: asset.id,
        boxScore: 0.7,
        id: expect.any(String),
        text: 'One',
        textScore: 0.9,
        isVisible: true,
        x1: 0,
        y1: 1,
        x2: 2,
        y2: 3,
        x3: 4,
        y3: 5,
        x4: 6,
        y4: 7,
      },
      {
        assetId: asset.id,
        boxScore: 0.67,
        id: expect.any(String),
        text: 'Two',
        textScore: 0.89,
        isVisible: true,
        x1: 8,
        y1: 9,
        x2: 10,
        y2: 11,
        x3: 12,
        y3: 13,
        x4: 14,
        y4: 15,
      },
      {
        assetId: asset.id,
        boxScore: 0.65,
        id: expect.any(String),
        text: 'Three',
        textScore: 0.88,
        isVisible: true,
        x1: 16,
        y1: 17,
        x2: 18,
        y2: 19,
        x3: 20,
        y3: 21,
        x4: 22,
        y4: 23,
      },
      {
        assetId: asset.id,
        boxScore: 0.62,
        id: expect.any(String),
        text: 'Four',
        textScore: 0.87,
        isVisible: true,
        x1: 24,
        y1: 25,
        x2: 26,
        y2: 27,
        x3: 28,
        y3: 29,
        x4: 30,
        y4: 31,
      },
      {
        assetId: asset.id,
        boxScore: 0.6,
        id: expect.any(String),
        text: 'Five',
        textScore: 0.86,
        isVisible: true,
        x1: 32,
        y1: 33,
        x2: 34,
        y2: 35,
        x3: 36,
        y3: 37,
        x4: 38,
        y4: 39,
      },
    ]);
    await expect(
      ctx.database.selectFrom('ocr_search').selectAll().where('assetId', '=', asset.id).executeTakeFirst(),
    ).resolves.toEqual({
      assetId: asset.id,
      text: 'One Two Three Four Five',
    });
    await expect(
      ctx.database
        .selectFrom('asset_job_status')
        .select('asset_job_status.ocrAt')
        .where('assetId', '=', asset.id)
        .executeTakeFirst(),
    ).resolves.toEqual({ ocrAt: expect.any(Date) });
  });

  it('should handle no boxes', async () => {
    const { sut, ctx } = setup();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: 'preview.jpg' });

    const machineLearningMock = ctx.getMock(MachineLearningRepository);
    machineLearningMock.ocr.mockResolvedValue({ box: [], boxScore: [], text: [], textScore: [] });

    await expect(sut.handleOcr({ id: asset.id })).resolves.toBe(JobStatus.Success);

    const ocrRepository = ctx.get(OcrRepository);
    await expect(ocrRepository.getByAssetId(asset.id)).resolves.toEqual([]);
    await expect(
      ctx.database.selectFrom('ocr_search').selectAll().where('assetId', '=', asset.id).executeTakeFirst(),
    ).resolves.toBeUndefined();
    await expect(
      ctx.database
        .selectFrom('asset_job_status')
        .select('asset_job_status.ocrAt')
        .where('assetId', '=', asset.id)
        .executeTakeFirst(),
    ).resolves.toEqual({ ocrAt: expect.any(Date) });
  });

  it('should update existing results', async () => {
    const { sut, ctx } = setup();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: 'preview.jpg' });

    const machineLearningMock = ctx.getMock(MachineLearningRepository);
    machineLearningMock.ocr.mockResolvedValue({
      box: [10, 10, 50, 10, 50, 50, 10, 50],
      boxScore: [0.99],
      text: ['Test OCR'],
      textScore: [0.95],
    });
    await expect(sut.handleOcr({ id: asset.id })).resolves.toBe(JobStatus.Success);

    machineLearningMock.ocr.mockResolvedValue({ box: [], boxScore: [], text: [], textScore: [] });
    await expect(sut.handleOcr({ id: asset.id })).resolves.toBe(JobStatus.Success);

    const ocrRepository = ctx.get(OcrRepository);
    await expect(ocrRepository.getByAssetId(asset.id)).resolves.toEqual([]);
    await expect(
      ctx.database.selectFrom('ocr_search').selectAll().where('assetId', '=', asset.id).executeTakeFirst(),
    ).resolves.toBeUndefined();
  });
});

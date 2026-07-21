import { Kysely } from 'kysely';
import { AssetType, VideoFrameExtractionStatus } from 'src/enum';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { VideoFrameRepository } from 'src/repositories/video-frame.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

const consume = async <T>(generator: AsyncIterableIterator<T>) => {
  const values: T[] = [];

  for await (const value of generator) {
    values.push(value);
  }

  return values;
};

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(VideoFrameRepository) };
};

const setupAssetJob = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(AssetJobRepository), videoFrameRepository: ctx.get(VideoFrameRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(VideoFrameRepository.name, () => {
  describe('trigger: updatedAt/updateId', () => {
    it('should automatically bump updatedAt and updateId on update, without any application-level SET', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });

      // Neither call below ever sets `updatedAt`/`updateId` explicitly - if the DB trigger were
      // missing or broken, both reads would return identical values.
      await sut.upsertExtractionRecord(asset.id, {
        status: VideoFrameExtractionStatus.Pending,
        version: 1,
        parameters: {},
        parametersHash: 'hash-1',
      });

      const before = await ctx.database
        .selectFrom('video_frame_extraction')
        .select(['updatedAt', 'updateId'])
        .where('assetId', '=', asset.id)
        .executeTakeFirstOrThrow();

      await sut.upsertExtractionRecord(asset.id, {
        status: VideoFrameExtractionStatus.Completed,
        version: 1,
        parameters: {},
        parametersHash: 'hash-1',
      });

      const after = await ctx.database
        .selectFrom('video_frame_extraction')
        .select(['updatedAt', 'updateId'])
        .where('assetId', '=', asset.id)
        .executeTakeFirstOrThrow();

      expect(before.updateId).not.toEqual(after.updateId);
      expect(before.updatedAt).not.toEqual(after.updatedAt);
    });
  });

  describe('cascade delete', () => {
    it('should remove video_frame and video_frame_extraction rows when the parent asset is deleted', async () => {
      const { ctx, sut } = setup();
      const assetRepository = ctx.get(AssetRepository);
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });

      await sut.upsertExtractionRecord(asset.id, {
        status: VideoFrameExtractionStatus.Completed,
        version: 1,
        parameters: {},
        parametersHash: 'hash-1',
        path: '/artifacts/asset.m4s',
        initSegmentSize: 813,
      });
      await sut.upsertFrames(asset.id, [
        { frameIndex: 0, byteOffset: 813, byteSize: 3843, intervalChange: 0 },
        { frameIndex: 1, byteOffset: 4656, byteSize: 3238, intervalChange: 2.516 },
      ]);

      await assetRepository.remove({ id: asset.id });

      await expect(sut.getExtractionRecord(asset.id)).resolves.toBeUndefined();
      await expect(sut.getFramesInRange(asset.id, 0, 1)).resolves.toEqual([]);
    });
  });

  describe('upsertFrames', () => {
    it('should atomically replace existing frames (delete-then-insert)', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });

      await sut.upsertFrames(asset.id, [
        { frameIndex: 0, byteOffset: 0, byteSize: 100, intervalChange: 0 },
        { frameIndex: 1, byteOffset: 100, byteSize: 200, intervalChange: 1.5 },
      ]);

      await sut.upsertFrames(asset.id, [{ frameIndex: 5, byteOffset: 999, byteSize: 50, intervalChange: 3.2 }]);

      const frames = await sut.getFramesInRange(asset.id, 0, 100);

      expect(frames).toHaveLength(1);
      expect(frames[0]).toEqual(
        expect.objectContaining({ frameIndex: 5, byteOffset: 999, byteSize: 50, intervalChange: 3.2 }),
      );
    });
  });
});

describe(`${AssetJobRepository.name}.streamForVideoFrameExtraction`, () => {
  it('should yield a video asset with no extraction record yet', async () => {
    const { ctx, sut } = setupAssetJob();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });

    const results = await consume(sut.streamForVideoFrameExtraction(false, 'hash-1'));

    expect(results).toEqual(expect.arrayContaining([expect.objectContaining({ id: asset.id })]));
  });

  it('should skip a video asset whose completed extraction matches the current parametersHash', async () => {
    const { ctx, sut, videoFrameRepository } = setupAssetJob();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });
    await videoFrameRepository.upsertExtractionRecord(asset.id, {
      status: VideoFrameExtractionStatus.Completed,
      version: 1,
      parameters: {},
      parametersHash: 'hash-1',
    });

    const results = await consume(sut.streamForVideoFrameExtraction(false, 'hash-1'));

    expect(results).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: asset.id })]));
  });

  it('should re-yield a video asset once the parametersHash changes', async () => {
    const { ctx, sut, videoFrameRepository } = setupAssetJob();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });
    await videoFrameRepository.upsertExtractionRecord(asset.id, {
      status: VideoFrameExtractionStatus.Completed,
      version: 1,
      parameters: {},
      parametersHash: 'hash-1',
    });

    const results = await consume(sut.streamForVideoFrameExtraction(false, 'hash-2'));

    expect(results).toEqual(expect.arrayContaining([expect.objectContaining({ id: asset.id })]));
  });
});

import { Kysely } from 'kysely';
import { AssetType } from 'src/enum';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { VideoFrameRepository } from 'src/repositories/video-frame.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

const consume = async <T>(generator: AsyncIterableIterator<T>) => {
  const values: T[] = await Array.fromAsync(generator);

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
  describe('cascade delete', () => {
    it('should remove video_frame  rows when the parent asset is deleted', async () => {
      const { ctx, sut } = setup();
      const assetRepository = ctx.get(AssetRepository);
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });

      await sut.upsertFrames(asset.id, [
        { frameIndex: 0, byteOffset: 813, byteSize: 3843, intervalChange: 0 },
        { frameIndex: 1, byteOffset: 4656, byteSize: 3238, intervalChange: 2.516 },
      ]);

      await assetRepository.remove({ id: asset.id });

      await expect(sut.getFramesInRange(asset.id, 0, 1)).resolves.toEqual([]);
      // TODO: check if asset_file rows are also deleted
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

    const results = await consume(sut.streamForVideoFrameExtraction(false));

    expect(results).toEqual(expect.arrayContaining([expect.objectContaining({ id: asset.id })]));
  });
});

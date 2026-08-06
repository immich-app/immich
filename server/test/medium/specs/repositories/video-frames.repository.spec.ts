import { Kysely } from 'kysely';
import { AssetType } from 'src/enum';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { VideoFrameRepository } from 'src/repositories/video-frames.repository';
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
    it('should remove video_frames rows when the parent asset is deleted', async () => {
      const { ctx, sut } = setup();
      const assetRepository = ctx.get(AssetRepository);
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });

      await sut.upsertFrames(asset.id, { byteOffset: [813, 4656], byteSize: [3843, 3238], intervalChange: [0, 2.516] });

      await assetRepository.remove({ id: asset.id });

      await expect(sut.getFrames(asset.id)).resolves.toBeUndefined();
    });
  });

  describe('upsertFrames', () => {
    it('should atomically replace existing frames (delete-then-insert)', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });

      await sut.upsertFrames(asset.id, {
        byteOffset: [0, 100],
        byteSize: [100, 200],
        intervalChange: [0, 1.5],
      });

      const frames = await sut.getFrames(asset.id);

      expect(frames?.byteOffset).toEqual([0, 100]);

      await sut.upsertFrames(asset.id, { byteOffset: [999], byteSize: [50], intervalChange: [3.2] });

      const framesUpdated = await sut.getFrames(asset.id);

      expect(framesUpdated?.byteOffset).toEqual([999]);
    });
  });
});

describe(`${AssetJobRepository.name}.streamForFrameSampling`, () => {
  it('should yield a video asset with no extraction record yet', async () => {
    const { ctx, sut } = setupAssetJob();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });

    const results = await consume(sut.streamForFrameSampling(false));

    expect(results).toEqual(expect.arrayContaining([expect.objectContaining({ id: asset.id })]));
  });
});

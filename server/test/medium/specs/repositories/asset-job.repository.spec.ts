import { Kysely } from 'kysely';
import { AssetFileType, AssetMetadataKey, AssetType, AssetVisibility } from 'src/enum';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { MediumTestContext, newMediumService } from 'test/medium.factory';
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
  return { ctx, sut: ctx.get(AssetJobRepository) };
};

const addPreviewState = async (ctx: MediumTestContext, assetId: string) => {
  await ctx.newJobStatus({ assetId });
  await ctx.newAssetFile({ assetId, type: AssetFileType.Preview, path: `${assetId}-preview.webp` });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AssetJobRepository.name, () => {
  describe('streamForThumbnailJob', () => {
    it('should work', async () => {
      const { sut } = setup();
      const stream = sut.streamForThumbnailJob({ force: false, fullsizeEnabled: false });
      await expect(stream.next()).resolves.toEqual({ done: true, value: undefined });
    });

    it('should queue an asset with missing thumbnails', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newJobStatus({ assetId: asset.id, metadataExtractedAt: new Date() });

      const stream = sut.streamForThumbnailJob({ force: false, fullsizeEnabled: false });
      await expect(consume(stream)).resolves.toEqual([expect.objectContaining({ id: asset.id })]);
    });

    it('should skip assets without missing thumbnails', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, thumbhash: Buffer.from('fake-thumbhash-buffer') });
      await ctx.newJobStatus({ assetId: asset.id, metadataExtractedAt: new Date() });
      await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Thumbnail, path: 'thumbnail.jpg' });
      await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: 'preview.jpg' });

      const stream = sut.streamForThumbnailJob({ force: false, fullsizeEnabled: false });
      await expect(consume(stream)).resolves.not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: asset.id })]),
      );
    });

    it('should queue assets with a missing full size', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({
        ownerId: user.id,
        thumbhash: Buffer.from('fake-thumbhash-buffer'),
        originalFileName: 'photo.cr2',
      });
      await ctx.newJobStatus({ assetId: asset.id, metadataExtractedAt: new Date() });
      await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Thumbnail, path: 'thumbnail.jpg' });
      await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: 'preview.jpg' });

      const stream = sut.streamForThumbnailJob({ force: false, fullsizeEnabled: true });
      await expect(consume(stream)).resolves.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: asset.id })]),
      );
    });

    it('should skip assets with after they have full size previews', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, thumbhash: Buffer.from('fake-thumbhash-buffer') });
      await ctx.newJobStatus({ assetId: asset.id, metadataExtractedAt: new Date() });
      await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Thumbnail, path: 'thumbnail.jpg' });
      await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: 'preview.jpg' });
      await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.FullSize, path: 'fullsize.jpg' });

      const stream = sut.streamForThumbnailJob({ force: false, fullsizeEnabled: true });
      await expect(consume(stream)).resolves.not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: asset.id })]),
      );
    });

    it('should skip assets with web-compatible originals', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({
        ownerId: user.id,
        thumbhash: Buffer.from('fake-thumbhash-buffer'),
        originalFileName: 'photo.jpg',
      });
      await ctx.newJobStatus({ assetId: asset.id, metadataExtractedAt: new Date() });
      await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Thumbnail, path: 'thumbnail.jpg' });
      await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: 'preview.jpg' });

      const stream = sut.streamForThumbnailJob({ force: false, fullsizeEnabled: true });
      await expect(consume(stream)).resolves.not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: asset.id })]),
      );
    });
  });

  describe('getForOcr', () => {
    it('should not return the edited preview file', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        path: 'preview_edited.jpg',
        isEdited: true,
      });
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        path: 'preview_unedited.jpg',
        isEdited: false,
      });

      const result = await sut.getForOcr(asset.id);

      expect(result).toEqual(
        expect.objectContaining({
          previewFile: 'preview_unedited.jpg',
        }),
      );
    });
  });

  describe('streamForImageEnrichmentJob', () => {
    it('should queue only eligible image assets missing successful description results', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();

      const { asset: missing } = await ctx.newAsset({ ownerId: user.id });
      const { asset: failed } = await ctx.newAsset({ ownerId: user.id });
      const { asset: completed } = await ctx.newAsset({ ownerId: user.id });
      const { asset: video } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });
      const { asset: hidden } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Hidden });
      const { asset: locked } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked });

      for (const asset of [missing, failed, completed, video, hidden, locked]) {
        await addPreviewState(ctx, asset.id);
      }

      await ctx.newMetadata({
        assetId: completed.id,
        key: AssetMetadataKey.MlEnrichment,
        value: { description: { status: 'success' } },
      });
      await ctx.newMetadata({
        assetId: failed.id,
        key: AssetMetadataKey.MlEnrichment,
        value: { description: { status: 'failed' } },
      });

      await expect(consume(sut.streamForImageDescriptionJob(false))).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: missing.id }),
          expect.objectContaining({ id: failed.id }),
        ]),
      );

      const queued = await consume(sut.streamForImageDescriptionJob(false));
      const queuedIds = queued.map(({ id }) => id);
      expect(queuedIds).not.toEqual(expect.arrayContaining([completed.id, video.id, hidden.id, locked.id]));

      const forced = await consume(sut.streamForImageDescriptionJob(true));
      const forcedIds = forced.map(({ id }) => id);
      expect(forcedIds).toEqual(expect.arrayContaining([completed.id]));
    });

    it('should queue only eligible image assets missing successful NSFW results', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();

      const { asset: missing } = await ctx.newAsset({ ownerId: user.id });
      const { asset: completed } = await ctx.newAsset({ ownerId: user.id });
      const { asset: video } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });

      for (const asset of [missing, completed, video]) {
        await addPreviewState(ctx, asset.id);
      }

      await ctx.newMetadata({
        assetId: completed.id,
        key: AssetMetadataKey.MlEnrichment,
        value: { nsfwDetection: { status: 'success' } },
      });

      const queued = await consume(sut.streamForNsfwDetectionJob(false));
      const queuedIds = queued.map(({ id }) => id);
      expect(queuedIds).toEqual(expect.arrayContaining([missing.id]));
      expect(queuedIds).not.toEqual(expect.arrayContaining([completed.id, video.id]));

      const forced = await consume(sut.streamForNsfwDetectionJob(true));
      const forcedIds = forced.map(({ id }) => id);
      expect(forcedIds).toEqual(expect.arrayContaining([completed.id]));
    });
  });
});

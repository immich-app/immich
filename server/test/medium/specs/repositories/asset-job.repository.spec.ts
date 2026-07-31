import { Kysely } from 'kysely';
import { AssetFileType, AssetType, AssetVisibility } from 'src/enum';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

const videoStream = (assetId: string) => ({
  assetId,
  bitrate: 5_000_000,
  frameCount: 300,
  timeBase: 90_000,
  index: 0,
  profile: null,
  level: null,
  colorPrimaries: 1,
  colorTransfer: 1,
  colorMatrix: 1,
  dvProfile: null,
  dvLevel: null,
  dvBlSignalCompatibilityId: null,
  codecName: 'h264',
  formatName: 'mov,mp4',
  formatLongName: 'QuickTime / MOV',
  pixelFormat: 'yuv420p',
});

const contains = (id: string) => expect.arrayContaining([expect.objectContaining({ id })]);

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
  return { ctx, sut: ctx.get(AssetJobRepository) };
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

  describe('streamForTranscriptionJob', () => {
    it('should queue a video that has not been transcribed', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });
      await ctx.newJobStatus({ assetId: asset.id, transcribedAt: null });

      await expect(consume(sut.streamForTranscriptionJob(false))).resolves.toEqual(contains(asset.id));
    });

    it('should skip a video that has already been transcribed', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });
      await ctx.newJobStatus({ assetId: asset.id, transcribedAt: new Date() });

      await expect(consume(sut.streamForTranscriptionJob(false))).resolves.not.toEqual(contains(asset.id));
    });

    it('should queue a video that has already been transcribed when forced', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });
      await ctx.newJobStatus({ assetId: asset.id, transcribedAt: new Date() });

      await expect(consume(sut.streamForTranscriptionJob(true))).resolves.toEqual(contains(asset.id));
    });

    it('should skip hidden videos, which is what keeps live photo components out', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({
        ownerId: user.id,
        type: AssetType.Video,
        visibility: AssetVisibility.Hidden,
      });
      await ctx.newJobStatus({ assetId: asset.id, transcribedAt: null });

      await expect(consume(sut.streamForTranscriptionJob(false))).resolves.not.toEqual(contains(asset.id));
      await expect(consume(sut.streamForTranscriptionJob(true))).resolves.not.toEqual(contains(asset.id));
    });

    it('should skip assets that are not videos', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Image });
      await ctx.newJobStatus({ assetId: asset.id, transcribedAt: null });

      await expect(consume(sut.streamForTranscriptionJob(false))).resolves.not.toEqual(contains(asset.id));
      await expect(consume(sut.streamForTranscriptionJob(true))).resolves.not.toEqual(contains(asset.id));
    });

    it('should skip a video with any corrected segment even when forced', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });
      await ctx.newJobStatus({ assetId: asset.id, transcribedAt: new Date() });
      await ctx.database
        .insertInto('transcript_segment')
        .values({ assetId: asset.id, startTime: 0, endTime: 1, text: 'Misheard name', correctedText: 'Corrected name' })
        .execute();

      await expect(consume(sut.streamForTranscriptionJob(false))).resolves.not.toEqual(contains(asset.id));
      await expect(consume(sut.streamForTranscriptionJob(true))).resolves.not.toEqual(contains(asset.id));
    });
  });

  describe('getForTranscription', () => {
    it('should report an extracted video with no audio as probed and silent', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });
      await ctx.get(AssetRepository).upsertExif({
        exif: { assetId: asset.id, fps: 30 },
        video: videoStream(asset.id),
        lockedPropertiesBehavior: 'override',
      });

      const result = await sut.getForTranscription(asset.id);

      expect(result?.audioStream).toBeNull();
      expect(result?.videoStreamId).toBe(asset.id);
    });

    it('should report a video whose streams were never extracted as unprobed', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });

      const result = await sut.getForTranscription(asset.id);

      expect(result?.audioStream).toBeNull();
      expect(result?.videoStreamId).toBeNull();
    });

    it('should report the audio stream of an extracted video that has one', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });
      await ctx.get(AssetRepository).upsertExif({
        exif: { assetId: asset.id, fps: 30 },
        video: videoStream(asset.id),
        audio: { assetId: asset.id, bitrate: 128_000, index: 1, profile: null, codecName: 'aac' },
        lockedPropertiesBehavior: 'override',
      });

      const result = await sut.getForTranscription(asset.id);

      expect(result?.audioStream).toEqual(expect.objectContaining({ codecName: 'aac' }));
      expect(result?.videoStreamId).toBe(asset.id);
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
});

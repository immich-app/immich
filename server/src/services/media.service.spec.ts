import { OutputInfo } from 'sharp';
import { SystemConfig } from 'src/config';
import { Exif } from 'src/database';
import {
  AssetFileType,
  AssetPathType,
  AssetType,
  AudioCodec,
  Colorspace,
  ExifOrientation,
  ImageFormat,
  JobName,
  JobStatus,
  RawExtractedFormat,
  TranscodeHWAccel,
  TranscodePolicy,
  VideoCodec,
} from 'src/enum';
import { MediaService } from 'src/services/media.service';
import { JobCounts, RawImageInfo } from 'src/types';
import { assetStub } from 'test/fixtures/asset.stub';
import { faceStub } from 'test/fixtures/face.stub';
import { probeStub } from 'test/fixtures/media.stub';
import { personStub, personThumbnailStub } from 'test/fixtures/person.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

describe(MediaService.name, () => {
  let sut: MediaService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(MediaService));
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueGenerateThumbnails', () => {
    it('should queue all assets', async () => {
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([assetStub.image]));

      mocks.person.getAll.mockReturnValue(makeStream([personStub.newThumbnail]));
      mocks.person.getFacesByIds.mockResolvedValue([faceStub.face1]);

      await sut.handleQueueGenerateThumbnails({ force: true });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith(true);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_THUMBNAILS,
          data: { id: assetStub.image.id },
        },
      ]);

      expect(mocks.person.getAll).toHaveBeenCalledWith(undefined);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_PERSON_THUMBNAIL,
          data: { id: personStub.newThumbnail.id },
        },
      ]);
    });

    it('should queue trashed assets when force is true', async () => {
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([assetStub.archived]));
      mocks.person.getAll.mockReturnValue(makeStream());

      await sut.handleQueueGenerateThumbnails({ force: true });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith(true);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_THUMBNAILS,
          data: { id: assetStub.trashed.id },
        },
      ]);
    });

    it('should queue archived assets when force is true', async () => {
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([assetStub.archived]));
      mocks.person.getAll.mockReturnValue(makeStream());

      await sut.handleQueueGenerateThumbnails({ force: true });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith(true);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_THUMBNAILS,
          data: { id: assetStub.archived.id },
        },
      ]);
    });

    it('should queue all people with missing thumbnail path', async () => {
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([assetStub.image]));
      mocks.person.getAll.mockReturnValue(makeStream([personStub.noThumbnail, personStub.noThumbnail]));
      mocks.person.getRandomFace.mockResolvedValueOnce(faceStub.face1);

      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith(false);
      expect(mocks.person.getAll).toHaveBeenCalledWith({ thumbnailPath: '' });
      expect(mocks.person.getRandomFace).toHaveBeenCalled();
      expect(mocks.person.update).toHaveBeenCalledTimes(1);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_PERSON_THUMBNAIL,
          data: {
            id: personStub.newThumbnail.id,
          },
        },
      ]);
    });

    it('should queue all assets with missing resize path', async () => {
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([assetStub.noResizePath]));
      mocks.person.getAll.mockReturnValue(makeStream());
      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith(false);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_THUMBNAILS,
          data: { id: assetStub.image.id },
        },
      ]);

      expect(mocks.person.getAll).toHaveBeenCalledWith({ thumbnailPath: '' });
    });

    it('should queue all assets with missing webp path', async () => {
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([assetStub.noWebpPath]));
      mocks.person.getAll.mockReturnValue(makeStream());
      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith(false);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_THUMBNAILS,
          data: { id: assetStub.image.id },
        },
      ]);

      expect(mocks.person.getAll).toHaveBeenCalledWith({ thumbnailPath: '' });
    });

    it('should queue all assets with missing thumbhash', async () => {
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([assetStub.noThumbhash]));
      mocks.person.getAll.mockReturnValue(makeStream());
      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith(false);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_THUMBNAILS,
          data: { id: assetStub.image.id },
        },
      ]);

      expect(mocks.person.getAll).toHaveBeenCalledWith({ thumbnailPath: '' });
    });
  });

  describe('handleQueueMigration', () => {
    it('should remove empty directories and queue jobs', async () => {
      mocks.assetJob.streamForMigrationJob.mockReturnValue(makeStream([assetStub.image]));
      mocks.job.getJobCounts.mockResolvedValue({ active: 1, waiting: 0 } as JobCounts);
      mocks.person.getAll.mockReturnValue(makeStream([personStub.withName]));

      await expect(sut.handleQueueMigration()).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.storage.removeEmptyDirs).toHaveBeenCalledTimes(2);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.MIGRATE_ASSET, data: { id: assetStub.image.id } },
      ]);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.MIGRATE_PERSON, data: { id: personStub.withName.id } },
      ]);
    });
  });

  describe('handleAssetMigration', () => {
    it('should fail if asset does not exist', async () => {
      mocks.assetJob.getForMigrationJob.mockResolvedValue(void 0);
      await expect(sut.handleAssetMigration({ id: assetStub.image.id })).resolves.toBe(JobStatus.FAILED);

      expect(mocks.move.getByEntity).not.toHaveBeenCalled();
    });

    it('should move asset files', async () => {
      mocks.assetJob.getForMigrationJob.mockResolvedValue(assetStub.image);
      mocks.move.create.mockResolvedValue({
        entityId: assetStub.image.id,
        id: 'move-id',
        newPath: '/new/path',
        oldPath: '/old/path',
        pathType: AssetPathType.ORIGINAL,
      });

      await expect(sut.handleAssetMigration({ id: assetStub.image.id })).resolves.toBe(JobStatus.SUCCESS);
      expect(mocks.move.create).toHaveBeenCalledWith({
        entityId: assetStub.image.id,
        pathType: AssetPathType.FULLSIZE,
        oldPath: '/uploads/user-id/fullsize/path.webp',
        newPath: 'upload/thumbs/user-id/as/se/asset-id-fullsize.jpeg',
      });
      expect(mocks.move.create).toHaveBeenCalledWith({
        entityId: assetStub.image.id,
        pathType: AssetPathType.PREVIEW,
        oldPath: '/uploads/user-id/thumbs/path.jpg',
        newPath: 'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
      });
      expect(mocks.move.create).toHaveBeenCalledWith({
        entityId: assetStub.image.id,
        pathType: AssetPathType.THUMBNAIL,
        oldPath: '/uploads/user-id/webp/path.ext',
        newPath: 'upload/thumbs/user-id/as/se/asset-id-thumbnail.webp',
      });
      expect(mocks.move.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('handleGenerateThumbnails', () => {
    let rawBuffer: Buffer;
    let fullsizeBuffer: Buffer;
    let extractedBuffer: Buffer;
    let rawInfo: RawImageInfo;

    beforeEach(() => {
      fullsizeBuffer = Buffer.from('embedded image data');
      rawBuffer = Buffer.from('raw image data');
      extractedBuffer = Buffer.from('embedded image file');
      rawInfo = { width: 100, height: 100, channels: 3 };
      mocks.media.decodeImage.mockImplementation((input) =>
        Promise.resolve(
          typeof input === 'string'
            ? { data: rawBuffer, info: rawInfo as OutputInfo } // string implies original file
            : { data: fullsizeBuffer, info: rawInfo as OutputInfo }, // buffer implies embedded image extracted
        ),
      );
    });

    it('should skip thumbnail generation if asset not found', async () => {
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(void 0);
      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalledWith();
    });

    it('should skip thumbnail generation if asset type is unknown', async () => {
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue({ ...assetStub.image, type: 'foo' as AssetType });

      await expect(sut.handleGenerateThumbnails({ id: assetStub.image.id })).resolves.toBe(JobStatus.SKIPPED);
      expect(mocks.media.probe).not.toHaveBeenCalled();
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalledWith();
    });

    it('should skip video thumbnail generation if no video stream', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.noVideoStreams);
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.video);
      await expect(sut.handleGenerateThumbnails({ id: assetStub.video.id })).rejects.toThrowError();
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalledWith();
    });

    it('should skip invisible assets', async () => {
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.livePhotoMotionAsset);

      expect(await sut.handleGenerateThumbnails({ id: assetStub.livePhotoMotionAsset.id })).toEqual(JobStatus.SKIPPED);

      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalledWith();
    });

    it('should delete previous preview if different path', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { thumbnail: { format: ImageFormat.WEBP } } });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.image);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.storage.unlink).toHaveBeenCalledWith('/uploads/user-id/thumbs/path.jpg');
    });

    it('should generate P3 thumbnails for a wide gamut image', async () => {
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue({
        ...assetStub.image,
        exifInfo: { profileDescription: 'Adobe RGB', bitsPerSample: 14 } as Exif,
      });
      const thumbhashBuffer = Buffer.from('a thumbhash', 'utf8');
      mocks.media.generateThumbhash.mockResolvedValue(thumbhashBuffer);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/as/se');

      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(assetStub.image.originalPath, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
        size: 1440,
      });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(2);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        rawBuffer,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.JPEG,
          size: 1440,
          quality: 80,
          processInvalidImages: false,
          raw: rawInfo,
        },
        'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
      );
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        rawBuffer,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.WEBP,
          size: 250,
          quality: 80,
          processInvalidImages: false,
          raw: rawInfo,
        },
        'upload/thumbs/user-id/as/se/asset-id-thumbnail.webp',
      );

      expect(mocks.media.generateThumbhash).toHaveBeenCalledOnce();
      expect(mocks.media.generateThumbhash).toHaveBeenCalledWith(rawBuffer, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
        raw: rawInfo,
      });

      expect(mocks.asset.upsertFiles).toHaveBeenCalledWith([
        {
          assetId: 'asset-id',
          type: AssetFileType.PREVIEW,
          path: 'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
        },
        {
          assetId: 'asset-id',
          type: AssetFileType.THUMBNAIL,
          path: 'upload/thumbs/user-id/as/se/asset-id-thumbnail.webp',
        },
      ]);
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: 'asset-id', thumbhash: thumbhashBuffer });
    });

    it('should generate a thumbnail for a video', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStream2160p);
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.video);
      await sut.handleGenerateThumbnails({ id: assetStub.video.id });

      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/as/se');
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
        expect.objectContaining({
          inputOptions: ['-skip_frame nointra', '-sws_flags accurate_rnd+full_chroma_int'],
          outputOptions: [
            '-fps_mode vfr',
            '-frames:v 1',
            '-update 1',
            '-v verbose',
            String.raw`-vf fps=12:eof_action=pass:round=down,thumbnail=12,select=gt(scene\,0.1)-eq(prev_selected_n\,n)+isnan(prev_selected_n)+gt(n\,20),trim=end_frame=2,reverse,scale=-2:1440:flags=lanczos+accurate_rnd+full_chroma_int:out_range=pc`,
          ],
          twoPass: false,
        }),
      );
      expect(mocks.asset.upsertFiles).toHaveBeenCalledWith([
        {
          assetId: 'asset-id',
          type: AssetFileType.PREVIEW,
          path: 'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
        },
        {
          assetId: 'asset-id',
          type: AssetFileType.THUMBNAIL,
          path: 'upload/thumbs/user-id/as/se/asset-id-thumbnail.webp',
        },
      ]);
    });

    it('should tonemap thumbnail for hdr video', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamHDR);
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.video);
      await sut.handleGenerateThumbnails({ id: assetStub.video.id });

      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/as/se');
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
        expect.objectContaining({
          inputOptions: ['-skip_frame nointra', '-sws_flags accurate_rnd+full_chroma_int'],
          outputOptions: [
            '-fps_mode vfr',
            '-frames:v 1',
            '-update 1',
            '-v verbose',
            String.raw`-vf fps=12:eof_action=pass:round=down,thumbnail=12,select=gt(scene\,0.1)-eq(prev_selected_n\,n)+isnan(prev_selected_n)+gt(n\,20),trim=end_frame=2,reverse,tonemapx=tonemap=hable:desat=0:p=bt709:t=bt709:m=bt709:r=pc:peak=100:format=yuv420p`,
          ],
          twoPass: false,
        }),
      );
      expect(mocks.asset.upsertFiles).toHaveBeenCalledWith([
        {
          assetId: 'asset-id',
          type: AssetFileType.PREVIEW,
          path: 'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
        },
        {
          assetId: 'asset-id',
          type: AssetFileType.THUMBNAIL,
          path: 'upload/thumbs/user-id/as/se/asset-id-thumbnail.webp',
        },
      ]);
    });

    it('should always generate video thumbnail in one pass', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamHDR);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { twoPass: true, maxBitrate: '5000k' },
      });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.video);
      await sut.handleGenerateThumbnails({ id: assetStub.video.id });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
        expect.objectContaining({
          inputOptions: ['-skip_frame nointra', '-sws_flags accurate_rnd+full_chroma_int'],
          outputOptions: [
            '-fps_mode vfr',
            '-frames:v 1',
            '-update 1',
            '-v verbose',
            String.raw`-vf fps=12:eof_action=pass:round=down,thumbnail=12,select=gt(scene\,0.1)-eq(prev_selected_n\,n)+isnan(prev_selected_n)+gt(n\,20),trim=end_frame=2,reverse,tonemapx=tonemap=hable:desat=0:p=bt709:t=bt709:m=bt709:r=pc:peak=100:format=yuv420p`,
          ],
          twoPass: false,
        }),
      );
    });
    it('should not skip intra frames for MTS file', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamMTS);
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.video);
      await sut.handleGenerateThumbnails({ id: assetStub.video.id });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
        expect.objectContaining({
          inputOptions: ['-sws_flags accurate_rnd+full_chroma_int'],
          outputOptions: expect.any(Array),
          progress: expect.any(Object),
          twoPass: false,
        }),
      );
    });

    it('should use scaling divisible by 2 even when using quick sync', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStream2160p);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.QSV } });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.video);
      await sut.handleGenerateThumbnails({ id: assetStub.video.id });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([expect.stringContaining('scale=-2:1440')]),
          twoPass: false,
        }),
      );
    });

    it.each(Object.values(ImageFormat))('should generate an image preview in %s format', async (format) => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { preview: { format } } });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.image);
      const thumbhashBuffer = Buffer.from('a thumbhash', 'utf8');
      mocks.media.generateThumbhash.mockResolvedValue(thumbhashBuffer);
      const previewPath = `upload/thumbs/user-id/as/se/asset-id-preview.${format}`;
      const thumbnailPath = `upload/thumbs/user-id/as/se/asset-id-thumbnail.webp`;

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/as/se');
      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(assetStub.image.originalPath, {
        colorspace: Colorspace.SRGB,
        processInvalidImages: false,
        size: 1440,
      });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(2);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        rawBuffer,
        {
          colorspace: Colorspace.SRGB,
          format,
          size: 1440,
          quality: 80,
          processInvalidImages: false,
          raw: rawInfo,
        },
        previewPath,
      );
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        rawBuffer,
        {
          colorspace: Colorspace.SRGB,
          format: ImageFormat.WEBP,
          size: 250,
          quality: 80,
          processInvalidImages: false,
          raw: rawInfo,
        },
        thumbnailPath,
      );
    });

    it.each(Object.values(ImageFormat))('should generate an image thumbnail in %s format', async (format) => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { thumbnail: { format } } });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.image);
      const thumbhashBuffer = Buffer.from('a thumbhash', 'utf8');
      mocks.media.generateThumbhash.mockResolvedValue(thumbhashBuffer);
      const previewPath = `upload/thumbs/user-id/as/se/asset-id-preview.jpeg`;
      const thumbnailPath = `upload/thumbs/user-id/as/se/asset-id-thumbnail.${format}`;

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/as/se');
      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(assetStub.image.originalPath, {
        colorspace: Colorspace.SRGB,
        processInvalidImages: false,
        size: 1440,
      });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(2);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        rawBuffer,
        {
          colorspace: Colorspace.SRGB,
          format: ImageFormat.JPEG,
          size: 1440,
          quality: 80,
          processInvalidImages: false,
          raw: rawInfo,
        },
        previewPath,
      );
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        rawBuffer,
        {
          colorspace: Colorspace.SRGB,
          format,
          size: 250,
          quality: 80,
          processInvalidImages: false,
          raw: rawInfo,
        },
        thumbnailPath,
      );
    });

    it('should delete previous thumbnail if different path', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { thumbnail: { format: ImageFormat.WEBP } } });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.image);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.storage.unlink).toHaveBeenCalledWith('/uploads/user-id/webp/path.ext');
    });

    it('should extract embedded image if enabled and available', async () => {
      mocks.media.extract.mockResolvedValue({ buffer: extractedBuffer, format: RawExtractedFormat.JPEG });
      mocks.media.getImageDimensions.mockResolvedValue({ width: 3840, height: 2160 });
      mocks.systemMetadata.get.mockResolvedValue({ image: { extractEmbedded: true } });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.imageDng);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(extractedBuffer, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
        size: 1440,
      });
    });

    it('should resize original image if embedded image is too small', async () => {
      mocks.media.extract.mockResolvedValue({ buffer: extractedBuffer, format: RawExtractedFormat.JPEG });
      mocks.media.getImageDimensions.mockResolvedValue({ width: 1000, height: 1000 });
      mocks.systemMetadata.get.mockResolvedValue({ image: { extractEmbedded: true } });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.imageDng);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.media.decodeImage).toHaveBeenCalledWith(assetStub.imageDng.originalPath, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
        size: 1440,
      });
    });

    it('should resize original image if embedded image not found', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { extractEmbedded: true } });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.imageDng);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(assetStub.imageDng.originalPath, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
        size: 1440,
      });
      expect(mocks.media.getImageDimensions).not.toHaveBeenCalled();
    });

    it('should resize original image if embedded image extraction is not enabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { extractEmbedded: false } });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.imageDng);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.media.extract).not.toHaveBeenCalled();
      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(assetStub.imageDng.originalPath, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
        size: 1440,
      });
      expect(mocks.media.getImageDimensions).not.toHaveBeenCalled();
    });

    it('should process invalid images if enabled', async () => {
      vi.stubEnv('IMMICH_PROCESS_INVALID_IMAGES', 'true');

      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.imageDng);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(
        assetStub.imageDng.originalPath,
        expect.objectContaining({ processInvalidImages: true }),
      );

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(2);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        rawBuffer,
        expect.objectContaining({ processInvalidImages: false }),
        'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
      );
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        rawBuffer,
        expect.objectContaining({ processInvalidImages: false }),
        'upload/thumbs/user-id/as/se/asset-id-thumbnail.webp',
      );

      expect(mocks.media.generateThumbhash).toHaveBeenCalledOnce();
      expect(mocks.media.generateThumbhash).toHaveBeenCalledWith(
        rawBuffer,
        expect.objectContaining({ processInvalidImages: false }),
      );

      expect(mocks.media.getImageDimensions).not.toHaveBeenCalled();
      vi.unstubAllEnvs();
    });

    it('should extract full-size JPEG preview from RAW', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        image: { fullsize: { enabled: true, format: ImageFormat.WEBP }, extractEmbedded: true },
      });
      mocks.media.extract.mockResolvedValue({ buffer: extractedBuffer, format: RawExtractedFormat.JPEG });
      mocks.media.getImageDimensions.mockResolvedValue({ width: 3840, height: 2160 });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.imageDng);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(extractedBuffer, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
        size: 1440, // capped to preview size as fullsize conversion is skipped
      });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(2);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        fullsizeBuffer,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.JPEG,
          size: 1440,
          quality: 80,
          processInvalidImages: false,
          raw: rawInfo,
        },
        'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
      );
    });

    it('should convert full-size WEBP preview from JXL preview of RAW', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        image: { fullsize: { enabled: true, format: ImageFormat.WEBP }, extractEmbedded: true },
      });
      mocks.media.extract.mockResolvedValue({ buffer: extractedBuffer, format: RawExtractedFormat.JXL });
      mocks.media.getImageDimensions.mockResolvedValue({ width: 3840, height: 2160 });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.imageDng);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(extractedBuffer, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
      });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(3);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        fullsizeBuffer,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.WEBP,
          quality: 80,
          processInvalidImages: false,
          raw: rawInfo,
        },
        'upload/thumbs/user-id/as/se/asset-id-fullsize.webp',
      );
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        fullsizeBuffer,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.JPEG,
          size: 1440,
          quality: 80,
          processInvalidImages: false,
          raw: rawInfo,
        },
        'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
      );
    });

    it('should generate full-size preview directly from RAW images when extractEmbedded is false', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { fullsize: { enabled: true }, extractEmbedded: false } });
      mocks.media.extract.mockResolvedValue({ buffer: extractedBuffer, format: RawExtractedFormat.JPEG });
      mocks.media.getImageDimensions.mockResolvedValue({ width: 3840, height: 2160 });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.imageDng);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(assetStub.imageDng.originalPath, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
      });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(3);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        rawBuffer,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.JPEG,
          quality: 80,
          processInvalidImages: false,
          raw: rawInfo,
        },
        'upload/thumbs/user-id/as/se/asset-id-fullsize.jpeg',
      );
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        rawBuffer,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.JPEG,
          quality: 80,
          size: 1440,
          processInvalidImages: false,
          raw: rawInfo,
        },
        'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
      );
    });

    it('should generate full-size preview from non-web-friendly images', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { fullsize: { enabled: true } } });
      mocks.media.extract.mockResolvedValue({ buffer: extractedBuffer, format: RawExtractedFormat.JPEG });
      mocks.media.getImageDimensions.mockResolvedValue({ width: 3840, height: 2160 });
      // HEIF/HIF image taken by cameras are not web-friendly, only has limited support on Safari.
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.imageHif);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(assetStub.imageHif.originalPath, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
      });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(3);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        rawBuffer,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.JPEG,
          quality: 80,
          processInvalidImages: false,
          raw: rawInfo,
        },
        'upload/thumbs/user-id/as/se/asset-id-fullsize.jpeg',
      );
    });

    it('should skip generating full-size preview for web-friendly images', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { fullsize: { enabled: true } } });
      mocks.media.extract.mockResolvedValue({ buffer: extractedBuffer, format: RawExtractedFormat.JPEG });
      mocks.media.getImageDimensions.mockResolvedValue({ width: 3840, height: 2160 });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.image);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(assetStub.image.originalPath, {
        colorspace: Colorspace.SRGB,
        processInvalidImages: false,
        size: 1440,
      });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(2);
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'upload/thumbs/user-id/as/se/asset-id-fullsize.jpeg',
      );
    });

    it('should respect encoding options when generating full-size preview', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        image: { fullsize: { enabled: true, format: ImageFormat.WEBP, quality: 90 } },
      });
      mocks.media.extract.mockResolvedValue({ buffer: extractedBuffer, format: RawExtractedFormat.JPEG });
      mocks.media.getImageDimensions.mockResolvedValue({ width: 3840, height: 2160 });
      // HEIF/HIF image taken by cameras are not web-friendly, only has limited support on Safari.
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(assetStub.imageHif);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(assetStub.imageHif.originalPath, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
      });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(3);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        rawBuffer,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.WEBP,
          quality: 90,
          processInvalidImages: false,
          raw: rawInfo,
        },
        'upload/thumbs/user-id/as/se/asset-id-fullsize.webp',
      );
    });
  });

  describe('handleGeneratePersonThumbnail', () => {
    it('should skip if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await expect(sut.handleGeneratePersonThumbnail({ id: 'person-1' })).resolves.toBe(JobStatus.SKIPPED);
      expect(mocks.asset.getByIds).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.get).toHaveBeenCalled();
    });

    it('should skip a person not found', async () => {
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should skip a person without a face asset id', async () => {
      mocks.person.getById.mockResolvedValue(personStub.noThumbnail);
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should skip a person with face not found', async () => {
      await sut.handleGeneratePersonThumbnail({ id: 'person-1' });
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should generate a thumbnail', async () => {
      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.newThumbnailMiddle);
      mocks.media.generateThumbnail.mockResolvedValue();
      const data = Buffer.from('');
      const info = { width: 1000, height: 1000 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });

      await expect(sut.handleGeneratePersonThumbnail({ id: personStub.primaryPerson.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );

      expect(mocks.person.getDataForThumbnailGenerationJob).toHaveBeenCalledWith(personStub.primaryPerson.id);
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith('upload/thumbs/admin_id/pe/rs');
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(personThumbnailStub.newThumbnailMiddle.originalPath, {
        colorspace: Colorspace.P3,
        orientation: undefined,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        data,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.JPEG,
          quality: 80,
          crop: {
            left: 238,
            top: 163,
            width: 274,
            height: 274,
          },
          raw: info,
          processInvalidImages: false,
          size: 250,
        },
        'upload/thumbs/admin_id/pe/rs/person-1.jpeg',
      );
      expect(mocks.person.update).toHaveBeenCalledWith({
        id: 'person-1',
        thumbnailPath: 'upload/thumbs/admin_id/pe/rs/person-1.jpeg',
      });
    });

    it('should use preview path if video', async () => {
      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.videoThumbnail);
      mocks.media.generateThumbnail.mockResolvedValue();
      const data = Buffer.from('');
      const info = { width: 1000, height: 1000 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });

      await expect(sut.handleGeneratePersonThumbnail({ id: personStub.primaryPerson.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );

      expect(mocks.person.getDataForThumbnailGenerationJob).toHaveBeenCalledWith(personStub.primaryPerson.id);
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith('upload/thumbs/admin_id/pe/rs');
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(personThumbnailStub.newThumbnailMiddle.previewPath, {
        colorspace: Colorspace.P3,
        orientation: undefined,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        data,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.JPEG,
          quality: 80,
          crop: {
            left: 238,
            top: 163,
            width: 274,
            height: 274,
          },
          raw: info,
          processInvalidImages: false,
          size: 250,
        },
        'upload/thumbs/admin_id/pe/rs/person-1.jpeg',
      );
      expect(mocks.person.update).toHaveBeenCalledWith({
        id: 'person-1',
        thumbnailPath: 'upload/thumbs/admin_id/pe/rs/person-1.jpeg',
      });
    });

    it('should generate a thumbnail without going negative', async () => {
      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.newThumbnailStart);
      mocks.media.generateThumbnail.mockResolvedValue();
      const data = Buffer.from('');
      const info = { width: 2160, height: 3840 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });

      await expect(sut.handleGeneratePersonThumbnail({ id: personStub.primaryPerson.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );

      expect(mocks.media.decodeImage).toHaveBeenCalledWith(personThumbnailStub.newThumbnailStart.originalPath, {
        colorspace: Colorspace.P3,
        orientation: undefined,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        data,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.JPEG,
          quality: 80,
          crop: {
            left: 0,
            top: 85,
            width: 510,
            height: 510,
          },
          raw: info,
          processInvalidImages: false,
          size: 250,
        },
        'upload/thumbs/admin_id/pe/rs/person-1.jpeg',
      );
    });

    it('should generate a thumbnail without overflowing', async () => {
      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.newThumbnailEnd);
      mocks.person.update.mockResolvedValue(personStub.primaryPerson);
      mocks.media.generateThumbnail.mockResolvedValue();
      const data = Buffer.from('');
      const info = { width: 1000, height: 1000 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });

      await expect(sut.handleGeneratePersonThumbnail({ id: personStub.primaryPerson.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );

      expect(mocks.media.decodeImage).toHaveBeenCalledWith(personThumbnailStub.newThumbnailEnd.originalPath, {
        colorspace: Colorspace.P3,
        orientation: undefined,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        data,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.JPEG,
          quality: 80,
          crop: {
            left: 591,
            top: 591,
            width: 408,
            height: 408,
          },
          raw: info,
          processInvalidImages: false,
          size: 250,
        },
        'upload/thumbs/admin_id/pe/rs/person-1.jpeg',
      );
    });

    it('should handle negative coordinates', async () => {
      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.negativeCoordinate);
      mocks.person.update.mockResolvedValue(personStub.primaryPerson);
      mocks.media.generateThumbnail.mockResolvedValue();
      const data = Buffer.from('');
      const info = { width: 4624, height: 3080 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });

      await expect(sut.handleGeneratePersonThumbnail({ id: personStub.primaryPerson.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );

      expect(mocks.media.decodeImage).toHaveBeenCalledWith(personThumbnailStub.negativeCoordinate.originalPath, {
        colorspace: Colorspace.P3,
        orientation: undefined,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        data,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.JPEG,
          quality: 80,
          crop: {
            left: 0,
            top: 62,
            width: 412,
            height: 412,
          },
          raw: info,
          processInvalidImages: false,
          size: 250,
        },
        'upload/thumbs/admin_id/pe/rs/person-1.jpeg',
      );
    });

    it('should handle overflowing coordinate', async () => {
      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.overflowingCoordinate);
      mocks.person.update.mockResolvedValue(personStub.primaryPerson);
      mocks.media.generateThumbnail.mockResolvedValue();
      const data = Buffer.from('');
      const info = { width: 4624, height: 3080 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });

      await expect(sut.handleGeneratePersonThumbnail({ id: personStub.primaryPerson.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );

      expect(mocks.media.decodeImage).toHaveBeenCalledWith(personThumbnailStub.overflowingCoordinate.originalPath, {
        colorspace: Colorspace.P3,
        orientation: undefined,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        data,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.JPEG,
          quality: 80,
          crop: {
            left: 4485,
            top: 94,
            width: 138,
            height: 138,
          },
          raw: info,
          processInvalidImages: false,
          size: 250,
        },
        'upload/thumbs/admin_id/pe/rs/person-1.jpeg',
      );
    });

    it('should use embedded preview if enabled and raw image', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { extractEmbedded: true } });
      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.rawEmbeddedThumbnail);
      mocks.person.update.mockResolvedValue(personStub.primaryPerson);
      mocks.media.generateThumbnail.mockResolvedValue();
      const extracted = Buffer.from('');
      const data = Buffer.from('');
      const info = { width: 2160, height: 3840 } as OutputInfo;
      mocks.media.extract.mockResolvedValue({ buffer: extracted, format: RawExtractedFormat.JPEG });
      mocks.media.decodeImage.mockResolvedValue({ data, info });
      mocks.media.getImageDimensions.mockResolvedValue(info);

      await expect(sut.handleGeneratePersonThumbnail({ id: personStub.primaryPerson.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );

      expect(mocks.media.extract).toHaveBeenCalledWith(personThumbnailStub.rawEmbeddedThumbnail.originalPath);
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(extracted, {
        colorspace: Colorspace.P3,
        orientation: ExifOrientation.Horizontal,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        data,
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.JPEG,
          quality: 80,
          crop: {
            height: 844,
            left: 388,
            top: 730,
            width: 844,
          },
          raw: info,
          processInvalidImages: false,
          size: 250,
        },
        'upload/thumbs/admin_id/pe/rs/person-1.jpeg',
      );
    });

    it('should not use embedded preview if enabled and not raw image', async () => {
      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.newThumbnailMiddle);
      mocks.media.generateThumbnail.mockResolvedValue();
      const data = Buffer.from('');
      const info = { width: 2160, height: 3840 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });

      await expect(sut.handleGeneratePersonThumbnail({ id: personStub.primaryPerson.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );

      expect(mocks.media.extract).not.toHaveBeenCalled();
      expect(mocks.media.generateThumbnail).toHaveBeenCalled();
    });

    it('should not use embedded preview if enabled and raw image if not exists', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { extractEmbedded: true } });
      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.rawEmbeddedThumbnail);
      mocks.media.generateThumbnail.mockResolvedValue();
      const data = Buffer.from('');
      const info = { width: 2160, height: 3840 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });

      await expect(sut.handleGeneratePersonThumbnail({ id: personStub.primaryPerson.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );

      expect(mocks.media.extract).toHaveBeenCalledWith(personThumbnailStub.rawEmbeddedThumbnail.originalPath);
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(personThumbnailStub.rawEmbeddedThumbnail.originalPath, {
        colorspace: Colorspace.P3,
        orientation: undefined,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalled();
    });

    it('should not use embedded preview if enabled and raw image if low resolution', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { extractEmbedded: true } });
      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.rawEmbeddedThumbnail);
      mocks.media.generateThumbnail.mockResolvedValue();
      const extracted = Buffer.from('');
      const data = Buffer.from('');
      const info = { width: 1000, height: 1000 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });
      mocks.media.extract.mockResolvedValue({ buffer: extracted, format: RawExtractedFormat.JPEG });
      mocks.media.getImageDimensions.mockResolvedValue(info);

      await expect(sut.handleGeneratePersonThumbnail({ id: personStub.primaryPerson.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );

      expect(mocks.media.extract).toHaveBeenCalledWith(personThumbnailStub.rawEmbeddedThumbnail.originalPath);
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(personThumbnailStub.rawEmbeddedThumbnail.originalPath, {
        colorspace: Colorspace.P3,
        orientation: undefined,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalled();
    });
  });

  describe('handleQueueVideoConversion', () => {
    it('should queue all video assets', async () => {
      mocks.assetJob.streamForVideoConversion.mockReturnValue(makeStream([assetStub.video]));
      mocks.person.getAll.mockReturnValue(makeStream());

      await sut.handleQueueVideoConversion({ force: true });

      expect(mocks.assetJob.streamForVideoConversion).toHaveBeenCalledWith(true);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.VIDEO_CONVERSION,
          data: { id: assetStub.video.id },
        },
      ]);
    });

    it('should queue all video assets without encoded videos', async () => {
      mocks.assetJob.streamForVideoConversion.mockReturnValue(makeStream([assetStub.video]));

      await sut.handleQueueVideoConversion({});

      expect(mocks.assetJob.streamForVideoConversion).toHaveBeenCalledWith(void 0);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.VIDEO_CONVERSION,
          data: { id: assetStub.video.id },
        },
      ]);
    });
  });

  describe('handleVideoConversion', () => {
    beforeEach(() => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue(assetStub.video);
      sut.videoInterfaces = { dri: ['renderD128'], mali: true };
    });

    it('should skip transcoding if asset not found', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue(void 0);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.probe).not.toHaveBeenCalled();
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should transcode the highest bitrate video stream', async () => {
      mocks.logger.isLevelEnabled.mockReturnValue(false);
      mocks.media.probe.mockResolvedValue(probeStub.multipleVideoStreams);

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mocks.media.probe).toHaveBeenCalledWith('/original/path.ext', { countFrames: false });
      expect(mocks.systemMetadata.get).toHaveBeenCalled();
      expect(mocks.storage.mkdirSync).toHaveBeenCalled();
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-map 0:1', '-map 0:3']),
          twoPass: false,
        }),
      );
    });

    it('should transcode the highest bitrate audio stream', async () => {
      mocks.logger.isLevelEnabled.mockReturnValue(false);
      mocks.media.probe.mockResolvedValue(probeStub.multipleAudioStreams);

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mocks.media.probe).toHaveBeenCalledWith('/original/path.ext', { countFrames: false });
      expect(mocks.systemMetadata.get).toHaveBeenCalled();
      expect(mocks.storage.mkdirSync).toHaveBeenCalled();
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-map 0:0', '-map 0:2']),
          twoPass: false,
        }),
      );
    });

    it('should skip a video without any streams', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.noVideoStreams);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should skip a video without any height', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.noHeight);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should throw an error if an unknown transcode policy is configured', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.noAudioStreams);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: 'foo' } } as never as SystemConfig);

      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).rejects.toThrowError();
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should throw an error if transcoding fails and hw acceleration is disabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.multipleVideoStreams);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { transcode: TranscodePolicy.ALL, accel: TranscodeHWAccel.DISABLED },
      });
      mocks.media.transcode.mockRejectedValue(new Error('Error transcoding video'));

      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).resolves.toBe(JobStatus.FAILED);
      expect(mocks.media.transcode).toHaveBeenCalledTimes(1);
    });

    it('should transcode when set to all', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.multipleVideoStreams);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.ALL } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.any(Array),
          twoPass: false,
        }),
      );
    });

    it('should transcode when optimal and too big', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStream2160p);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.OPTIMAL } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.any(Array),
          twoPass: false,
        }),
      );
    });

    it('should transcode when policy bitrate and bitrate higher than max bitrate', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStream40Mbps);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.BITRATE, maxBitrate: '30M' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.any(Array),
          twoPass: false,
        }),
      );
    });

    it('should transcode when max bitrate is not a number', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStream40Mbps);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.BITRATE, maxBitrate: 'foo' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.any(Array),
          twoPass: false,
        }),
      );
    });

    it('should not scale resolution if no target resolution', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStream2160p);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { transcode: TranscodePolicy.ALL, targetResolution: 'original' },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('scale')]),
          twoPass: false,
        }),
      );
    });

    it('should scale horizontally when video is horizontal', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStream2160p);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.OPTIMAL } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([expect.stringMatching(/scale(_.+)?=-2:720/)]),
          twoPass: false,
        }),
      );
    });

    it('should scale vertically when video is vertical', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamVertical2160p);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.OPTIMAL } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([expect.stringMatching(/scale(_.+)?=720:-2/)]),
          twoPass: false,
        }),
      );
    });

    it('should always scale video if height is uneven', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamOddHeight);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { transcode: TranscodePolicy.ALL, targetResolution: 'original' },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([expect.stringMatching(/scale(_.+)?=-2:354/)]),
          twoPass: false,
        }),
      );
    });

    it('should always scale video if width is uneven', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamOddWidth);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { transcode: TranscodePolicy.ALL, targetResolution: 'original' },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([expect.stringMatching(/scale(_.+)?=354:-2/)]),
          twoPass: false,
        }),
      );
    });

    it('should copy video stream when video matches target', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { targetVideoCodec: VideoCodec.HEVC, acceptedAudioCodecs: [AudioCodec.AAC] },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v copy', '-c:a aac']),
          twoPass: false,
        }),
      );
    });

    it('should not include hevc tag when target is hevc and video stream is copied from a different codec', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamH264);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          targetVideoCodec: VideoCodec.HEVC,
          acceptedVideoCodecs: [VideoCodec.H264, VideoCodec.HEVC],
          acceptedAudioCodecs: [AudioCodec.AAC],
        },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining(['-tag:v hvc1']),
          twoPass: false,
        }),
      );
    });

    it('should include hevc tag when target is hevc and copying hevc video stream', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          targetVideoCodec: VideoCodec.HEVC,
          acceptedVideoCodecs: [VideoCodec.H264, VideoCodec.HEVC],
          acceptedAudioCodecs: [AudioCodec.AAC],
        },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v copy', '-tag:v hvc1']),
          twoPass: false,
        }),
      );
    });

    it('should copy audio stream when audio matches target', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.audioStreamAac);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.OPTIMAL } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v h264', '-c:a copy']),
          twoPass: false,
        }),
      );
    });

    it('should remux when input is not an accepted container', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamAvi);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v copy', '-c:a copy']),
          twoPass: false,
        }),
      );
    });

    it('should throw an exception if transcode value is invalid', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStream2160p);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: 'invalid' as any } });

      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).rejects.toThrowError();
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should not transcode if transcoding is disabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStream2160p);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.DISABLED } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should not remux when input is not an accepted container and transcoding is disabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.DISABLED } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should not transcode if target codec is invalid', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStream2160p);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: 'invalid' as any } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should delete existing transcode if current policy does not require transcoding', async () => {
      const asset = assetStub.hasEncodedVideo;
      mocks.media.probe.mockResolvedValue(probeStub.videoStream2160p);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.DISABLED } });
      mocks.assetJob.getForVideoConversion.mockResolvedValue(asset);

      await sut.handleVideoConversion({ id: asset.id });

      expect(mocks.media.transcode).not.toHaveBeenCalled();
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: { files: [asset.encodedVideoPath] },
      });
    });

    it('should set max bitrate if above 0', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { maxBitrate: '4500k' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v h264', '-maxrate 4500k', '-bufsize 9000k']),
          twoPass: false,
        }),
      );
    });

    it('should default max bitrate to kbps if no unit is provided', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { maxBitrate: '4500' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v h264', '-maxrate 4500k', '-bufsize 9000k']),
          twoPass: false,
        }),
      );
    });

    it('should transcode in two passes for h264/h265 when enabled and max bitrate is above 0', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { twoPass: true, maxBitrate: '4500k' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v h264', '-b:v 3104k', '-minrate 1552k', '-maxrate 4500k']),
          twoPass: true,
        }),
      );
    });

    it('should fallback to one pass for h264/h265 if two-pass is enabled but no max bitrate is set', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { twoPass: true } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v h264', '-c:a copy']),
          twoPass: false,
        }),
      );
    });

    it('should transcode by bitrate in two passes for vp9 when two pass mode and max bitrate are enabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          maxBitrate: '4500k',
          twoPass: true,
          targetVideoCodec: VideoCodec.VP9,
        },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-b:v 3104k', '-minrate 1552k', '-maxrate 4500k']),
          twoPass: true,
        }),
      );
    });

    it('should transcode by crf in two passes for vp9 when two pass mode is enabled and max bitrate is disabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          maxBitrate: '0',
          twoPass: true,
          targetVideoCodec: VideoCodec.VP9,
        },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-maxrate')]),
          twoPass: true,
        }),
      );
    });

    it('should configure preset for vp9', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.VP9, preset: 'slow' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-cpu-used 2']),
          twoPass: false,
        }),
      );
    });

    it('should not configure preset for vp9 if invalid', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { preset: 'invalid', targetVideoCodec: VideoCodec.VP9 } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-cpu-used')]),
          twoPass: false,
        }),
      );
    });

    it('should configure threads if above 0', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.VP9, threads: 2 } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-threads 2']),
          twoPass: false,
        }),
      );
    });

    it('should disable thread pooling for h264 if thread limit is 1', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { threads: 1 } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-threads 1', '-x264-params frame-threads=1:pools=none']),
          twoPass: false,
        }),
      );
    });

    it('should omit thread flags for h264 if thread limit is at or below 0', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { threads: 0 } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-threads')]),
          twoPass: false,
        }),
      );
    });

    it('should disable thread pooling for hevc if thread limit is 1', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamVp9);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { threads: 1, targetVideoCodec: VideoCodec.HEVC } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v hevc', '-threads 1', '-x265-params frame-threads=1:pools=none']),
          twoPass: false,
        }),
      );
    });

    it('should omit thread flags for hevc if thread limit is at or below 0', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamVp9);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { threads: 0, targetVideoCodec: VideoCodec.HEVC } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-threads')]),
          twoPass: false,
        }),
      );
    });

    it('should use av1 if specified', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamVp9);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.AV1 } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([
            '-c:v libsvtav1',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-map 0:0',
            '-map 0:3',
            '-v verbose',
            '-vf scale=-2:720',
            '-preset 12',
            '-crf 23',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should map `veryslow` preset to 4 for av1', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamVp9);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.AV1, preset: 'veryslow' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-preset 4']),
          twoPass: false,
        }),
      );
    });

    it('should set max bitrate for av1 if specified', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamVp9);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.AV1, maxBitrate: '2M' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-svtav1-params mbr=2M']),
          twoPass: false,
        }),
      );
    });

    it('should set threads for av1 if specified', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamVp9);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.AV1, threads: 4 } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-svtav1-params lp=4']),
          twoPass: false,
        }),
      );
    });

    it('should set both bitrate and threads for av1 if specified', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamVp9);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { targetVideoCodec: VideoCodec.AV1, threads: 4, maxBitrate: '2M' },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-svtav1-params lp=4:mbr=2M']),
          twoPass: false,
        }),
      );
    });

    it('should skip transcoding for audioless videos with optimal policy if video codec is correct', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.noAudioStreams);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          targetVideoCodec: VideoCodec.HEVC,
          transcode: TranscodePolicy.OPTIMAL,
          targetResolution: '1080p',
        },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should fail if hwaccel is enabled for an unsupported codec', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.NVENC, targetVideoCodec: VideoCodec.VP9 },
      });
      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).rejects.toThrowError();
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should fail if hwaccel option is invalid', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: 'invalid' as any } });
      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).rejects.toThrowError();
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should set options for nvenc', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.NVENC } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-init_hw_device cuda=cuda:0', '-filter_hw_device cuda']),
          outputOptions: expect.arrayContaining([
            '-tune hq',
            '-qmin 0',
            '-rc-lookahead 20',
            '-i_qfactor 0.75',
            `-c:v h264_nvenc`,
            '-c:a copy',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-map 0:0',
            '-map 0:3',
            '-g 256',
            '-v verbose',
            '-vf hwupload_cuda,scale_cuda=-2:720:format=nv12',
            '-preset p1',
            '-cq:v 23',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should set two pass options for nvenc when enabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          accel: TranscodeHWAccel.NVENC,
          maxBitrate: '10000k',
          twoPass: true,
        },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-init_hw_device cuda=cuda:0', '-filter_hw_device cuda']),
          outputOptions: expect.arrayContaining([expect.stringContaining('-multipass')]),
          twoPass: false,
        }),
      );
    });

    it('should set vbr options for nvenc when max bitrate is enabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.NVENC, maxBitrate: '10000k' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-init_hw_device cuda=cuda:0', '-filter_hw_device cuda']),
          outputOptions: expect.arrayContaining(['-cq:v 23', '-maxrate 10000k', '-bufsize 6897k']),
          twoPass: false,
        }),
      );
    });

    it('should set cq options for nvenc when max bitrate is disabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.NVENC, maxBitrate: '10000k' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-init_hw_device cuda=cuda:0', '-filter_hw_device cuda']),
          outputOptions: expect.not.stringContaining('-maxrate'),
          twoPass: false,
        }),
      );
    });

    it('should omit preset for nvenc if invalid', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.NVENC, preset: 'invalid' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-init_hw_device cuda=cuda:0', '-filter_hw_device cuda']),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-preset')]),
          twoPass: false,
        }),
      );
    });

    it('should ignore two pass for nvenc if max bitrate is disabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.NVENC } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-init_hw_device cuda=cuda:0', '-filter_hw_device cuda']),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-multipass')]),
          twoPass: false,
        }),
      );
    });

    it('should use hardware decoding for nvenc if enabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.NVENC, accelDecode: true },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel cuda',
            '-hwaccel_output_format cuda',
            '-noautorotate',
            '-threads 1',
          ]),
          outputOptions: expect.arrayContaining([expect.stringContaining('scale_cuda=-2:720:format=nv12')]),
          twoPass: false,
        }),
      );
    });

    it('should use hardware tone-mapping for nvenc if hardware decoding is enabled and should tone map', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamHDR);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.NVENC, accelDecode: true },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel cuda', '-hwaccel_output_format cuda']),
          outputOptions: expect.arrayContaining([
            expect.stringContaining(
              'tonemap_cuda=desat=0:matrix=bt709:primaries=bt709:range=pc:tonemap=hable:tonemap_mode=lum:transfer=bt709:peak=100:format=nv12',
            ),
          ]),
          twoPass: false,
        }),
      );
    });

    it('should set format to nv12 for nvenc if input is not yuv420p', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStream10Bit);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.NVENC, accelDecode: true },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel cuda', '-hwaccel_output_format cuda']),
          outputOptions: expect.arrayContaining([expect.stringContaining('scale_cuda=-2:720:format=nv12')]),
          twoPass: false,
        }),
      );
    });

    it('should set options for qsv', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.QSV, maxBitrate: '10000k' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-init_hw_device qsv=hw,child_device=/dev/dri/renderD128',
            '-filter_hw_device hw',
          ]),
          outputOptions: expect.arrayContaining([
            `-c:v h264_qsv`,
            '-c:a copy',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-map 0:0',
            '-map 0:3',
            '-bf 7',
            '-refs 5',
            '-g 256',
            '-v verbose',
            '-vf hwupload=extra_hw_frames=64,scale_qsv=-1:720:mode=hq:format=nv12',
            '-preset 7',
            '-global_quality:v 23',
            '-maxrate 10000k',
            '-bufsize 20000k',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should set options for qsv with custom dri node', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          accel: TranscodeHWAccel.QSV,
          maxBitrate: '10000k',
          preferredHwDevice: '/dev/dri/renderD128',
        },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-init_hw_device qsv=hw,child_device=/dev/dri/renderD128',
            '-filter_hw_device hw',
          ]),
          outputOptions: expect.any(Array),
          twoPass: false,
        }),
      );
    });

    it('should omit preset for qsv if invalid', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.QSV, preset: 'invalid' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-init_hw_device qsv=hw,child_device=/dev/dri/renderD128',
            '-filter_hw_device hw',
          ]),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-preset')]),
          twoPass: false,
        }),
      );
    });

    it('should set low power mode for qsv if target video codec is vp9', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.QSV, targetVideoCodec: VideoCodec.VP9 },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-init_hw_device qsv=hw,child_device=/dev/dri/renderD128',
            '-filter_hw_device hw',
          ]),
          outputOptions: expect.arrayContaining(['-low_power 1']),
          twoPass: false,
        }),
      );
    });

    it('should fail for qsv if no hw devices', async () => {
      sut.videoInterfaces = { dri: [], mali: false };
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.QSV } });

      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).rejects.toThrowError();

      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should prefer higher index renderD* device for qsv', async () => {
      sut.videoInterfaces = { dri: ['card1', 'renderD129', 'card0', 'renderD128'], mali: false };
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.QSV } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-init_hw_device qsv=hw,child_device=/dev/dri/renderD129',
            '-filter_hw_device hw',
          ]),
          outputOptions: expect.arrayContaining([`-c:v h264_qsv`]),
          twoPass: false,
        }),
      );
    });

    it('should use hardware decoding for qsv if enabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.QSV, accelDecode: true },
      });

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel qsv',
            '-hwaccel_output_format qsv',
            '-async_depth 4',
            '-noautorotate',
            '-threads 1',
            '-qsv_device /dev/dri/renderD128',
          ]),
          outputOptions: expect.arrayContaining([expect.stringContaining('scale_qsv=-1:720:async_depth=4:mode=hq')]),
          twoPass: false,
        }),
      );
    });

    it('should use hardware tone-mapping for qsv if hardware decoding is enabled and should tone map', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamHDR);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.QSV, accelDecode: true },
      });

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel qsv',
            '-hwaccel_output_format qsv',
            '-async_depth 4',
            '-threads 1',
          ]),
          outputOptions: expect.arrayContaining([
            expect.stringContaining(
              'hwmap=derive_device=opencl,tonemap_opencl=desat=0:format=nv12:matrix=bt709:primaries=bt709:transfer=bt709:range=pc:tonemap=hable:tonemap_mode=lum:peak=100,hwmap=derive_device=qsv:reverse=1,format=qsv',
            ),
          ]),
          twoPass: false,
        }),
      );
    });

    it('should use preferred device for qsv when hardware decoding', async () => {
      sut.videoInterfaces = { dri: ['renderD128', 'renderD129', 'renderD130'], mali: false };
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.QSV, accelDecode: true, preferredHwDevice: 'renderD129' },
      });

      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel qsv', '-qsv_device /dev/dri/renderD129']),
          outputOptions: expect.any(Array),
          twoPass: false,
        }),
      );
    });

    it('should set format to nv12 for qsv if input is not yuv420p', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStream10Bit);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.QSV, accelDecode: true },
      });

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel qsv',
            '-hwaccel_output_format qsv',
            '-async_depth 4',
            '-threads 1',
          ]),
          outputOptions: expect.arrayContaining([expect.stringContaining('format=nv12')]),
          twoPass: false,
        }),
      );
    });

    it('should set options for vaapi', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-init_hw_device vaapi=accel:/dev/dri/renderD128',
            '-filter_hw_device accel',
          ]),
          outputOptions: expect.arrayContaining([
            `-c:v h264_vaapi`,
            '-c:a copy',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-map 0:0',
            '-map 0:3',
            '-g 256',
            '-v verbose',
            '-vf hwupload=extra_hw_frames=64,scale_vaapi=-2:720:mode=hq:out_range=pc:format=nv12',
            '-compression_level 7',
            '-rc_mode 1',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should set vbr options for vaapi when max bitrate is enabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI, maxBitrate: '10000k' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-init_hw_device vaapi=accel:/dev/dri/renderD128',
            '-filter_hw_device accel',
          ]),
          outputOptions: expect.arrayContaining([
            `-c:v h264_vaapi`,
            '-b:v 6897k',
            '-maxrate 10000k',
            '-minrate 3448.5k',
            '-rc_mode 3',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should set cq options for vaapi when max bitrate is disabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-init_hw_device vaapi=accel:/dev/dri/renderD128',
            '-filter_hw_device accel',
          ]),
          outputOptions: expect.arrayContaining([
            `-c:v h264_vaapi`,
            '-c:a copy',
            '-qp:v 23',
            '-global_quality:v 23',
            '-rc_mode 1',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should omit preset for vaapi if invalid', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI, preset: 'invalid' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-init_hw_device vaapi=accel:/dev/dri/renderD128',
            '-filter_hw_device accel',
          ]),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-compression_level')]),
          twoPass: false,
        }),
      );
    });

    it('should prefer higher index renderD* device for vaapi', async () => {
      sut.videoInterfaces = { dri: ['card1', 'renderD129', 'card0', 'renderD128'], mali: false };
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-init_hw_device vaapi=accel:/dev/dri/renderD129',
            '-filter_hw_device accel',
          ]),
          outputOptions: expect.arrayContaining([`-c:v h264_vaapi`]),
          twoPass: false,
        }),
      );
    });

    it('should select specific gpu node if selected', async () => {
      sut.videoInterfaces = { dri: ['renderD129', 'card1', 'card0', 'renderD128'], mali: false };
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.VAAPI, preferredHwDevice: '/dev/dri/renderD128' },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-init_hw_device vaapi=accel:/dev/dri/renderD128',
            '-filter_hw_device accel',
          ]),
          outputOptions: expect.arrayContaining([`-c:v h264_vaapi`]),
          twoPass: false,
        }),
      );
    });

    it('should use hardware decoding for vaapi if enabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.VAAPI, accelDecode: true },
      });

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel vaapi',
            '-hwaccel_output_format vaapi',
            '-noautorotate',
            '-threads 1',
            '-hwaccel_device /dev/dri/renderD128',
          ]),
          outputOptions: expect.arrayContaining([expect.stringContaining('scale_vaapi=-2:720:mode=hq:out_range=pc')]),
          twoPass: false,
        }),
      );
    });

    it('should use hardware tone-mapping for vaapi if hardware decoding is enabled and should tone map', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamHDR);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.VAAPI, accelDecode: true },
      });

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel vaapi', '-hwaccel_output_format vaapi', '-threads 1']),
          outputOptions: expect.arrayContaining([
            expect.stringContaining(
              'hwmap=derive_device=opencl,tonemap_opencl=desat=0:format=nv12:matrix=bt709:primaries=bt709:transfer=bt709:range=pc:tonemap=hable:tonemap_mode=lum:peak=100,hwmap=derive_device=vaapi:reverse=1,format=vaapi',
            ),
          ]),
          twoPass: false,
        }),
      );
    });

    it('should set format to nv12 for vaapi if input is not yuv420p', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStream10Bit);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.VAAPI, accelDecode: true },
      });

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel vaapi', '-hwaccel_output_format vaapi', '-threads 1']),
          outputOptions: expect.arrayContaining([expect.stringContaining('format=nv12')]),
          twoPass: false,
        }),
      );
    });

    it('should use preferred device for vaapi when hardware decoding', async () => {
      sut.videoInterfaces = { dri: ['renderD128', 'renderD129', 'renderD130'], mali: false };
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.VAAPI, accelDecode: true, preferredHwDevice: 'renderD129' },
      });

      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel vaapi', '-hwaccel_device /dev/dri/renderD129']),
          outputOptions: expect.any(Array),
          twoPass: false,
        }),
      );
    });

    it('should fallback to hw encoding and sw decoding if hw transcoding fails and hw decoding is enabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI, accelDecode: true } });
      mocks.media.transcode.mockRejectedValueOnce(new Error('error'));
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledTimes(2);
      expect(mocks.media.transcode).toHaveBeenLastCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-init_hw_device vaapi=accel:/dev/dri/renderD128',
            '-filter_hw_device accel',
          ]),
          outputOptions: expect.arrayContaining([`-c:v h264_vaapi`]),
          twoPass: false,
        }),
      );
    });

    it('should fallback to sw decoding if fallback to sw decoding + hw encoding fails', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI, accelDecode: true } });
      mocks.media.transcode.mockRejectedValueOnce(new Error('error'));
      mocks.media.transcode.mockRejectedValueOnce(new Error('error'));
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledTimes(3);
      expect(mocks.media.transcode).toHaveBeenLastCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v h264']),
          twoPass: false,
        }),
      );
    });

    it('should fallback to sw transcoding if hw transcoding fails and hw decoding is disabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI } });
      mocks.media.transcode.mockRejectedValueOnce(new Error('error'));
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledTimes(2);
      expect(mocks.media.transcode).toHaveBeenLastCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v h264']),
          twoPass: false,
        }),
      );
    });

    it('should fail for vaapi if no hw devices', async () => {
      sut.videoInterfaces = { dri: [], mali: true };
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI } });
      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).rejects.toThrowError();
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should set options for rkmpp', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: true } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel rkmpp',
            '-hwaccel_output_format drm_prime',
            '-afbc rga',
            '-noautorotate',
          ]),
          outputOptions: expect.arrayContaining([
            `-c:v h264_rkmpp`,
            '-c:a copy',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-map 0:0',
            '-map 0:3',
            '-g 256',
            '-v verbose',
            '-vf scale_rkrga=-2:720:format=nv12:afbc=1:async_depth=4',
            '-level 51',
            '-rc_mode CQP',
            '-qp_init 23',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should set vbr options for rkmpp when max bitrate is enabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamVp9);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          accel: TranscodeHWAccel.RKMPP,
          accelDecode: true,
          maxBitrate: '10000k',
          targetVideoCodec: VideoCodec.HEVC,
        },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel rkmpp', '-hwaccel_output_format drm_prime', '-afbc rga']),
          outputOptions: expect.arrayContaining([`-c:v hevc_rkmpp`, '-level 153', '-rc_mode AVBR', '-b:v 10000k']),
          twoPass: false,
        }),
      );
    });

    it('should set cqp options for rkmpp when max bitrate is disabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: true, crf: 30, maxBitrate: '0' },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel rkmpp', '-hwaccel_output_format drm_prime', '-afbc rga']),
          outputOptions: expect.arrayContaining([`-c:v h264_rkmpp`, '-level 51', '-rc_mode CQP', '-qp_init 30']),
          twoPass: false,
        }),
      );
    });

    it('should set OpenCL tonemapping options for rkmpp when OpenCL is available', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamHDR);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: true, crf: 30, maxBitrate: '0' },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel rkmpp', '-hwaccel_output_format drm_prime', '-afbc rga']),
          outputOptions: expect.arrayContaining([
            expect.stringContaining(
              'scale_rkrga=-2:720:format=p010:afbc=1:async_depth=4,hwmap=derive_device=opencl:mode=read,tonemap_opencl=format=nv12:r=pc:p=bt709:t=bt709:m=bt709:tonemap=hable:desat=0:tonemap_mode=lum:peak=100,hwmap=derive_device=rkmpp:mode=write:reverse=1,format=drm_prime',
            ),
          ]),
          twoPass: false,
        }),
      );
    });

    it('should set hardware decoding options for rkmpp when hardware decoding is enabled with no OpenCL on non-HDR file', async () => {
      sut.videoInterfaces = { dri: ['renderD128'], mali: false };
      mocks.media.probe.mockResolvedValue(probeStub.noAudioStreams);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: true, crf: 30, maxBitrate: '0' },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel rkmpp', '-hwaccel_output_format drm_prime', '-afbc rga']),
          outputOptions: expect.arrayContaining([
            expect.stringContaining('scale_rkrga=-2:720:format=nv12:afbc=1:async_depth=4'),
          ]),
          twoPass: false,
        }),
      );
    });

    it('should use software decoding and tone-mapping if hardware decoding is disabled', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamHDR);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: false, crf: 30, maxBitrate: '0' },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: [],
          outputOptions: expect.arrayContaining([
            expect.stringContaining(
              'tonemapx=tonemap=hable:desat=0:p=bt709:t=bt709:m=bt709:r=pc:peak=100:format=yuv420p',
            ),
          ]),
          twoPass: false,
        }),
      );
    });

    it('should use software tone-mapping if opencl is not available', async () => {
      sut.videoInterfaces = { dri: ['renderD128'], mali: false };
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamHDR);
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: true, crf: 30, maxBitrate: '0' },
      });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([
            expect.stringContaining(
              'tonemapx=tonemap=hable:desat=0:p=bt709:t=bt709:m=bt709:r=pc:peak=100:format=yuv420p',
            ),
          ]),
          twoPass: false,
        }),
      );
    });

    it('should tonemap when policy is required and video is hdr', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamHDR);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.REQUIRED } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([
            '-c:v h264',
            '-c:a copy',
            '-vf tonemapx=tonemap=hable:desat=0:p=bt709:t=bt709:m=bt709:r=pc:peak=100:format=yuv420p',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should tonemap when policy is optimal and video is hdr', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamHDR);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.OPTIMAL } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([
            '-c:v h264',
            '-c:a copy',
            '-vf tonemapx=tonemap=hable:desat=0:p=bt709:t=bt709:m=bt709:r=pc:peak=100:format=yuv420p',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should transcode when policy is required and video is not yuv420p', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStream10Bit);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.REQUIRED } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v h264', '-c:a copy', '-vf format=yuv420p']),
          twoPass: false,
        }),
      );
    });

    it('should convert to yuv420p when scaling without tone-mapping', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStream4K10Bit);
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.REQUIRED } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v h264', '-c:a copy', '-vf scale=-2:720,format=yuv420p']),
          twoPass: false,
        }),
      );
    });

    it('should count frames for progress when log level is debug', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);
      mocks.logger.isLevelEnabled.mockReturnValue(true);

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mocks.media.probe).toHaveBeenCalledWith(assetStub.video.originalPath, { countFrames: true });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        assetStub.video.originalPath,
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.any(Array),
          twoPass: false,
          progress: {
            frameCount: probeStub.videoStream2160p.videoStreams[0].frameCount,
            percentInterval: expect.any(Number),
          },
        },
      );
    });

    it('should not count frames for progress when log level is not debug', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStream2160p);
      mocks.logger.isLevelEnabled.mockReturnValue(false);
      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mocks.media.probe).toHaveBeenCalledWith(assetStub.video.originalPath, { countFrames: false });
    });

    it('should process unknown audio stream', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.audioStreamUnknown);
      mocks.asset.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:a copy']),
          twoPass: false,
        }),
      );
    });
  });

  describe('isSRGB', () => {
    it('should return true for srgb colorspace', () => {
      expect(sut.isSRGB({ colorspace: 'sRGB' } as Exif)).toEqual(true);
    });

    it('should return true for srgb profile description', () => {
      expect(sut.isSRGB({ profileDescription: 'sRGB v1.31' } as Exif)).toEqual(true);
    });

    it('should return true for 8-bit image with no colorspace metadata', () => {
      expect(sut.isSRGB({ bitsPerSample: 8 } as Exif)).toEqual(true);
    });

    it('should return true for image with no colorspace or bit depth metadata', () => {
      expect(sut.isSRGB({} as Exif)).toEqual(true);
    });

    it('should return false for non-srgb colorspace', () => {
      expect(sut.isSRGB({ colorspace: 'Adobe RGB' } as Exif)).toEqual(false);
    });

    it('should return false for non-srgb profile description', () => {
      expect(sut.isSRGB({ profileDescription: 'sP3C' } as Exif)).toEqual(false);
    });

    it('should return false for 16-bit image with no colorspace metadata', () => {
      expect(sut.isSRGB({ bitsPerSample: 16 } as Exif)).toEqual(false);
    });

    it('should return true for 16-bit image with sRGB colorspace', () => {
      expect(sut.isSRGB({ colorspace: 'sRGB', bitsPerSample: 16 } as Exif)).toEqual(true);
    });

    it('should return true for 16-bit image with sRGB profile', () => {
      expect(sut.isSRGB({ profileDescription: 'sRGB', bitsPerSample: 16 } as Exif)).toEqual(true);
    });
  });
});

import { SystemConfig } from 'src/config';
import { AssetEntity } from 'src/entities/asset.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import {
  AssetFileType,
  AssetPathType,
  AssetType,
  AudioCodec,
  Colorspace,
  ImageFormat,
  TranscodeHWAccel,
  TranscodePolicy,
  VideoCodec,
} from 'src/enum';
import { IAssetRepository, WithoutProperty } from 'src/interfaces/asset.interface';
import { IJobRepository, JobCounts, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMediaRepository, RawImageInfo } from 'src/interfaces/media.interface';
import { IMoveRepository } from 'src/interfaces/move.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { MediaService } from 'src/services/media.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { faceStub } from 'test/fixtures/face.stub';
import { probeStub } from 'test/fixtures/media.stub';
import { personStub } from 'test/fixtures/person.stub';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(MediaService.name, () => {
  let sut: MediaService;

  let assetMock: Mocked<IAssetRepository>;
  let jobMock: Mocked<IJobRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let mediaMock: Mocked<IMediaRepository>;
  let moveMock: Mocked<IMoveRepository>;
  let personMock: Mocked<IPersonRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;

  beforeEach(() => {
    ({ sut, assetMock, jobMock, loggerMock, mediaMock, moveMock, personMock, storageMock, systemMock } =
      newTestService(MediaService));
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueGenerateThumbnails', () => {
    it('should queue all assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      personMock.getAll.mockResolvedValue({
        items: [personStub.newThumbnail],
        hasNextPage: false,
      });
      personMock.getFacesByIds.mockResolvedValue([faceStub.face1]);

      await sut.handleQueueGenerateThumbnails({ force: true });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(assetMock.getWithout).not.toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_THUMBNAILS,
          data: { id: assetStub.image.id },
        },
      ]);

      expect(personMock.getAll).toHaveBeenCalledWith({ skip: 0, take: 1000 }, {});
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_PERSON_THUMBNAIL,
          data: { id: personStub.newThumbnail.id },
        },
      ]);
    });

    it('should queue trashed assets when force is true', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.trashed],
        hasNextPage: false,
      });
      personMock.getAll.mockResolvedValue({
        items: [],
        hasNextPage: false,
      });

      await sut.handleQueueGenerateThumbnails({ force: true });

      expect(assetMock.getAll).toHaveBeenCalledWith(
        { skip: 0, take: 1000 },
        expect.objectContaining({ withDeleted: true }),
      );
      expect(assetMock.getWithout).not.toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_THUMBNAILS,
          data: { id: assetStub.trashed.id },
        },
      ]);
    });

    it('should queue archived assets when force is true', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.archived],
        hasNextPage: false,
      });
      personMock.getAll.mockResolvedValue({
        items: [],
        hasNextPage: false,
      });

      await sut.handleQueueGenerateThumbnails({ force: true });

      expect(assetMock.getAll).toHaveBeenCalledWith(
        { skip: 0, take: 1000 },
        expect.objectContaining({ withArchived: true }),
      );
      expect(assetMock.getWithout).not.toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_THUMBNAILS,
          data: { id: assetStub.archived.id },
        },
      ]);
    });

    it('should queue all people with missing thumbnail path', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      personMock.getAll.mockResolvedValue({
        items: [personStub.noThumbnail, personStub.noThumbnail],
        hasNextPage: false,
      });
      personMock.getRandomFace.mockResolvedValueOnce(faceStub.face1);

      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.THUMBNAIL);

      expect(personMock.getAll).toHaveBeenCalledWith({ skip: 0, take: 1000 }, { where: { thumbnailPath: '' } });
      expect(personMock.getRandomFace).toHaveBeenCalled();
      expect(personMock.update).toHaveBeenCalledTimes(1);
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_PERSON_THUMBNAIL,
          data: {
            id: personStub.newThumbnail.id,
          },
        },
      ]);
    });

    it('should queue all assets with missing resize path', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.noResizePath],
        hasNextPage: false,
      });
      personMock.getAll.mockResolvedValue({
        items: [],
        hasNextPage: false,
      });

      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.THUMBNAIL);
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_THUMBNAILS,
          data: { id: assetStub.image.id },
        },
      ]);

      expect(personMock.getAll).toHaveBeenCalledWith({ skip: 0, take: 1000 }, { where: { thumbnailPath: '' } });
    });

    it('should queue all assets with missing webp path', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.noWebpPath],
        hasNextPage: false,
      });
      personMock.getAll.mockResolvedValue({
        items: [],
        hasNextPage: false,
      });

      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.THUMBNAIL);
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_THUMBNAILS,
          data: { id: assetStub.image.id },
        },
      ]);

      expect(personMock.getAll).toHaveBeenCalledWith({ skip: 0, take: 1000 }, { where: { thumbnailPath: '' } });
    });

    it('should queue all assets with missing thumbhash', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.noThumbhash],
        hasNextPage: false,
      });
      personMock.getAll.mockResolvedValue({
        items: [],
        hasNextPage: false,
      });

      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.THUMBNAIL);
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_THUMBNAILS,
          data: { id: assetStub.image.id },
        },
      ]);

      expect(personMock.getAll).toHaveBeenCalledWith({ skip: 0, take: 1000 }, { where: { thumbnailPath: '' } });
    });
  });

  describe('handleQueueMigration', () => {
    it('should remove empty directories and queue jobs', async () => {
      assetMock.getAll.mockResolvedValue({ hasNextPage: false, items: [assetStub.image] });
      jobMock.getJobCounts.mockResolvedValue({ active: 1, waiting: 0 } as JobCounts);
      personMock.getAll.mockResolvedValue({ hasNextPage: false, items: [personStub.withName] });

      await expect(sut.handleQueueMigration()).resolves.toBe(JobStatus.SUCCESS);

      expect(storageMock.removeEmptyDirs).toHaveBeenCalledTimes(2);
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        { name: JobName.MIGRATE_ASSET, data: { id: assetStub.image.id } },
      ]);
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        { name: JobName.MIGRATE_PERSON, data: { id: personStub.withName.id } },
      ]);
    });
  });

  describe('handleAssetMigration', () => {
    it('should fail if asset does not exist', async () => {
      await expect(sut.handleAssetMigration({ id: assetStub.image.id })).resolves.toBe(JobStatus.FAILED);

      expect(moveMock.getByEntity).not.toHaveBeenCalled();
    });

    it('should move asset files', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      moveMock.create.mockResolvedValue({
        entityId: assetStub.image.id,
        id: 'move-id',
        newPath: '/new/path',
        oldPath: '/old/path',
        pathType: AssetPathType.ORIGINAL,
      });

      await expect(sut.handleAssetMigration({ id: assetStub.image.id })).resolves.toBe(JobStatus.SUCCESS);
      expect(moveMock.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleGenerateThumbnails', () => {
    let rawBuffer: Buffer;
    let rawInfo: RawImageInfo;

    beforeEach(() => {
      rawBuffer = Buffer.from('image data');
      rawInfo = { width: 100, height: 100, channels: 3 };
      mediaMock.decodeImage.mockResolvedValue({ data: rawBuffer, info: rawInfo });
    });

    it('should skip thumbnail generation if asset not found', async () => {
      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mediaMock.generateThumbnail).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalledWith();
    });

    it('should skip thumbnail generation if asset type is unknown', async () => {
      assetMock.getById.mockResolvedValue({ ...assetStub.image, type: 'foo' } as never as AssetEntity);

      await expect(sut.handleGenerateThumbnails({ id: assetStub.image.id })).resolves.toBe(JobStatus.SKIPPED);
      expect(mediaMock.probe).not.toHaveBeenCalled();
      expect(mediaMock.generateThumbnail).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalledWith();
    });

    it('should skip video thumbnail generation if no video stream', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.noVideoStreams);
      assetMock.getById.mockResolvedValue(assetStub.video);
      await expect(sut.handleGenerateThumbnails({ id: assetStub.video.id })).rejects.toThrowError();
      expect(mediaMock.generateThumbnail).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalledWith();
    });

    it('should skip invisible assets', async () => {
      assetMock.getById.mockResolvedValue(assetStub.livePhotoMotionAsset);

      expect(await sut.handleGenerateThumbnails({ id: assetStub.livePhotoMotionAsset.id })).toEqual(JobStatus.SKIPPED);

      expect(mediaMock.generateThumbnail).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalledWith();
    });

    it('should delete previous preview if different path', async () => {
      systemMock.get.mockResolvedValue({ image: { thumbnail: { format: ImageFormat.WEBP } } });
      assetMock.getById.mockResolvedValue(assetStub.image);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(storageMock.unlink).toHaveBeenCalledWith('/uploads/user-id/thumbs/path.jpg');
    });

    it('should generate P3 thumbnails for a wide gamut image', async () => {
      assetMock.getById.mockResolvedValue({
        ...assetStub.image,
        exifInfo: { profileDescription: 'Adobe RGB', bitsPerSample: 14 } as ExifEntity,
      });
      const thumbhashBuffer = Buffer.from('a thumbhash', 'utf8');
      mediaMock.generateThumbhash.mockResolvedValue(thumbhashBuffer);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/as/se');

      expect(mediaMock.decodeImage).toHaveBeenCalledOnce();
      expect(mediaMock.decodeImage).toHaveBeenCalledWith(assetStub.image.originalPath, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
        size: 1440,
      });

      expect(mediaMock.generateThumbnail).toHaveBeenCalledTimes(2);
      expect(mediaMock.generateThumbnail).toHaveBeenCalledWith(
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
      expect(mediaMock.generateThumbnail).toHaveBeenCalledWith(
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

      expect(mediaMock.generateThumbhash).toHaveBeenCalledOnce();
      expect(mediaMock.generateThumbhash).toHaveBeenCalledWith(rawBuffer, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
        raw: rawInfo,
      });

      expect(assetMock.upsertFiles).toHaveBeenCalledWith([
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
      expect(assetMock.update).toHaveBeenCalledWith({ id: 'asset-id', thumbhash: thumbhashBuffer });
    });

    it('should generate a thumbnail for a video', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      assetMock.getById.mockResolvedValue(assetStub.video);
      await sut.handleGenerateThumbnails({ id: assetStub.video.id });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/as/se');
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      expect(assetMock.upsertFiles).toHaveBeenCalledWith([
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
      assetMock.getById.mockResolvedValue(assetStub.video);
      await sut.handleGenerateThumbnails({ id: assetStub.video.id });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/as/se');
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      expect(assetMock.upsertFiles).toHaveBeenCalledWith([
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
      systemMock.get.mockResolvedValue({
        ffmpeg: { twoPass: true, maxBitrate: '5000k' },
      });
      assetMock.getById.mockResolvedValue(assetStub.video);
      await sut.handleGenerateThumbnails({ id: assetStub.video.id });

      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamMTS);
      assetMock.getById.mockResolvedValue(assetStub.video);
      await sut.handleGenerateThumbnails({ id: assetStub.video.id });

      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.QSV } });
      assetMock.getById.mockResolvedValue(assetStub.video);
      await sut.handleGenerateThumbnails({ id: assetStub.video.id });

      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      systemMock.get.mockResolvedValue({ image: { preview: { format } } });
      assetMock.getById.mockResolvedValue(assetStub.image);
      const thumbhashBuffer = Buffer.from('a thumbhash', 'utf8');
      mediaMock.generateThumbhash.mockResolvedValue(thumbhashBuffer);
      const previewPath = `upload/thumbs/user-id/as/se/asset-id-preview.${format}`;
      const thumbnailPath = `upload/thumbs/user-id/as/se/asset-id-thumbnail.webp`;

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/as/se');
      expect(mediaMock.decodeImage).toHaveBeenCalledOnce();
      expect(mediaMock.decodeImage).toHaveBeenCalledWith(assetStub.image.originalPath, {
        colorspace: Colorspace.SRGB,
        processInvalidImages: false,
        size: 1440,
      });

      expect(mediaMock.generateThumbnail).toHaveBeenCalledTimes(2);
      expect(mediaMock.generateThumbnail).toHaveBeenCalledWith(
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
      expect(mediaMock.generateThumbnail).toHaveBeenCalledWith(
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
      systemMock.get.mockResolvedValue({ image: { thumbnail: { format } } });
      assetMock.getById.mockResolvedValue(assetStub.image);
      const thumbhashBuffer = Buffer.from('a thumbhash', 'utf8');
      mediaMock.generateThumbhash.mockResolvedValue(thumbhashBuffer);
      const previewPath = `upload/thumbs/user-id/as/se/asset-id-preview.jpeg`;
      const thumbnailPath = `upload/thumbs/user-id/as/se/asset-id-thumbnail.${format}`;

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/as/se');
      expect(mediaMock.decodeImage).toHaveBeenCalledOnce();
      expect(mediaMock.decodeImage).toHaveBeenCalledWith(assetStub.image.originalPath, {
        colorspace: Colorspace.SRGB,
        processInvalidImages: false,
        size: 1440,
      });

      expect(mediaMock.generateThumbnail).toHaveBeenCalledTimes(2);
      expect(mediaMock.generateThumbnail).toHaveBeenCalledWith(
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
      expect(mediaMock.generateThumbnail).toHaveBeenCalledWith(
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
      systemMock.get.mockResolvedValue({ image: { thumbnail: { format: ImageFormat.WEBP } } });
      assetMock.getById.mockResolvedValue(assetStub.image);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(storageMock.unlink).toHaveBeenCalledWith('/uploads/user-id/webp/path.ext');
    });

    it('should extract embedded image if enabled and available', async () => {
      mediaMock.extract.mockResolvedValue(true);
      mediaMock.getImageDimensions.mockResolvedValue({ width: 3840, height: 2160 });
      systemMock.get.mockResolvedValue({ image: { extractEmbedded: true } });
      assetMock.getById.mockResolvedValue(assetStub.imageDng);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      const extractedPath = mediaMock.extract.mock.calls.at(-1)?.[1].toString();
      expect(mediaMock.decodeImage).toHaveBeenCalledOnce();
      expect(mediaMock.decodeImage).toHaveBeenCalledWith(extractedPath, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
        size: 1440,
      });
      expect(extractedPath?.endsWith('.tmp')).toBe(true);
      expect(storageMock.unlink).toHaveBeenCalledWith(extractedPath);
    });

    it('should resize original image if embedded image is too small', async () => {
      mediaMock.extract.mockResolvedValue(true);
      mediaMock.getImageDimensions.mockResolvedValue({ width: 1000, height: 1000 });
      systemMock.get.mockResolvedValue({ image: { extractEmbedded: true } });
      assetMock.getById.mockResolvedValue(assetStub.imageDng);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mediaMock.decodeImage).toHaveBeenCalledOnce();
      expect(mediaMock.decodeImage).toHaveBeenCalledWith(assetStub.imageDng.originalPath, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
        size: 1440,
      });
      const extractedPath = mediaMock.extract.mock.calls.at(-1)?.[1].toString();
      expect(extractedPath?.endsWith('.tmp')).toBe(true);
      expect(storageMock.unlink).toHaveBeenCalledWith(extractedPath);
    });

    it('should resize original image if embedded image not found', async () => {
      systemMock.get.mockResolvedValue({ image: { extractEmbedded: true } });
      assetMock.getById.mockResolvedValue(assetStub.imageDng);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mediaMock.decodeImage).toHaveBeenCalledOnce();
      expect(mediaMock.decodeImage).toHaveBeenCalledWith(assetStub.imageDng.originalPath, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
        size: 1440,
      });
      expect(mediaMock.getImageDimensions).not.toHaveBeenCalled();
    });

    it('should resize original image if embedded image extraction is not enabled', async () => {
      systemMock.get.mockResolvedValue({ image: { extractEmbedded: false } });
      assetMock.getById.mockResolvedValue(assetStub.imageDng);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mediaMock.extract).not.toHaveBeenCalled();
      expect(mediaMock.decodeImage).toHaveBeenCalledOnce();
      expect(mediaMock.decodeImage).toHaveBeenCalledWith(assetStub.imageDng.originalPath, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
        size: 1440,
      });
      expect(mediaMock.getImageDimensions).not.toHaveBeenCalled();
    });

    it('should process invalid images if enabled', async () => {
      vi.stubEnv('IMMICH_PROCESS_INVALID_IMAGES', 'true');

      assetMock.getById.mockResolvedValue(assetStub.imageDng);

      await sut.handleGenerateThumbnails({ id: assetStub.image.id });

      expect(mediaMock.decodeImage).toHaveBeenCalledOnce();
      expect(mediaMock.decodeImage).toHaveBeenCalledWith(
        assetStub.imageDng.originalPath,
        expect.objectContaining({ processInvalidImages: true }),
      );

      expect(mediaMock.generateThumbnail).toHaveBeenCalledTimes(2);
      expect(mediaMock.generateThumbnail).toHaveBeenCalledWith(
        rawBuffer,
        expect.objectContaining({ processInvalidImages: true }),
        'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
      );
      expect(mediaMock.generateThumbnail).toHaveBeenCalledWith(
        rawBuffer,
        expect.objectContaining({ processInvalidImages: true }),
        'upload/thumbs/user-id/as/se/asset-id-thumbnail.webp',
      );

      expect(mediaMock.generateThumbhash).toHaveBeenCalledOnce();
      expect(mediaMock.generateThumbhash).toHaveBeenCalledWith(
        rawBuffer,
        expect.objectContaining({ processInvalidImages: true }),
      );

      expect(mediaMock.getImageDimensions).not.toHaveBeenCalled();
      vi.unstubAllEnvs();
    });
  });

  describe('handleQueueVideoConversion', () => {
    it('should queue all video assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.video],
        hasNextPage: false,
      });
      personMock.getAll.mockResolvedValue({
        items: [],
        hasNextPage: false,
      });

      await sut.handleQueueVideoConversion({ force: true });

      expect(assetMock.getAll).toHaveBeenCalledWith({ skip: 0, take: 1000 }, { type: AssetType.VIDEO });
      expect(assetMock.getWithout).not.toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.VIDEO_CONVERSION,
          data: { id: assetStub.video.id },
        },
      ]);
    });

    it('should queue all video assets without encoded videos', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.video],
        hasNextPage: false,
      });

      await sut.handleQueueVideoConversion({});

      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.ENCODED_VIDEO);
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.VIDEO_CONVERSION,
          data: { id: assetStub.video.id },
        },
      ]);
    });
  });

  describe('handleVideoConversion', () => {
    beforeEach(() => {
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      sut.videoInterfaces = { dri: ['renderD128'], mali: true };
    });

    it('should skip transcoding if asset not found', async () => {
      assetMock.getByIds.mockResolvedValue([]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.probe).not.toHaveBeenCalled();
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should skip transcoding if non-video asset', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      await sut.handleVideoConversion({ id: assetStub.image.id });
      expect(mediaMock.probe).not.toHaveBeenCalled();
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should transcode the longest stream', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      loggerMock.isLevelEnabled.mockReturnValue(false);
      mediaMock.probe.mockResolvedValue(probeStub.multipleVideoStreams);

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mediaMock.probe).toHaveBeenCalledWith('/original/path.ext', { countFrames: false });
      expect(systemMock.get).toHaveBeenCalled();
      expect(storageMock.mkdirSync).toHaveBeenCalled();
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-map 0:0', '-map 0:1']),
          twoPass: false,
        }),
      );
    });

    it('should skip a video without any streams', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.noVideoStreams);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should skip a video without any height', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.noHeight);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should throw an error if an unknown transcode policy is configured', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.noAudioStreams);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: 'foo' } } as never as SystemConfig);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);

      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).rejects.toThrowError();
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should throw an error if transcoding fails and hw acceleration is disabled', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.multipleVideoStreams);
      systemMock.get.mockResolvedValue({
        ffmpeg: { transcode: TranscodePolicy.ALL, accel: TranscodeHWAccel.DISABLED },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      mediaMock.transcode.mockRejectedValue(new Error('Error transcoding video'));

      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).resolves.toBe(JobStatus.FAILED);
      expect(mediaMock.transcode).toHaveBeenCalledTimes(1);
    });

    it('should transcode when set to all', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.multipleVideoStreams);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.ALL } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.OPTIMAL } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStream40Mbps);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.BITRATE, maxBitrate: '30M' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStream40Mbps);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.BITRATE, maxBitrate: 'foo' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.ALL, targetResolution: 'original' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.OPTIMAL } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamVertical2160p);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.OPTIMAL } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamOddHeight);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.ALL, targetResolution: 'original' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamOddWidth);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.ALL, targetResolution: 'original' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({
        ffmpeg: { targetVideoCodec: VideoCodec.HEVC, acceptedAudioCodecs: [AudioCodec.AAC] },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamH264);
      systemMock.get.mockResolvedValue({
        ffmpeg: {
          targetVideoCodec: VideoCodec.HEVC,
          acceptedVideoCodecs: [VideoCodec.H264, VideoCodec.HEVC],
          acceptedAudioCodecs: [AudioCodec.AAC],
        },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({
        ffmpeg: {
          targetVideoCodec: VideoCodec.HEVC,
          acceptedVideoCodecs: [VideoCodec.H264, VideoCodec.HEVC],
          acceptedAudioCodecs: [AudioCodec.AAC],
        },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.audioStreamAac);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.OPTIMAL } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamAvi);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: 'invalid' as any } });

      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).rejects.toThrowError();
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should not transcode if transcoding is disabled', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.DISABLED } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should not remux when input is not an accepted container and transcoding is disabled', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.DISABLED } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should not transcode if target codec is invalid', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      systemMock.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: 'invalid' as any } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should delete existing transcode if current policy does not require transcoding', async () => {
      const asset = assetStub.hasEncodedVideo;
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.DISABLED } });
      assetMock.getByIds.mockResolvedValue([asset]);

      await sut.handleVideoConversion({ id: asset.id });

      expect(mediaMock.transcode).not.toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: { files: [asset.encodedVideoPath] },
      });
    });

    it('should set max bitrate if above 0', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { maxBitrate: '4500k' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { twoPass: true, maxBitrate: '4500k' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { twoPass: true } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({
        ffmpeg: {
          maxBitrate: '4500k',
          twoPass: true,
          targetVideoCodec: VideoCodec.VP9,
        },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({
        ffmpeg: {
          maxBitrate: '0',
          twoPass: true,
          targetVideoCodec: VideoCodec.VP9,
        },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.VP9, preset: 'slow' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { preset: 'invalid', targetVideoCodec: VideoCodec.VP9 } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.VP9, threads: 2 } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { threads: 1 } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { threads: 0 } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamVp9);
      systemMock.get.mockResolvedValue({ ffmpeg: { threads: 1, targetVideoCodec: VideoCodec.HEVC } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamVp9);
      systemMock.get.mockResolvedValue({ ffmpeg: { threads: 0, targetVideoCodec: VideoCodec.HEVC } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamVp9);
      systemMock.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.AV1 } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([
            '-c:v libsvtav1',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-map 0:0',
            '-map 0:1',
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamVp9);
      systemMock.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.AV1, preset: 'veryslow' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamVp9);
      systemMock.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.AV1, maxBitrate: '2M' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamVp9);
      systemMock.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.AV1, threads: 4 } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamVp9);
      systemMock.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.AV1, threads: 4, maxBitrate: '2M' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.noAudioStreams);
      systemMock.get.mockResolvedValue({
        ffmpeg: {
          targetVideoCodec: VideoCodec.HEVC,
          transcode: TranscodePolicy.OPTIMAL,
          targetResolution: '1080p',
        },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should fail if hwaccel is enabled for an unsupported codec', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.NVENC, targetVideoCodec: VideoCodec.VP9 } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).rejects.toThrowError();
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should fail if hwaccel option is invalid', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: 'invalid' as any } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).rejects.toThrowError();
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should set options for nvenc', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.NVENC } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
            '-map 0:1',
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({
        ffmpeg: {
          accel: TranscodeHWAccel.NVENC,
          maxBitrate: '10000k',
          twoPass: true,
        },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.NVENC, maxBitrate: '10000k' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.NVENC, maxBitrate: '10000k' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.NVENC, preset: 'invalid' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.NVENC } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.NVENC, accelDecode: true },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.NVENC, accelDecode: true },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStream10Bit);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.NVENC, accelDecode: true },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel cuda', '-hwaccel_output_format cuda']),
          outputOptions: expect.arrayContaining([expect.stringContaining('format=nv12')]),
          twoPass: false,
        }),
      );
    });

    it('should set options for qsv', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.QSV, maxBitrate: '10000k' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
            '-map 0:1',
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({
        ffmpeg: {
          accel: TranscodeHWAccel.QSV,
          maxBitrate: '10000k',
          preferredHwDevice: '/dev/dri/renderD128',
        },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.QSV, preset: 'invalid' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.QSV, targetVideoCodec: VideoCodec.VP9 } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.QSV } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);

      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).rejects.toThrowError();

      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should prefer higher index renderD* device for qsv', async () => {
      sut.videoInterfaces = { dri: ['card1', 'renderD129', 'card0', 'renderD128'], mali: false };
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.QSV } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.QSV, accelDecode: true },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
          outputOptions: expect.arrayContaining([
            expect.stringContaining('scale_qsv=-1:720:async_depth=4:mode=hq:format=nv12'),
          ]),
          twoPass: false,
        }),
      );
    });

    it('should use hardware tone-mapping for qsv if hardware decoding is enabled and should tone map', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.QSV, accelDecode: true },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.QSV, accelDecode: true, preferredHwDevice: 'renderD129' },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);

      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStream10Bit);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.QSV, accelDecode: true },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
            '-map 0:1',
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI, maxBitrate: '10000k' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI, preset: 'invalid' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.VAAPI, preferredHwDevice: '/dev/dri/renderD128' },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.VAAPI, accelDecode: true },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
          outputOptions: expect.arrayContaining([
            expect.stringContaining('scale_vaapi=-2:720:mode=hq:out_range=pc:format=nv12'),
          ]),
          twoPass: false,
        }),
      );
    });

    it('should use hardware tone-mapping for vaapi if hardware decoding is enabled and should tone map', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.VAAPI, accelDecode: true },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStream10Bit);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.VAAPI, accelDecode: true },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.VAAPI, accelDecode: true, preferredHwDevice: 'renderD129' },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);

      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI, accelDecode: true } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      mediaMock.transcode.mockRejectedValueOnce(new Error('error'));
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledTimes(2);
      expect(mediaMock.transcode).toHaveBeenLastCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI, accelDecode: true } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      mediaMock.transcode.mockRejectedValueOnce(new Error('error'));
      mediaMock.transcode.mockRejectedValueOnce(new Error('error'));
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledTimes(3);
      expect(mediaMock.transcode).toHaveBeenLastCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      mediaMock.transcode.mockRejectedValueOnce(new Error('error'));
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledTimes(2);
      expect(mediaMock.transcode).toHaveBeenLastCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).rejects.toThrowError();
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should set options for rkmpp', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: true } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
            '-map 0:1',
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamVp9);
      systemMock.get.mockResolvedValue({
        ffmpeg: {
          accel: TranscodeHWAccel.RKMPP,
          accelDecode: true,
          maxBitrate: '10000k',
          targetVideoCodec: VideoCodec.HEVC,
        },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: true, crf: 30, maxBitrate: '0' },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: true, crf: 30, maxBitrate: '0' },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.noAudioStreams);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: true, crf: 30, maxBitrate: '0' },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: false, crf: 30, maxBitrate: '0' },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: true, crf: 30, maxBitrate: '0' },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.REQUIRED } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.OPTIMAL } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStream10Bit);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.REQUIRED } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v h264', '-c:a copy', '-vf format=yuv420p']),
          twoPass: false,
        }),
      );
    });

    it('should count frames for progress when log level is debug', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      loggerMock.isLevelEnabled.mockReturnValue(true);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mediaMock.probe).toHaveBeenCalledWith(assetStub.video.originalPath, { countFrames: true });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      loggerMock.isLevelEnabled.mockReturnValue(false);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mediaMock.probe).toHaveBeenCalledWith(assetStub.video.originalPath, { countFrames: false });
    });

    it('should process unknown audio stream', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.audioStreamUnknown);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mediaMock.transcode).toHaveBeenCalledWith(
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
      const asset = { ...assetStub.image, exifInfo: { colorspace: 'sRGB' } as ExifEntity };
      expect(sut.isSRGB(asset)).toEqual(true);
    });

    it('should return true for srgb profile description', () => {
      const asset = { ...assetStub.image, exifInfo: { profileDescription: 'sRGB v1.31' } as ExifEntity };
      expect(sut.isSRGB(asset)).toEqual(true);
    });

    it('should return true for 8-bit image with no colorspace metadata', () => {
      const asset = { ...assetStub.image, exifInfo: { bitsPerSample: 8 } as ExifEntity };
      expect(sut.isSRGB(asset)).toEqual(true);
    });

    it('should return true for image with no colorspace or bit depth metadata', () => {
      const asset = { ...assetStub.image, exifInfo: {} as ExifEntity };
      expect(sut.isSRGB(asset)).toEqual(true);
    });

    it('should return false for non-srgb colorspace', () => {
      const asset = { ...assetStub.image, exifInfo: { colorspace: 'Adobe RGB' } as ExifEntity };
      expect(sut.isSRGB(asset)).toEqual(false);
    });

    it('should return false for non-srgb profile description', () => {
      const asset = { ...assetStub.image, exifInfo: { profileDescription: 'sP3C' } as ExifEntity };
      expect(sut.isSRGB(asset)).toEqual(false);
    });

    it('should return false for 16-bit image with no colorspace metadata', () => {
      const asset = { ...assetStub.image, exifInfo: { bitsPerSample: 16 } as ExifEntity };
      expect(sut.isSRGB(asset)).toEqual(false);
    });

    it('should return true for 16-bit image with sRGB colorspace', () => {
      const asset = { ...assetStub.image, exifInfo: { colorspace: 'sRGB', bitsPerSample: 16 } as ExifEntity };
      expect(sut.isSRGB(asset)).toEqual(true);
    });

    it('should return true for 16-bit image with sRGB profile', () => {
      const asset = { ...assetStub.image, exifInfo: { profileDescription: 'sRGB', bitsPerSample: 16 } as ExifEntity };
      expect(sut.isSRGB(asset)).toEqual(true);
    });
  });
});

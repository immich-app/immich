import { Stats } from 'node:fs';
import {
  AudioCodec,
  Colorspace,
  ImageFormat,
  ToneMapping,
  TranscodeHWAccel,
  TranscodePolicy,
  VideoCodec,
} from 'src/config';
import { AssetType } from 'src/entities/asset.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import { IAssetRepository, WithoutProperty } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMediaRepository } from 'src/interfaces/media.interface';
import { IMoveRepository } from 'src/interfaces/move.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { MediaService } from 'src/services/media.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { faceStub } from 'test/fixtures/face.stub';
import { probeStub } from 'test/fixtures/media.stub';
import { personStub } from 'test/fixtures/person.stub';
import { newAssetRepositoryMock } from 'test/repositories/asset.repository.mock';
import { newCryptoRepositoryMock } from 'test/repositories/crypto.repository.mock';
import { newJobRepositoryMock } from 'test/repositories/job.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newMediaRepositoryMock } from 'test/repositories/media.repository.mock';
import { newMoveRepositoryMock } from 'test/repositories/move.repository.mock';
import { newPersonRepositoryMock } from 'test/repositories/person.repository.mock';
import { newStorageRepositoryMock } from 'test/repositories/storage.repository.mock';
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { Mocked } from 'vitest';

describe(MediaService.name, () => {
  let sut: MediaService;
  let assetMock: Mocked<IAssetRepository>;
  let jobMock: Mocked<IJobRepository>;
  let mediaMock: Mocked<IMediaRepository>;
  let moveMock: Mocked<IMoveRepository>;
  let personMock: Mocked<IPersonRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let cryptoMock: Mocked<ICryptoRepository>;
  let loggerMock: Mocked<ILoggerRepository>;

  beforeEach(() => {
    assetMock = newAssetRepositoryMock();
    systemMock = newSystemMetadataRepositoryMock();
    jobMock = newJobRepositoryMock();
    mediaMock = newMediaRepositoryMock();
    moveMock = newMoveRepositoryMock();
    personMock = newPersonRepositoryMock();
    storageMock = newStorageRepositoryMock();
    cryptoMock = newCryptoRepositoryMock();
    loggerMock = newLoggerRepositoryMock();

    sut = new MediaService(
      assetMock,
      personMock,
      jobMock,
      mediaMock,
      storageMock,
      systemMock,
      moveMock,
      cryptoMock,
      loggerMock,
    );
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
          name: JobName.GENERATE_PREVIEW,
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

    it('should queue all people with missing thumbnail path', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      personMock.getAll.mockResolvedValue({
        items: [personStub.noThumbnail],
        hasNextPage: false,
      });
      personMock.getRandomFace.mockResolvedValue(faceStub.face1);

      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.THUMBNAIL);

      expect(personMock.getAll).toHaveBeenCalledWith({ skip: 0, take: 1000 }, { where: { thumbnailPath: '' } });
      expect(personMock.getRandomFace).toHaveBeenCalled();
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
          name: JobName.GENERATE_PREVIEW,
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
          name: JobName.GENERATE_THUMBNAIL,
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
          name: JobName.GENERATE_THUMBHASH,
          data: { id: assetStub.image.id },
        },
      ]);

      expect(personMock.getAll).toHaveBeenCalledWith({ skip: 0, take: 1000 }, { where: { thumbnailPath: '' } });
    });
  });

  describe('handleGeneratePreview', () => {
    it('should skip thumbnail generation if asset not found', async () => {
      assetMock.getByIds.mockResolvedValue([]);
      await sut.handleGeneratePreview({ id: assetStub.image.id });
      expect(mediaMock.generateThumbnail).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalledWith();
    });

    it('should skip video thumbnail generation if no video stream', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.noVideoStreams);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleGeneratePreview({ id: assetStub.image.id });
      expect(mediaMock.generateThumbnail).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalledWith();
    });

    it('should skip invisible assets', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.livePhotoMotionAsset]);

      expect(await sut.handleGeneratePreview({ id: assetStub.livePhotoMotionAsset.id })).toEqual(JobStatus.SKIPPED);

      expect(mediaMock.generateThumbnail).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalledWith();
    });

    it.each(Object.values(ImageFormat))('should generate a %s preview for an image when specified', async (format) => {
      systemMock.get.mockResolvedValue({ image: { previewFormat: format } });
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      const previewPath = `upload/thumbs/user-id/as/se/asset-id-preview.${format}`;

      await sut.handleGeneratePreview({ id: assetStub.image.id });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/as/se');
      expect(mediaMock.generateThumbnail).toHaveBeenCalledWith('/original/path.jpg', previewPath, {
        size: 1440,
        format,
        quality: 80,
        colorspace: Colorspace.SRGB,
      });
      expect(assetMock.update).toHaveBeenCalledWith({ id: 'asset-id', previewPath });
    });

    it('should delete previous preview if different path', async () => {
      const previousPreviewPath = assetStub.image.previewPath;

      systemMock.get.mockResolvedValue({ image: { thumbnailFormat: ImageFormat.WEBP } });
      assetMock.getByIds.mockResolvedValue([assetStub.image]);

      await sut.handleGeneratePreview({ id: assetStub.image.id });

      expect(storageMock.unlink).toHaveBeenCalledWith(previousPreviewPath);
    });

    it('should generate a P3 thumbnail for a wide gamut image', async () => {
      assetMock.getByIds.mockResolvedValue([
        { ...assetStub.image, exifInfo: { profileDescription: 'Adobe RGB', bitsPerSample: 14 } as ExifEntity },
      ]);
      await sut.handleGeneratePreview({ id: assetStub.image.id });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/as/se');
      expect(mediaMock.generateThumbnail).toHaveBeenCalledWith(
        '/original/path.jpg',
        'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
        {
          size: 1440,
          format: ImageFormat.JPEG,
          quality: 80,
          colorspace: Colorspace.P3,
        },
      );
      expect(assetMock.update).toHaveBeenCalledWith({
        id: 'asset-id',
        previewPath: 'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
      });
    });

    it('should generate a thumbnail for a video', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleGeneratePreview({ id: assetStub.video.id });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/as/se');
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
        {
          inputOptions: ['-ss 00:00:00', '-sws_flags accurate_rnd+bitexact+full_chroma_int'],
          outputOptions: [
            '-frames:v 1',
            '-v verbose',
            '-vf scale=-2:1440:flags=lanczos+accurate_rnd+bitexact+full_chroma_int:out_color_matrix=601:out_range=pc,format=yuv420p',
          ],
          twoPass: false,
        },
      );
      expect(assetMock.update).toHaveBeenCalledWith({
        id: 'asset-id',
        previewPath: 'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
      });
    });

    it('should tonemap thumbnail for hdr video', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleGeneratePreview({ id: assetStub.video.id });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/as/se');
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
        {
          inputOptions: ['-ss 00:00:00', '-sws_flags accurate_rnd+bitexact+full_chroma_int'],
          outputOptions: [
            '-frames:v 1',
            '-v verbose',
            '-vf zscale=t=linear:npl=100,tonemap=hable:desat=0,zscale=p=bt709:t=601:m=bt470bg:range=pc,format=yuv420p',
          ],
          twoPass: false,
        },
      );
      expect(assetMock.update).toHaveBeenCalledWith({
        id: 'asset-id',
        previewPath: 'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
      });
    });

    it('should always generate video thumbnail in one pass', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
      systemMock.get.mockResolvedValue({
        ffmpeg: { twoPass: true, maxBitrate: '5000k' },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleGeneratePreview({ id: assetStub.video.id });

      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/thumbs/user-id/as/se/asset-id-preview.jpeg',
        {
          inputOptions: ['-ss 00:00:00', '-sws_flags accurate_rnd+bitexact+full_chroma_int'],
          outputOptions: [
            '-frames:v 1',
            '-v verbose',
            '-vf zscale=t=linear:npl=100,tonemap=hable:desat=0,zscale=p=bt709:t=601:m=bt470bg:range=pc,format=yuv420p',
          ],
          twoPass: false,
        },
      );
    });

    it('should run successfully', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      await sut.handleGeneratePreview({ id: assetStub.image.id });
    });
  });

  describe('handleGenerateThumbnail', () => {
    it('should skip thumbnail generation if asset not found', async () => {
      assetMock.getByIds.mockResolvedValue([]);
      await sut.handleGenerateThumbnail({ id: assetStub.image.id });
      expect(mediaMock.generateThumbnail).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalledWith();
    });

    it('should skip invisible assets', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.livePhotoMotionAsset]);

      expect(await sut.handleGenerateThumbnail({ id: assetStub.livePhotoMotionAsset.id })).toEqual(JobStatus.SKIPPED);

      expect(mediaMock.generateThumbnail).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalledWith();
    });

    it.each(Object.values(ImageFormat))(
      'should generate a %s thumbnail for an image when specified',
      async (format) => {
        systemMock.get.mockResolvedValue({ image: { thumbnailFormat: format } });
        assetMock.getByIds.mockResolvedValue([assetStub.image]);
        const thumbnailPath = `upload/thumbs/user-id/as/se/asset-id-thumbnail.${format}`;

        await sut.handleGenerateThumbnail({ id: assetStub.image.id });

        expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/as/se');
        expect(mediaMock.generateThumbnail).toHaveBeenCalledWith('/original/path.jpg', thumbnailPath, {
          size: 250,
          format,
          quality: 80,
          colorspace: Colorspace.SRGB,
        });
        expect(assetMock.update).toHaveBeenCalledWith({ id: 'asset-id', thumbnailPath });
      },
    );

    it('should delete previous thumbnail if different path', async () => {
      const previousThumbnailPath = assetStub.image.thumbnailPath;

      systemMock.get.mockResolvedValue({ image: { thumbnailFormat: ImageFormat.WEBP } });
      assetMock.getByIds.mockResolvedValue([assetStub.image]);

      await sut.handleGenerateThumbnail({ id: assetStub.image.id });

      expect(storageMock.unlink).toHaveBeenCalledWith(previousThumbnailPath);
    });
  });

  it('should generate a P3 thumbnail for a wide gamut image', async () => {
    assetMock.getByIds.mockResolvedValue([assetStub.imageDng]);
    await sut.handleGenerateThumbnail({ id: assetStub.image.id });

    expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id/as/se');
    expect(mediaMock.generateThumbnail).toHaveBeenCalledWith(
      assetStub.imageDng.originalPath,
      'upload/thumbs/user-id/as/se/asset-id-thumbnail.webp',
      {
        format: ImageFormat.WEBP,
        size: 250,
        quality: 80,
        colorspace: Colorspace.P3,
      },
    );
    expect(assetMock.update).toHaveBeenCalledWith({
      id: 'asset-id',
      thumbnailPath: 'upload/thumbs/user-id/as/se/asset-id-thumbnail.webp',
    });
  });

  it('should extract embedded image if enabled and available', async () => {
    mediaMock.extract.mockResolvedValue(true);
    mediaMock.getImageDimensions.mockResolvedValue({ width: 3840, height: 2160 });
    systemMock.get.mockResolvedValue({ image: { extractEmbedded: true } });
    assetMock.getByIds.mockResolvedValue([assetStub.imageDng]);

    await sut.handleGenerateThumbnail({ id: assetStub.image.id });

    const extractedPath = mediaMock.extract.mock.calls.at(-1)?.[1].toString();
    expect(mediaMock.generateThumbnail.mock.calls).toEqual([
      [
        extractedPath,
        'upload/thumbs/user-id/as/se/asset-id-thumbnail.webp',
        {
          format: ImageFormat.WEBP,
          size: 250,
          quality: 80,
          colorspace: Colorspace.P3,
        },
      ],
    ]);
    expect(extractedPath?.endsWith('.tmp')).toBe(true);
    expect(storageMock.unlink).toHaveBeenCalledWith(extractedPath);
  });

  it('should resize original image if embedded image is too small', async () => {
    mediaMock.extract.mockResolvedValue(true);
    mediaMock.getImageDimensions.mockResolvedValue({ width: 1000, height: 1000 });
    systemMock.get.mockResolvedValue({ image: { extractEmbedded: true } });
    assetMock.getByIds.mockResolvedValue([assetStub.imageDng]);

    await sut.handleGenerateThumbnail({ id: assetStub.image.id });

    expect(mediaMock.generateThumbnail.mock.calls).toEqual([
      [
        assetStub.imageDng.originalPath,
        'upload/thumbs/user-id/as/se/asset-id-thumbnail.webp',
        {
          format: ImageFormat.WEBP,
          size: 250,
          quality: 80,
          colorspace: Colorspace.P3,
        },
      ],
    ]);
    const extractedPath = mediaMock.extract.mock.calls.at(-1)?.[1].toString();
    expect(extractedPath?.endsWith('.tmp')).toBe(true);
    expect(storageMock.unlink).toHaveBeenCalledWith(extractedPath);
  });

  it('should resize original image if embedded image not found', async () => {
    systemMock.get.mockResolvedValue({ image: { extractEmbedded: true } });
    assetMock.getByIds.mockResolvedValue([assetStub.imageDng]);

    await sut.handleGenerateThumbnail({ id: assetStub.image.id });

    expect(mediaMock.generateThumbnail).toHaveBeenCalledWith(
      assetStub.imageDng.originalPath,
      'upload/thumbs/user-id/as/se/asset-id-thumbnail.webp',
      {
        format: ImageFormat.WEBP,
        size: 250,
        quality: 80,
        colorspace: Colorspace.P3,
      },
    );
    expect(mediaMock.getImageDimensions).not.toHaveBeenCalled();
  });

  it('should resize original image if embedded image extraction is not enabled', async () => {
    systemMock.get.mockResolvedValue({ image: { extractEmbedded: false } });
    assetMock.getByIds.mockResolvedValue([assetStub.imageDng]);

    await sut.handleGenerateThumbnail({ id: assetStub.image.id });

    expect(mediaMock.extract).not.toHaveBeenCalled();
    expect(mediaMock.generateThumbnail).toHaveBeenCalledWith(
      assetStub.imageDng.originalPath,
      'upload/thumbs/user-id/as/se/asset-id-thumbnail.webp',
      {
        format: ImageFormat.WEBP,
        size: 250,
        quality: 80,
        colorspace: Colorspace.P3,
      },
    );
    expect(mediaMock.getImageDimensions).not.toHaveBeenCalled();
  });

  describe('handleGenerateThumbhash', () => {
    it('should skip thumbhash generation if asset not found', async () => {
      assetMock.getByIds.mockResolvedValue([]);
      await sut.handleGenerateThumbhash({ id: assetStub.image.id });
      expect(mediaMock.generateThumbhash).not.toHaveBeenCalled();
    });

    it('should skip thumbhash generation if resize path is missing', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.noResizePath]);
      await sut.handleGenerateThumbhash({ id: assetStub.noResizePath.id });
      expect(mediaMock.generateThumbhash).not.toHaveBeenCalled();
    });

    it('should skip invisible assets', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.livePhotoMotionAsset]);

      expect(await sut.handleGenerateThumbhash({ id: assetStub.livePhotoMotionAsset.id })).toEqual(JobStatus.SKIPPED);

      expect(mediaMock.generateThumbhash).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalledWith();
    });

    it('should generate a thumbhash', async () => {
      const thumbhashBuffer = Buffer.from('a thumbhash', 'utf8');
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      mediaMock.generateThumbhash.mockResolvedValue(thumbhashBuffer);

      await sut.handleGenerateThumbhash({ id: assetStub.image.id });

      expect(mediaMock.generateThumbhash).toHaveBeenCalledWith('/uploads/user-id/thumbs/path.jpg');
      expect(assetMock.update).toHaveBeenCalledWith({ id: 'asset-id', thumbhash: thumbhashBuffer });
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
      mediaMock.probe.mockResolvedValue(probeStub.multipleVideoStreams);

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mediaMock.probe).toHaveBeenCalledWith('/original/path.ext');
      expect(systemMock.get).toHaveBeenCalled();
      expect(storageMock.mkdirSync).toHaveBeenCalled();
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-map 0:0', '-map 0:1']),
          twoPass: false,
        },
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

    it('should transcode when set to all', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.multipleVideoStreams);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.ALL } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.any(Array),
          twoPass: false,
        },
      );
    });

    it('should transcode when optimal and too big', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.OPTIMAL } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.any(Array),
          twoPass: false,
        },
      );
    });

    it('should transcode when policy Bitrate and bitrate higher than max bitrate', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream40Mbps);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.BITRATE, maxBitrate: '30M' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.any(Array),
          twoPass: false,
        },
      );
    });

    it('should not scale resolution if no target resolution', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.ALL, targetResolution: 'original' } });
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('scale')]),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([expect.stringMatching(/scale(_.+)?=-2:720/)]),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([expect.stringMatching(/scale(_.+)?=720:-2/)]),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([expect.stringMatching(/scale(_.+)?=-2:354/)]),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([expect.stringMatching(/scale(_.+)?=354:-2/)]),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v copy', '-c:a aac']),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining(['-tag:v hvc1']),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v copy', '-tag:v hvc1']),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v h264', '-c:a copy']),
          twoPass: false,
        },
      );
    });

    it('should throw an exception if transcode value is invalid', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      systemMock.get.mockResolvedValue({ ffmpeg: { transcode: 'invalid' as any } });

      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).rejects.toThrow();
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should not transcode if transcoding is disabled', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v h264', '-maxrate 4500k', '-bufsize 9000k']),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v h264', '-b:v 3104k', '-minrate 1552k', '-maxrate 4500k']),
          twoPass: true,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v h264', '-c:a copy']),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-b:v 3104k', '-minrate 1552k', '-maxrate 4500k']),
          twoPass: true,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-maxrate')]),
          twoPass: true,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-cpu-used 2']),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-cpu-used')]),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-threads 2']),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-threads 1', '-x264-params frame-threads=1:pools=none']),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-threads')]),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v hevc', '-threads 1', '-x265-params frame-threads=1:pools=none']),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-threads')]),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([
            '-c:v av1',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-map 0:0',
            '-map 0:1',
            '-v verbose',
            '-vf scale=-2:720,format=yuv420p',
            '-preset 12',
            '-crf 23',
          ]),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-preset 4']),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-svtav1-params mbr=2M']),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-svtav1-params lp=4']),
          twoPass: false,
        },
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
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-svtav1-params lp=4:mbr=2M']),
          twoPass: false,
        },
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
      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).resolves.toBe(JobStatus.FAILED);
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should fail if hwaccel option is invalid', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: 'invalid' as any } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).resolves.toBe(JobStatus.FAILED);
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
        {
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
            '-vf format=nv12,hwupload_cuda,scale_cuda=-2:720',
            '-preset p1',
            '-cq:v 23',
          ]),
          twoPass: false,
        },
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
        {
          inputOptions: expect.arrayContaining(['-init_hw_device cuda=cuda:0', '-filter_hw_device cuda']),
          outputOptions: expect.arrayContaining([expect.stringContaining('-multipass')]),
          twoPass: false,
        },
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
        {
          inputOptions: expect.arrayContaining(['-init_hw_device cuda=cuda:0', '-filter_hw_device cuda']),
          outputOptions: expect.arrayContaining(['-cq:v 23', '-maxrate 10000k', '-bufsize 6897k']),
          twoPass: false,
        },
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
        {
          inputOptions: expect.arrayContaining(['-init_hw_device cuda=cuda:0', '-filter_hw_device cuda']),
          outputOptions: expect.not.stringContaining('-maxrate'),
          twoPass: false,
        },
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
        {
          inputOptions: expect.arrayContaining(['-init_hw_device cuda=cuda:0', '-filter_hw_device cuda']),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-preset')]),
          twoPass: false,
        },
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
        {
          inputOptions: expect.arrayContaining(['-init_hw_device cuda=cuda:0', '-filter_hw_device cuda']),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-multipass')]),
          twoPass: false,
        },
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
        {
          inputOptions: expect.arrayContaining([
            '-hwaccel cuda',
            '-hwaccel_output_format cuda',
            '-noautorotate',
            '-threads 1',
          ]),
          outputOptions: expect.arrayContaining([expect.stringContaining('scale_cuda=-2:720:format=nv12')]),
          twoPass: false,
        },
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
        {
          inputOptions: expect.arrayContaining(['-hwaccel cuda', '-hwaccel_output_format cuda']),
          outputOptions: expect.arrayContaining([
            expect.stringContaining(
              'tonemap_cuda=desat=0:matrix=bt709:primaries=bt709:range=pc:tonemap=hable:transfer=bt709:format=nv12',
            ),
          ]),
          twoPass: false,
        },
      );
    });

    it('should set options for qsv', async () => {
      storageMock.readdir.mockResolvedValue(['renderD128']);
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.QSV, maxBitrate: '10000k' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.arrayContaining(['-init_hw_device qsv=hw', '-filter_hw_device hw']),
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
            '-vf format=nv12,hwupload=extra_hw_frames=64,scale_qsv=-1:720',
            '-preset 7',
            '-global_quality 23',
            '-maxrate 10000k',
            '-bufsize 20000k',
          ]),
          twoPass: false,
        },
      );
    });

    it('should set options for qsv with custom dri node', async () => {
      storageMock.readdir.mockResolvedValue(['renderD128']);
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
        {
          inputOptions: expect.arrayContaining([
            '-init_hw_device qsv=hw,child_device=/dev/dri/renderD128',
            '-filter_hw_device hw',
          ]),
          outputOptions: expect.any(Array),
          twoPass: false,
        },
      );
    });

    it('should omit preset for qsv if invalid', async () => {
      storageMock.readdir.mockResolvedValue(['renderD128']);
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.QSV, preset: 'invalid' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.arrayContaining(['-init_hw_device qsv=hw', '-filter_hw_device hw']),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-preset')]),
          twoPass: false,
        },
      );
    });

    it('should set low power mode for qsv if target video codec is vp9', async () => {
      storageMock.readdir.mockResolvedValue(['renderD128']);
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.QSV, targetVideoCodec: VideoCodec.VP9 } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.arrayContaining(['-init_hw_device qsv=hw', '-filter_hw_device hw']),
          outputOptions: expect.arrayContaining(['-low_power 1']),
          twoPass: false,
        },
      );
    });

    it('should fail for qsv if no hw devices', async () => {
      storageMock.readdir.mockResolvedValue([]);
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.QSV } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).resolves.toBe(JobStatus.FAILED);
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should set options for vaapi', async () => {
      storageMock.readdir.mockResolvedValue(['renderD128']);
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
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
            '-vf format=nv12,hwupload,scale_vaapi=-2:720',
            '-compression_level 7',
            '-rc_mode 1',
          ]),
          twoPass: false,
        },
      );
    });

    it('should set vbr options for vaapi when max bitrate is enabled', async () => {
      storageMock.readdir.mockResolvedValue(['renderD128']);
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI, maxBitrate: '10000k' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
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
        },
      );
    });

    it('should set cq options for vaapi when max bitrate is disabled', async () => {
      storageMock.readdir.mockResolvedValue(['renderD128']);
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.arrayContaining([
            '-init_hw_device vaapi=accel:/dev/dri/renderD128',
            '-filter_hw_device accel',
          ]),
          outputOptions: expect.arrayContaining([
            `-c:v h264_vaapi`,
            '-c:a copy',
            '-qp 23',
            '-global_quality 23',
            '-rc_mode 1',
          ]),
          twoPass: false,
        },
      );
    });

    it('should omit preset for vaapi if invalid', async () => {
      storageMock.readdir.mockResolvedValue(['renderD128']);
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI, preset: 'invalid' } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.arrayContaining([
            '-init_hw_device vaapi=accel:/dev/dri/renderD128',
            '-filter_hw_device accel',
          ]),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-compression_level')]),
          twoPass: false,
        },
      );
    });

    it('should prefer gpu for vaapi if available', async () => {
      storageMock.readdir.mockResolvedValue(['renderD129', 'card1', 'card0', 'renderD128']);
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.arrayContaining([
            '-init_hw_device vaapi=accel:/dev/dri/card1',
            '-filter_hw_device accel',
          ]),
          outputOptions: expect.arrayContaining([`-c:v h264_vaapi`]),
          twoPass: false,
        },
      );
    });

    it('should prefer higher index gpu node', async () => {
      storageMock.readdir.mockResolvedValue(['renderD129', 'renderD130', 'renderD128']);
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.arrayContaining([
            '-init_hw_device vaapi=accel:/dev/dri/renderD130',
            '-filter_hw_device accel',
          ]),
          outputOptions: expect.arrayContaining([`-c:v h264_vaapi`]),
          twoPass: false,
        },
      );
    });

    it('should select specific gpu node if selected', async () => {
      storageMock.readdir.mockResolvedValue(['renderD129', 'card1', 'card0', 'renderD128']);
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.VAAPI, preferredHwDevice: '/dev/dri/renderD128' },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.arrayContaining([
            '-init_hw_device vaapi=accel:/dev/dri/renderD128',
            '-filter_hw_device accel',
          ]),
          outputOptions: expect.arrayContaining([`-c:v h264_vaapi`]),
          twoPass: false,
        },
      );
    });

    it('should fallback to sw transcoding if hw transcoding fails', async () => {
      storageMock.readdir.mockResolvedValue(['renderD128']);
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      mediaMock.transcode.mockRejectedValueOnce(new Error('error'));
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledTimes(2);
      expect(mediaMock.transcode).toHaveBeenLastCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v h264']),
          twoPass: false,
        },
      );
    });

    it('should fail for vaapi if no hw devices', async () => {
      storageMock.readdir.mockResolvedValue([]);
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.VAAPI } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await expect(sut.handleVideoConversion({ id: assetStub.video.id })).resolves.toBe(JobStatus.FAILED);
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should set options for rkmpp', async () => {
      storageMock.readdir.mockResolvedValue(['renderD128']);
      storageMock.stat.mockResolvedValue({ ...new Stats(), isFile: () => true, isCharacterDevice: () => true });
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: true } });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.arrayContaining(['-hwaccel rkmpp', '-hwaccel_output_format drm_prime', '-afbc rga']),
          outputOptions: expect.arrayContaining([
            `-c:v h264_rkmpp`,
            '-c:a copy',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-map 0:0',
            '-map 0:1',
            '-g 256',
            '-v verbose',
            '-vf scale_rkrga=-2:720:format=nv12:afbc=1',
            '-level 51',
            '-rc_mode CQP',
            '-qp_init 23',
          ]),
          twoPass: false,
        },
      );
    });

    it('should set vbr options for rkmpp when max bitrate is enabled', async () => {
      storageMock.readdir.mockResolvedValue(['renderD128']);
      storageMock.stat.mockResolvedValue({ ...new Stats(), isFile: () => true, isCharacterDevice: () => true });
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
        {
          inputOptions: expect.arrayContaining(['-hwaccel rkmpp', '-hwaccel_output_format drm_prime', '-afbc rga']),
          outputOptions: expect.arrayContaining([`-c:v hevc_rkmpp`, '-level 153', '-rc_mode AVBR', '-b:v 10000k']),
          twoPass: false,
        },
      );
    });

    it('should set cqp options for rkmpp when max bitrate is disabled', async () => {
      storageMock.readdir.mockResolvedValue(['renderD128']);
      storageMock.stat.mockResolvedValue({ ...new Stats(), isFile: () => true, isCharacterDevice: () => true });
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: true, crf: 30, maxBitrate: '0' },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.arrayContaining(['-hwaccel rkmpp', '-hwaccel_output_format drm_prime', '-afbc rga']),
          outputOptions: expect.arrayContaining([`-c:v h264_rkmpp`, '-level 51', '-rc_mode CQP', '-qp_init 30']),
          twoPass: false,
        },
      );
    });

    it('should set OpenCL tonemapping options for rkmpp when OpenCL is available', async () => {
      storageMock.readdir.mockResolvedValue(['renderD128']);
      storageMock.stat.mockResolvedValue({ ...new Stats(), isFile: () => true, isCharacterDevice: () => true });
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: true, crf: 30, maxBitrate: '0' },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: expect.arrayContaining(['-hwaccel rkmpp', '-hwaccel_output_format drm_prime', '-afbc rga']),
          outputOptions: expect.arrayContaining([
            expect.stringContaining(
              'scale_rkrga=-2:720:format=p010:afbc=1,hwmap=derive_device=opencl:mode=read,tonemap_opencl=format=nv12:r=pc:p=bt709:t=bt709:m=bt709:tonemap=hable:desat=0,hwmap=derive_device=rkmpp:mode=write:reverse=1,format=drm_prime',
            ),
          ]),
          twoPass: false,
        },
      );
    });

    it('should use software decoding and tone-mapping if hardware decoding is disabled', async () => {
      storageMock.readdir.mockResolvedValue(['renderD128']);
      storageMock.stat.mockResolvedValue({ ...new Stats(), isFile: () => true, isCharacterDevice: () => true });
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: false, crf: 30, maxBitrate: '0' },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: expect.arrayContaining([
            expect.stringContaining(
              'zscale=t=linear:npl=100,tonemap=hable:desat=0,zscale=p=bt709:t=bt709:m=bt709:range=pc,format=yuv420p',
            ),
          ]),
          twoPass: false,
        },
      );
    });

    it('should use software decoding and tone-mapping if opencl is not available', async () => {
      storageMock.readdir.mockResolvedValue(['renderD128']);
      storageMock.stat.mockResolvedValue({ ...new Stats(), isFile: () => false, isCharacterDevice: () => false });
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
      systemMock.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHWAccel.RKMPP, accelDecode: true, crf: 30, maxBitrate: '0' },
      });
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/as/se/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: expect.arrayContaining([
            expect.stringContaining(
              'zscale=t=linear:npl=100,tonemap=hable:desat=0,zscale=p=bt709:t=bt709:m=bt709:range=pc,format=yuv420p',
            ),
          ]),
          twoPass: false,
        },
      );
    });
  });

  it('should tonemap when policy is required and video is hdr', async () => {
    mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
    systemMock.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.REQUIRED } });
    assetMock.getByIds.mockResolvedValue([assetStub.video]);
    await sut.handleVideoConversion({ id: assetStub.video.id });
    expect(mediaMock.transcode).toHaveBeenCalledWith(
      '/original/path.ext',
      'upload/encoded-video/user-id/as/se/asset-id.mp4',
      {
        inputOptions: expect.any(Array),
        outputOptions: expect.arrayContaining([
          '-c:v h264',
          '-c:a copy',
          '-vf zscale=t=linear:npl=100,tonemap=hable:desat=0,zscale=p=bt709:t=bt709:m=bt709:range=pc,format=yuv420p',
        ]),
        twoPass: false,
      },
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
      {
        inputOptions: expect.any(Array),
        outputOptions: expect.arrayContaining([
          '-c:v h264',
          '-c:a copy',
          '-vf zscale=t=linear:npl=100,tonemap=hable:desat=0,zscale=p=bt709:t=bt709:m=bt709:range=pc,format=yuv420p',
        ]),
        twoPass: false,
      },
    );
  });

  it('should set npl to 250 for reinhard and mobius tone-mapping algorithms', async () => {
    mediaMock.probe.mockResolvedValue(probeStub.videoStreamHDR);
    systemMock.get.mockResolvedValue({ ffmpeg: { tonemap: ToneMapping.MOBIUS } });
    assetMock.getByIds.mockResolvedValue([assetStub.video]);
    await sut.handleVideoConversion({ id: assetStub.video.id });
    expect(mediaMock.transcode).toHaveBeenCalledWith(
      '/original/path.ext',
      'upload/encoded-video/user-id/as/se/asset-id.mp4',
      {
        inputOptions: expect.any(Array),
        outputOptions: expect.arrayContaining([
          '-c:v h264',
          '-c:a copy',
          '-vf zscale=t=linear:npl=250,tonemap=mobius:desat=0,zscale=p=bt709:t=bt709:m=bt709:range=pc,format=yuv420p',
        ]),
        twoPass: false,
      },
    );
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

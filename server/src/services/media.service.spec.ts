import { ShallowDehydrateObject } from 'kysely';
import { OutputInfo } from 'sharp';
import type { AudioStreamInfo, JobCounts, RawImageInfo, VideoFormat, VideoStreamInfo } from 'src/types.js';
import { Exif } from 'src/database.js';
import { SystemConfig } from 'src/dtos/config.dto.js';
import { AssetEditAction } from 'src/dtos/editing.dto.js';
import {
  AssetFileType,
  AssetPathType,
  AssetStatus,
  AssetType,
  AssetVisibility,
  AudioCodec,
  Colorspace,
  ExifOrientation,
  ImageFormat,
  JobName,
  JobStatus,
  RawExtractedFormat,
  TranscodeHardwareAcceleration,
  TranscodePolicy,
  VideoCodec,
} from 'src/enum.js';
import { MediaService } from 'src/services/media.service.js';
import { AssetFaceFactory } from 'test/factories/asset-face.factory.js';
import { AssetFileFactory } from 'test/factories/asset-file.factory.js';
import { AssetFactory } from 'test/factories/asset.factory.js';
import { PersonFactory } from 'test/factories/person.factory.js';
import { probeStub } from 'test/fixtures/media.stub.js';
import { personThumbnailStub } from 'test/fixtures/person.stub.js';
import { systemConfigStub } from 'test/fixtures/system-config.stub.js';
import { getForAsset, getForGenerateThumbnail } from 'test/mappers.js';
import { factory, newUuid } from 'test/small.factory.js';
import { ServiceMocks, makeStream, newTestService } from 'test/utils.js';

const fullsizeBuffer = Buffer.from('embedded image data');
const rawBuffer = Buffer.from('raw image data');
const extractedBuffer = Buffer.from('embedded image file');
const makeSidecarAsset = () =>
  AssetFactory.from({ originalFileName: 'image.nef' })
    .exif({ exifImageWidth: 6000, exifImageHeight: 4000 })
    .file({ type: AssetFileType.Sidecar, path: '/library/image.nef.xmp' })
    .file({ type: AssetFileType.Preview, path: '/cache/published-preview.jpeg' });

describe(MediaService.name, () => {
  let sut: MediaService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(MediaService));
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  // TODO these should all become medium tests of either the service or the repository.
  // The entire logic of what to queue lives in the SQL query now
  describe('handleQueueGenerateThumbnails', () => {
    it('should queue all assets', async () => {
      const asset = AssetFactory.create();
      const person = PersonFactory.create({ faceAssetId: newUuid() });
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([asset]));

      mocks.person.getAll.mockReturnValue(makeStream([person]));

      await sut.handleQueueGenerateThumbnails({ force: true });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith({ force: true, fullsizeEnabled: false });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetGenerateThumbnails,
          data: { id: asset.id },
        },
      ]);

      expect(mocks.person.getAll).toHaveBeenCalledWith(undefined);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.PersonGenerateThumbnail,
          data: { ownerId: person.ownerId, personGroupId: person.personGroupId },
        },
      ]);
    });

    it('should queue trashed assets when force is true', async () => {
      const asset = AssetFactory.create({ status: AssetStatus.Trashed, deletedAt: new Date() });
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([asset]));
      mocks.person.getAll.mockReturnValue(makeStream());

      await sut.handleQueueGenerateThumbnails({ force: true });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith({ force: true, fullsizeEnabled: false });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetGenerateThumbnails,
          data: { id: asset.id },
        },
      ]);
    });

    it('should queue archived assets when force is true', async () => {
      const asset = AssetFactory.create({ visibility: AssetVisibility.Archive });
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([asset]));
      mocks.person.getAll.mockReturnValue(makeStream());

      await sut.handleQueueGenerateThumbnails({ force: true });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith({ force: true, fullsizeEnabled: false });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetGenerateThumbnails,
          data: { id: asset.id },
        },
      ]);
    });

    it('should queue all people with missing thumbnail path', async () => {
      const [person1, person2] = [
        PersonFactory.create({ thumbnailPath: undefined }),
        PersonFactory.create({ thumbnailPath: undefined }),
      ];

      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([AssetFactory.create()]));
      mocks.person.getAll.mockReturnValue(makeStream([person1, person2]));
      mocks.person.getRandomFace.mockResolvedValueOnce(AssetFaceFactory.create());

      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith({ force: false, fullsizeEnabled: false });
      expect(mocks.person.getAll).toHaveBeenCalledWith({ thumbnailPath: '' });
      expect(mocks.person.getRandomFace).toHaveBeenCalled();
      expect(mocks.person.update).toHaveBeenCalledTimes(1);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.PersonGenerateThumbnail,
          data: {
            ownerId: person1.ownerId,
            personGroupId: person1.personGroupId,
          },
        },
      ]);
    });

    it('should queue all assets with missing resize path', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([asset]));
      mocks.person.getAll.mockReturnValue(makeStream());
      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith({ force: false, fullsizeEnabled: false });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetGenerateThumbnails,
          data: { id: asset.id },
        },
      ]);

      expect(mocks.person.getAll).toHaveBeenCalledWith({ thumbnailPath: '' });
    });

    it('should queue all assets with missing preview', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([asset]));
      mocks.person.getAll.mockReturnValue(makeStream());
      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith({ force: false, fullsizeEnabled: false });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetGenerateThumbnails, data: { id: asset.id } },
      ]);
      expect(mocks.person.getAll).toHaveBeenCalledWith({ thumbnailPath: '' });
    });

    it('should queue all assets with missing thumbhash', async () => {
      const asset = AssetFactory.from({ thumbhash: null })
        .files([AssetFileType.Thumbnail, AssetFileType.Preview])
        .build();
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([asset]));
      mocks.person.getAll.mockReturnValue(makeStream());
      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith({ force: false, fullsizeEnabled: false });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetGenerateThumbnails, data: { id: asset.id } },
      ]);

      expect(mocks.person.getAll).toHaveBeenCalledWith({ thumbnailPath: '' });
    });

    it('should queue all assets with missing fullsize when feature is enabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { fullsize: { enabled: true } } });
      const asset = { id: factory.uuid(), isEdited: false };
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([asset]));
      mocks.person.getAll.mockReturnValue(makeStream());
      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith({ force: false, fullsizeEnabled: true });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetGenerateThumbnails,
          data: { id: asset.id },
        },
      ]);

      expect(mocks.person.getAll).toHaveBeenCalledWith({ thumbnailPath: '' });
    });

    it('should not queue assets with missing fullsize when feature is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { fullsize: { enabled: false } } });
      const asset = { id: factory.uuid(), isEdited: false };
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([asset]));
      mocks.person.getAll.mockReturnValue(makeStream());
      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith({ force: false, fullsizeEnabled: false });
      expect(mocks.job.queueAll).toHaveBeenCalledTimes(1);
      expect(mocks.person.getAll).toHaveBeenCalledWith({ thumbnailPath: '' });
    });

    it('should queue assets with edits but missing edited thumbnails', async () => {
      const asset = AssetFactory.from().edit().build();
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([asset]));
      mocks.person.getAll.mockReturnValue(makeStream());
      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith({ force: false, fullsizeEnabled: false });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetEditThumbnailGeneration,
          data: { id: asset.id },
        },
      ]);

      expect(mocks.person.getAll).toHaveBeenCalledWith({ thumbnailPath: '' });
    });

    it('should not queue assets with missing edited fullsize when feature is disabled', async () => {
      const asset = AssetFactory.from().edit().build();
      mocks.systemMetadata.get.mockResolvedValue({ image: { fullsize: { enabled: false } } });
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([asset]));
      mocks.person.getAll.mockReturnValue(makeStream());
      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith({ force: false, fullsizeEnabled: false });
      expect(mocks.job.queueAll).toHaveBeenCalledTimes(1);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetEditThumbnailGeneration, data: { id: asset.id } },
      ]);

      expect(mocks.person.getAll).toHaveBeenCalledWith({ thumbnailPath: '' });
    });

    it('should queue assets with missing fullsize when force is true, regardless of setting', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { fullsize: { enabled: false } } });
      const asset = { id: factory.uuid(), isEdited: false };
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([asset]));
      mocks.person.getAll.mockReturnValue(makeStream());
      await sut.handleQueueGenerateThumbnails({ force: true });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith({ force: true, fullsizeEnabled: false });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetGenerateThumbnails,
          data: { id: asset.id },
        },
      ]);

      expect(mocks.person.getAll).toHaveBeenCalled();
    });

    it('should queue both regular and edited thumbnails for assets with edits when force is true', async () => {
      const asset = AssetFactory.from().edit().build();
      mocks.assetJob.streamForThumbnailJob.mockReturnValue(makeStream([asset]));
      mocks.person.getAll.mockReturnValue(makeStream());
      await sut.handleQueueGenerateThumbnails({ force: true });

      expect(mocks.assetJob.streamForThumbnailJob).toHaveBeenCalledWith({ force: true, fullsizeEnabled: false });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetGenerateThumbnails,
          data: { id: asset.id },
        },
        {
          name: JobName.AssetEditThumbnailGeneration,
          data: { id: asset.id },
        },
      ]);

      expect(mocks.person.getAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('handleQueueMigration', () => {
    it('should remove empty directories and queue jobs', async () => {
      const asset = AssetFactory.create();
      const person = PersonFactory.create();

      mocks.assetJob.streamForMigrationJob.mockReturnValue(makeStream([asset]));
      mocks.job.getJobCounts.mockResolvedValue({ active: 1, waiting: 0 } as JobCounts);
      mocks.person.getAll.mockReturnValue(makeStream([person]));

      await expect(sut.handleQueueMigration()).resolves.toBe(JobStatus.Success);

      expect(mocks.storage.removeEmptyDirs).toHaveBeenCalledTimes(2);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.AssetFileMigration, data: { id: asset.id } }]);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.PersonFileMigration,
          data: { ownerId: person.ownerId, personGroupId: person.personGroupId },
        },
      ]);
    });
  });

  describe('handleAssetMigration', () => {
    it('preserves generation filenames and only replaces the pointer that was actually moved', async () => {
      const generationId = newUuid();
      const asset = AssetFactory.from().build();
      const basename = `${asset.id}_preview-${generationId}.jpeg`;
      const oldPath = `/old-thumbs/${basename}`;
      const newPath = `/data/thumbs/${asset.ownerId}/${asset.id.slice(0, 2)}/${asset.id.slice(2, 4)}/${basename}`;
      mocks.assetJob.getForMigrationJob.mockResolvedValue({
        ...asset,
        files: [AssetFileFactory.create({ assetId: asset.id, type: AssetFileType.Preview, path: oldPath })],
      });
      mocks.move.create.mockResolvedValue({
        entityId: asset.id,
        id: 'move-id',
        oldPath,
        newPath,
        pathType: AssetFileType.Preview,
      });

      await expect(sut.handleAssetMigration({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.storage.rename).toHaveBeenCalledExactlyOnceWith(oldPath, newPath);
      expect(mocks.asset.replaceFilePath).toHaveBeenCalledExactlyOnceWith(
        asset.id,
        AssetFileType.Preview,
        oldPath,
        newPath,
      );
      expect(mocks.asset.upsertFile).not.toHaveBeenCalled();
      expect(mocks.storage.unlink).not.toHaveBeenCalled();
    });

    it('removes a retired generation moved after a newer preview was published', async () => {
      const asset = AssetFactory.from().file({ type: AssetFileType.Preview }).build();
      mocks.assetJob.getForMigrationJob.mockResolvedValue(asset);
      mocks.move.create.mockImplementation((request) => Promise.resolve({ ...request, id: 'move-id' }));
      mocks.asset.replaceFilePath.mockResolvedValue(false);

      await expect(sut.handleAssetMigration({ id: asset.id })).resolves.toBe(JobStatus.Success);

      const newPath = mocks.storage.rename.mock.calls[0][1];
      expect(mocks.storage.unlink).toHaveBeenCalledExactlyOnceWith(newPath);
      expect(mocks.asset.upsertFile).not.toHaveBeenCalled();
      expect(mocks.move.delete).toHaveBeenCalledExactlyOnceWith('move-id');
    });

    it('retires an interrupted move from an old generation without moving its bytes into the new generation', async () => {
      const asset = AssetFactory.from()
        .file({ type: AssetFileType.Preview, path: '/cache/current-preview.jpeg' })
        .build();
      mocks.assetJob.getForMigrationJob.mockResolvedValue(asset);
      mocks.move.getByEntity.mockResolvedValueOnce({
        entityId: asset.id,
        id: 'retired-move',
        pathType: AssetFileType.Preview,
        oldPath: '/cache/retired-preview.jpeg',
        newPath: '/moved-cache/retired-preview.jpeg',
      });
      mocks.move.create.mockImplementation((request) => Promise.resolve({ ...request, id: 'current-move' }));

      await expect(sut.handleAssetMigration({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.storage.rename).toHaveBeenCalledExactlyOnceWith(asset.files[0].path, expect.any(String));
      expect(mocks.storage.unlink).toHaveBeenCalledWith('/cache/retired-preview.jpeg');
      expect(mocks.storage.unlink).toHaveBeenCalledWith('/moved-cache/retired-preview.jpeg');
      expect(mocks.storage.unlink).not.toHaveBeenCalledWith(asset.files[0].path);
      expect(mocks.move.update).not.toHaveBeenCalled();
      expect(mocks.move.delete).toHaveBeenCalledWith('retired-move');
      expect(mocks.move.delete).toHaveBeenCalledWith('current-move');
    });

    it('should fail if asset does not exist', async () => {
      mocks.assetJob.getForMigrationJob.mockResolvedValue(void 0);
      await expect(sut.handleAssetMigration({ id: 'non-existent' })).resolves.toBe(JobStatus.Failed);

      expect(mocks.move.getByEntity).not.toHaveBeenCalled();
    });

    it('should move asset files', async () => {
      const asset = AssetFactory.from()
        .files([AssetFileType.FullSize, AssetFileType.Preview, AssetFileType.Thumbnail])
        .build();
      mocks.assetJob.getForMigrationJob.mockResolvedValue(asset);
      mocks.move.create.mockResolvedValue({
        entityId: asset.id,
        id: 'move-id',
        newPath: '/new/path',
        oldPath: '/old/path',
        pathType: AssetPathType.Original,
      });

      await expect(sut.handleAssetMigration({ id: asset.id })).resolves.toBe(JobStatus.Success);
      expect(mocks.move.create).toHaveBeenCalledWith({
        entityId: asset.id,
        pathType: AssetFileType.FullSize,
        oldPath: asset.files[0].path,
        newPath: `/data/thumbs/${asset.ownerId}/${asset.id.slice(0, 2)}/${asset.id.slice(2, 4)}/${asset.id}_fullsize.jpeg`,
      });
      expect(mocks.move.create).toHaveBeenCalledWith({
        entityId: asset.id,
        pathType: AssetFileType.Preview,
        oldPath: asset.files[1].path,
        newPath: `/data/thumbs/${asset.ownerId}/${asset.id.slice(0, 2)}/${asset.id.slice(2, 4)}/${asset.id}_preview.jpeg`,
      });
      expect(mocks.move.create).toHaveBeenCalledWith({
        entityId: asset.id,
        pathType: AssetFileType.Thumbnail,
        oldPath: asset.files[2].path,
        newPath: `/data/thumbs/${asset.ownerId}/${asset.id.slice(0, 2)}/${asset.id.slice(2, 4)}/${asset.id}_thumbnail.webp`,
      });
      expect(mocks.move.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('handleGenerateThumbnails', () => {
    let rawInfo: RawImageInfo;

    beforeEach(() => {
      rawInfo = { width: 100, height: 100, channels: 3 };
      mocks.person.getFaces.mockResolvedValue([]);
      mocks.ocr.getByAssetId.mockResolvedValue([]);
      mocks.media.decodeImage.mockImplementation((input) =>
        Promise.resolve(
          typeof input === 'string'
            ? { data: rawBuffer, info: rawInfo as OutputInfo } // string implies original file
            : { data: fullsizeBuffer, info: rawInfo as OutputInfo }, // buffer implies embedded image extracted
        ),
      );
      mocks.media.getImageMetadata.mockResolvedValue({ width: 100, height: 100, isTransparent: false });
    });

    it('should skip thumbnail generation if asset not found', async () => {
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(void 0);
      await sut.handleGenerateThumbnails({ id: 'non-existent' });

      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalledWith();
    });

    it('should skip thumbnail generation if asset type is unknown', async () => {
      const asset = AssetFactory.from({ type: 'foo' as AssetType })
        .exif()
        .build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));

      await expect(sut.handleGenerateThumbnails({ id: asset.id })).resolves.toBe(JobStatus.Skipped);
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalledWith();
    });

    it('should skip video thumbnail generation if no video stream', async () => {
      const asset = AssetFactory.from({ type: AssetType.Video }).exif().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue({
        ...getForGenerateThumbnail(asset),
        ...probeStub.noVideoStreams,
      });
      await expect(sut.handleGenerateThumbnails({ id: asset.id })).rejects.toThrowError();
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalledWith();
    });

    it('should skip invisible assets', async () => {
      const asset = AssetFactory.from({ visibility: AssetVisibility.Hidden }).exif().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));

      expect(await sut.handleGenerateThumbnails({ id: asset.id })).toEqual(JobStatus.Skipped);

      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalledWith();
    });

    it('should delete previous preview if different path', async () => {
      const asset = AssetFactory.from().file({ type: AssetFileType.Preview }).exif().build();
      mocks.systemMetadata.get.mockResolvedValue({ image: { thumbnail: { format: ImageFormat.Webp } } });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      mocks.asset.publishImageGeneration.mockResolvedValue(asset.files.map((file) => file.path));

      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FileDelete,
        data: {
          files: expect.arrayContaining([asset.files[0].path]),
        },
      });
    });

    it('should generate P3 thumbnails for a wide gamut image', async () => {
      const asset = AssetFactory.from()
        .exif({ profileDescription: 'Adobe RGB', bitsPerSample: 14 })
        .files([AssetFileType.Preview, AssetFileType.Thumbnail])
        .build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      const thumbhashBuffer = Buffer.from('a thumbhash', 'utf8');
      mocks.media.generateThumbhash.mockResolvedValue(thumbhashBuffer);

      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.any(String));

      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(asset.originalPath, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
        size: 1440,
      });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(2);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.Jpeg,
          size: 1440,
          quality: 80,
          progressive: false,
          processInvalidImages: false,
          edits: [],
        },
        expect.any(String),
      );
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.Webp,
          size: 250,
          quality: 80,
          progressive: false,
          processInvalidImages: false,
          edits: [],
        },
        expect.any(String),
      );

      expect(mocks.media.generateThumbhash).toHaveBeenCalledOnce();
      expect(mocks.media.generateThumbhash).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        {
          colorspace: Colorspace.P3,
          processInvalidImages: false,
          edits: [],
        },
      );

      expect(mocks.asset.publishImageGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          files: [
            {
              assetId: asset.id,
              type: AssetFileType.Preview,
              path: expect.any(String),
              isEdited: false,
              isProgressive: false,
              isTransparent: false,
            },
            {
              assetId: asset.id,
              type: AssetFileType.Thumbnail,
              path: expect.any(String),
              isEdited: false,
              isProgressive: false,
              isTransparent: false,
            },
          ],
        }),
      );
      expect(mocks.asset.publishImageGeneration).toHaveBeenCalledWith(
        expect.objectContaining({ assetId: asset.id, thumbhash: thumbhashBuffer }),
      );
    });

    it.each([false, true])(
      'encodes edited RAW fullsize pixels when original fullsize caching is %s',
      async (enabled) => {
        const asset = AssetFactory.from({ originalFileName: 'image.nef', originalPath: '/photos/image.nef' })
          .exif({ exifImageWidth: 3840, exifImageHeight: 2160 })
          .edit({ action: AssetEditAction.Rotate, parameters: { angle: 90 } })
          .build();
        mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
        mocks.systemMetadata.get.mockResolvedValue({ image: { extractEmbedded: true, fullsize: { enabled } } });
        const native = {
          data: rawBuffer,
          info: { width: 3840, height: 2160, channels: 4 as const },
          nativeDimensions: { width: 3840, height: 2160 },
          colorspace: Colorspace.P3,
          isDeveloped: false,
        };
        mocks.media.developImage.mockResolvedValue(native);

        await expect(sut.handleGenerateThumbnails({ id: asset.id })).resolves.toBe(JobStatus.Success);

        const publication = mocks.asset.publishImageGeneration.mock.calls[0][0];
        const keys = publication.files.map((file) => `${file.type}/${file.isEdited ?? false}`);
        expect(new Set(keys).size).toBe(keys.length);
        expect(publication.files).toContainEqual(
          expect.objectContaining({ type: AssetFileType.FullSize, isEdited: true }),
        );
        const fullsize = publication.files.find((file) => file.type === AssetFileType.FullSize && file.isEdited)!;
        expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
          { data: native.data, info: native.info },
          expect.objectContaining({ edits: asset.edits.map(({ action, parameters }) => ({ action, parameters })) }),
          fullsize.path,
        );
        expect(publication.files.some((file) => file.type === AssetFileType.FullSize && !file.isEdited)).toBe(enabled);
      },
    );

    it('should generate a thumbnail for a video', async () => {
      const asset = AssetFactory.from({ type: AssetType.Video, originalPath: '/original/path.ext' }).exif().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue({
        ...getForGenerateThumbnail(asset),
        ...probeStub.videoStream2160p,
      });
      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.any(String));
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: ['-skip_frame', 'nointra', '-sws_flags', 'accurate_rnd+full_chroma_int'],
          outputOptions: expect.arrayContaining([
            '-fps_mode',
            'vfr',
            '-frames:v',
            '1',
            '-update',
            '1',
            '-v',
            'verbose',
            '-vf',
            String.raw`fps=12:start_time=0:eof_action=pass:round=down,thumbnail=12,select=gt(scene\,0.1)-eq(prev_selected_n\,n)+isnan(prev_selected_n)+gt(n\,20),trim=end_frame=2,reverse,scale=-2:1440:flags=lanczos+accurate_rnd+full_chroma_int:out_range=pc`,
          ]),
          twoPass: false,
        }),
      );
      expect(mocks.asset.upsertFiles).toHaveBeenCalledWith([
        {
          assetId: asset.id,
          type: AssetFileType.Preview,
          path: expect.any(String),
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
        {
          assetId: asset.id,
          type: AssetFileType.Thumbnail,
          path: expect.any(String),
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
      ]);
    });

    it('should tonemap thumbnail for hdr video', async () => {
      const asset = AssetFactory.from({ type: AssetType.Video, originalPath: '/original/path.ext' }).exif().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue({
        ...getForGenerateThumbnail(asset),
        ...probeStub.videoStreamHDR,
      });
      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.any(String));
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: ['-skip_frame', 'nointra', '-sws_flags', 'accurate_rnd+full_chroma_int'],
          outputOptions: expect.arrayContaining([
            '-fps_mode',
            'vfr',
            '-frames:v',
            '1',
            '-update',
            '1',
            '-v',
            'verbose',
            '-vf',
            String.raw`fps=12:start_time=0:eof_action=pass:round=down,thumbnail=12,select=gt(scene\,0.1)-eq(prev_selected_n\,n)+isnan(prev_selected_n)+gt(n\,20),trim=end_frame=2,reverse,scale=-2:250:flags=lanczos+accurate_rnd+full_chroma_int:out_range=pc,tonemapx=tonemap=hable:desat=0:p=bt709:t=bt709:m=bt709:r=pc:peak=100:format=yuv420p`,
          ]),
          twoPass: false,
        }),
      );
      expect(mocks.asset.upsertFiles).toHaveBeenCalledWith([
        {
          assetId: asset.id,
          type: AssetFileType.Preview,
          path: expect.any(String),
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
        {
          assetId: asset.id,
          type: AssetFileType.Thumbnail,
          path: expect.any(String),
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
      ]);
    });

    it('should always generate video thumbnail in one pass', async () => {
      const asset = AssetFactory.from({ type: AssetType.Video, originalPath: '/original/path.ext' }).exif().build();
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { twoPass: true, maxBitrate: '5000k' },
      });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue({
        ...getForGenerateThumbnail(asset),
        ...probeStub.videoStreamHDR,
      });
      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: ['-skip_frame', 'nointra', '-sws_flags', 'accurate_rnd+full_chroma_int'],
          outputOptions: expect.arrayContaining([
            '-fps_mode',
            'vfr',
            '-frames:v',
            '1',
            '-update',
            '1',
            '-v',
            'verbose',
            '-vf',
            String.raw`fps=12:start_time=0:eof_action=pass:round=down,thumbnail=12,select=gt(scene\,0.1)-eq(prev_selected_n\,n)+isnan(prev_selected_n)+gt(n\,20),trim=end_frame=2,reverse,scale=-2:250:flags=lanczos+accurate_rnd+full_chroma_int:out_range=pc,tonemapx=tonemap=hable:desat=0:p=bt709:t=bt709:m=bt709:r=pc:peak=100:format=yuv420p`,
          ]),
          twoPass: false,
        }),
      );
    });

    it('should not skip intra frames for MTS file', async () => {
      const asset = AssetFactory.from({ type: AssetType.Video, originalPath: '/original/path.ext' }).exif().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue({
        ...getForGenerateThumbnail(asset),
        ...probeStub.videoStreamMTS,
      });
      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: ['-sws_flags', 'accurate_rnd+full_chroma_int'],
          outputOptions: expect.any(Array),
          progress: expect.any(Object),
          twoPass: false,
        }),
      );
    });

    it('should override reserved color metadata', async () => {
      const asset = AssetFactory.from({ type: AssetType.Video, originalPath: '/original/path.ext' }).exif().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue({
        ...getForGenerateThumbnail(asset),
        ...probeStub.videoStreamReserved,
      });
      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-bsf:0',
            'hevc_metadata=colour_primaries=1:matrix_coefficients=1:transfer_characteristics=1',
          ]),
          outputOptions: expect.any(Array),
          progress: expect.any(Object),
          twoPass: false,
        }),
      );
    });

    it('should use scaling divisible by 2 even when using quick sync', async () => {
      const asset = AssetFactory.from({ type: AssetType.Video, originalPath: '/original/path.ext' }).exif().build();
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHardwareAcceleration.Qsv } });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue({
        ...getForGenerateThumbnail(asset),
        ...probeStub.videoStream2160p,
      });
      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([expect.stringContaining('scale=-2:1440')]),
          twoPass: false,
        }),
      );
    });

    it.each(Object.values(ImageFormat))('should generate an image preview in %s format', async (format) => {
      const asset = AssetFactory.from().exif().build();
      mocks.systemMetadata.get.mockResolvedValue({ image: { preview: { format } } });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      const thumbhashBuffer = Buffer.from('a thumbhash', 'utf8');
      mocks.media.generateThumbhash.mockResolvedValue(thumbhashBuffer);
      const previewPath = expect.stringMatching(
        new RegExp(
          `/data/thumbs/${asset.ownerId}/${asset.id.slice(0, 2)}/${asset.id.slice(2, 4)}/${asset.id}_preview-[0-9a-f-]+[.]${format}$`,
        ),
      );
      const thumbnailPath = expect.stringMatching(
        new RegExp(
          `/data/thumbs/${asset.ownerId}/${asset.id.slice(0, 2)}/${asset.id.slice(2, 4)}/${asset.id}_thumbnail-[0-9a-f-]+[.]webp$`,
        ),
      );

      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.any(String));
      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(asset.originalPath, {
        colorspace: Colorspace.Srgb,
        processInvalidImages: false,
        size: 1440,
      });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(2);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        {
          colorspace: Colorspace.Srgb,
          format,
          size: 1440,
          quality: 80,
          progressive: false,
          processInvalidImages: false,
          edits: [],
        },
        previewPath,
      );
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        {
          colorspace: Colorspace.Srgb,
          format: ImageFormat.Webp,
          size: 250,
          quality: 80,
          progressive: false,
          processInvalidImages: false,
          edits: [],
        },
        thumbnailPath,
      );
    });

    it.each(Object.values(ImageFormat))('should generate an image thumbnail in %s format', async (format) => {
      const asset = AssetFactory.from().exif().build();
      mocks.systemMetadata.get.mockResolvedValue({ image: { thumbnail: { format } } });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      const thumbhashBuffer = Buffer.from('a thumbhash', 'utf8');
      mocks.media.generateThumbhash.mockResolvedValue(thumbhashBuffer);
      const previewPath = expect.stringMatching(
        new RegExp(
          `/data/thumbs/${asset.ownerId}/${asset.id.slice(0, 2)}/${asset.id.slice(2, 4)}/${asset.id}_preview-[0-9a-f-]+[.]jpeg$`,
        ),
      );
      const thumbnailPath = expect.stringMatching(
        new RegExp(
          `/data/thumbs/${asset.ownerId}/${asset.id.slice(0, 2)}/${asset.id.slice(2, 4)}/${asset.id}_thumbnail-[0-9a-f-]+[.]${format}$`,
        ),
      );

      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.any(String));
      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(asset.originalPath, {
        colorspace: Colorspace.Srgb,
        processInvalidImages: false,
        size: 1440,
      });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(2);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        {
          colorspace: Colorspace.Srgb,
          format: ImageFormat.Jpeg,
          size: 1440,
          quality: 80,
          progressive: false,
          processInvalidImages: false,
          edits: [],
        },
        previewPath,
      );
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        {
          colorspace: Colorspace.Srgb,
          format,
          size: 250,
          quality: 80,
          progressive: false,
          processInvalidImages: false,
          edits: [],
        },
        thumbnailPath,
      );
    });

    it('should generate progressive JPEG for preview when enabled', async () => {
      const asset = AssetFactory.from().exif().build();
      mocks.systemMetadata.get.mockResolvedValue({
        image: { preview: { progressive: true }, thumbnail: { progressive: false } },
      });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));

      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        expect.objectContaining({
          format: ImageFormat.Jpeg,
          progressive: true,
        }),
        expect.stringMatching(/_preview-[\da-f-]+\.jpeg$/),
      );
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        expect.objectContaining({
          format: ImageFormat.Webp,
          progressive: false,
        }),
        expect.stringMatching(/_thumbnail-[\da-f-]+\.webp$/),
      );
      expect(mocks.asset.publishImageGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          files: [
            expect.objectContaining({
              type: AssetFileType.Preview,
              isProgressive: true,
              isTransparent: false,
            }),
            expect.objectContaining({
              type: AssetFileType.Thumbnail,
              isProgressive: false,
              isTransparent: false,
            }),
          ],
        }),
      );
    });

    it('should generate progressive JPEG for thumbnail when enabled', async () => {
      const asset = AssetFactory.from().exif().build();
      mocks.systemMetadata.get.mockResolvedValue({
        image: { preview: { progressive: false }, thumbnail: { format: ImageFormat.Jpeg, progressive: true } },
      });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));

      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        expect.objectContaining({
          format: ImageFormat.Jpeg,
          progressive: false,
        }),
        expect.stringMatching(/_preview-[\da-f-]+\.jpeg$/),
      );
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        expect.objectContaining({
          format: ImageFormat.Jpeg,
          progressive: true,
        }),
        expect.stringMatching(/_thumbnail-[\da-f-]+\.jpeg$/),
      );
      expect(mocks.asset.publishImageGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          files: [
            expect.objectContaining({
              type: AssetFileType.Preview,
              isProgressive: false,
              isTransparent: false,
            }),
            expect.objectContaining({
              type: AssetFileType.Thumbnail,
              isProgressive: true,
              isTransparent: false,
            }),
          ],
        }),
      );
    });

    it('should never set isProgressive for videos', async () => {
      const asset = AssetFactory.from({ type: AssetType.Video, originalPath: '/original/path.ext' }).exif().build();
      mocks.systemMetadata.get.mockResolvedValue({
        image: { preview: { progressive: true }, thumbnail: { progressive: true } },
      });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue({
        ...getForGenerateThumbnail(asset),
        ...probeStub.videoStreamHDR,
      });

      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.asset.upsertFiles).toHaveBeenCalledWith([
        expect.objectContaining({
          type: AssetFileType.Preview,
          isProgressive: false,
          isTransparent: false,
        }),
        expect.objectContaining({
          type: AssetFileType.Thumbnail,
          isProgressive: false,
          isTransparent: false,
        }),
      ]);
    });

    it('should delete previous thumbnail if different path', async () => {
      const asset = AssetFactory.from().exif().file({ type: AssetFileType.Preview }).build();
      mocks.systemMetadata.get.mockResolvedValue({ image: { thumbnail: { format: ImageFormat.Webp } } });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      mocks.asset.publishImageGeneration.mockResolvedValue(asset.files.map((file) => file.path));

      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FileDelete,
        data: {
          files: expect.arrayContaining([asset.files[0].path]),
        },
      });
    });

    it.each([false, true])('uses native RAW pixels regardless of extractEmbedded being %s', async (extractEmbedded) => {
      const asset = AssetFactory.from({ originalFileName: 'photo.dng' })
        .exif({ exifImageWidth: 6016, exifImageHeight: 4016, profileDescription: 'Adobe RGB', bitsPerSample: 14 })
        .build();
      const native = {
        data: rawBuffer,
        info: { width: 2160, height: 1440, channels: 4 as const },
        nativeDimensions: { width: 6000, height: 4000 },
        colorspace: Colorspace.P3,
        isDeveloped: false,
      };
      mocks.media.developImage.mockResolvedValue(native);
      mocks.systemMetadata.get.mockResolvedValue({ image: { extractEmbedded, fullsize: { enabled: false } } });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));

      await expect(sut.handleGenerateThumbnails({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.media.developImage).toHaveBeenCalledExactlyOnceWith({
        originalPath: asset.originalPath,
        colorspace: Colorspace.P3,
        size: 1440,
      });
      expect(mocks.media.extract).not.toHaveBeenCalled();
      expect(mocks.media.decodeImage).not.toHaveBeenCalled();
      expect(mocks.media.getImageMetadata).not.toHaveBeenCalled();
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: native.data, info: native.info },
        expect.objectContaining({ colorspace: Colorspace.P3, size: 1440 }),
        expect.any(String),
      );
      expect(mocks.asset.publishImageGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          base: { width: 6000, height: 4000, isDeveloped: false },
          dimensions: { width: 6000, height: 4000 },
        }),
      );
    });

    it.each(Object.values(ImageFormat))('converts native RAW fullsize pixels to %s when enabled', async (format) => {
      const asset = AssetFactory.from({ originalFileName: 'photo.dng' }).exif().build();
      const native = {
        data: rawBuffer,
        info: { width: 6000, height: 4000, channels: 4 as const },
        nativeDimensions: { width: 6000, height: 4000 },
        colorspace: Colorspace.P3,
        isDeveloped: false,
      };
      mocks.media.developImage.mockResolvedValue(native);
      mocks.systemMetadata.get.mockResolvedValue({ image: { fullsize: { enabled: true, format } } });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));

      await expect(sut.handleGenerateThumbnails({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.media.developImage).toHaveBeenCalledExactlyOnceWith({
        originalPath: asset.originalPath,
        colorspace: Colorspace.P3,
        size: undefined,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(3);
      const publication = mocks.asset.publishImageGeneration.mock.calls[0][0];
      const fullsize = publication.files.find((file) => file.type === AssetFileType.FullSize)!;
      expect(fullsize).toMatchObject({ isEdited: false, path: expect.stringMatching(new RegExp(`[.]${format}$`)) });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: native.data, info: native.info },
        expect.objectContaining({ format, colorspace: Colorspace.P3, edits: [] }),
        fullsize.path,
      );
      expect(mocks.media.extract).not.toHaveBeenCalled();
      expect(mocks.storage.createOrOverwriteFile).not.toHaveBeenCalled();
      expect(mocks.media.writeExif).not.toHaveBeenCalled();
    });

    it('should generate full-size preview from non-web-friendly images', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { fullsize: { enabled: true } } });
      mocks.media.extract.mockResolvedValue({ buffer: extractedBuffer, format: RawExtractedFormat.Jpeg });
      mocks.media.getImageMetadata.mockResolvedValue({ width: 3840, height: 2160, isTransparent: false });
      // HEIF/HIF image taken by cameras are not web-friendly, only has limited support on Safari.
      const asset = AssetFactory.from({ originalFileName: 'image.hif' })
        .exif({
          fileSizeInByte: 5000,
          profileDescription: 'Adobe RGB',
          bitsPerSample: 14,
        })
        .build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));

      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(asset.originalPath, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
      });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(3);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.Jpeg,
          quality: 80,
          progressive: false,
          processInvalidImages: false,
          edits: [],
        },
        expect.any(String),
      );
    });

    it('should skip generating full-size preview for web-friendly images', async () => {
      const asset = AssetFactory.from().exif().build();
      mocks.systemMetadata.get.mockResolvedValue({ image: { fullsize: { enabled: true } } });
      mocks.media.extract.mockResolvedValue({ buffer: extractedBuffer, format: RawExtractedFormat.Jpeg });
      mocks.media.getImageMetadata.mockResolvedValue({ width: 3840, height: 2160, isTransparent: false });
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));

      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(asset.originalPath, {
        colorspace: Colorspace.Srgb,
        processInvalidImages: false,
        size: 1440,
      });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(2);
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.stringMatching(/_fullsize-[\da-f-]+\.jpeg$/),
      );
    });

    it('should always generate full-size preview from non-web-friendly panoramas', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ image: { fullsize: { enabled: false } } });
      mocks.media.extract.mockResolvedValue({ buffer: extractedBuffer, format: RawExtractedFormat.Jpeg });
      mocks.media.getImageMetadata.mockResolvedValue({ width: 3840, height: 2160, isTransparent: false });
      mocks.media.copyTagGroup.mockResolvedValue(true);

      const asset = AssetFactory.from({ originalFileName: 'panorama.tif' })
        .exif({
          fileSizeInByte: 5000,
          projectionType: 'EQUIRECTANGULAR',
        })
        .build();

      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));

      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(asset.originalPath, {
        colorspace: Colorspace.Srgb,
        orientation: undefined,
        processInvalidImages: false,
        size: undefined,
      });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(3);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        {
          colorspace: Colorspace.Srgb,
          format: ImageFormat.Jpeg,
          quality: 80,
          progressive: false,
          processInvalidImages: false,
          edits: [],
        },
        expect.any(String),
      );

      expect(mocks.media.copyTagGroup).toHaveBeenCalledTimes(2);
      expect(mocks.media.copyTagGroup).toHaveBeenCalledWith('XMP-GPano', asset.originalPath, expect.any(String));
    });

    it('should respect encoding options when generating full-size preview', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        image: { fullsize: { enabled: true, format: ImageFormat.Webp, quality: 90 } },
      });
      mocks.media.extract.mockResolvedValue({ buffer: extractedBuffer, format: RawExtractedFormat.Jpeg });
      mocks.media.getImageMetadata.mockResolvedValue({ width: 3840, height: 2160, isTransparent: false });
      // HEIF/HIF image taken by cameras are not web-friendly, only has limited support on Safari.
      const asset = AssetFactory.from({ originalFileName: 'image.hif' })
        .exif({
          fileSizeInByte: 5000,
          profileDescription: 'Adobe RGB',
          bitsPerSample: 14,
        })
        .build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));

      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.media.decodeImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(asset.originalPath, {
        colorspace: Colorspace.P3,
        processInvalidImages: false,
      });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(3);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.Webp,
          quality: 90,
          progressive: false,
          processInvalidImages: false,
          edits: [],
        },
        expect.any(String),
      );
    });

    it('should generate progressive JPEG for fullsize when enabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        image: { fullsize: { enabled: true, format: ImageFormat.Jpeg, progressive: true } },
      });
      mocks.media.extract.mockResolvedValue({ buffer: extractedBuffer, format: RawExtractedFormat.Jpeg });
      mocks.media.getImageMetadata.mockResolvedValue({ width: 3840, height: 2160, isTransparent: false });
      const asset = AssetFactory.from({ originalFileName: 'image.hif' })
        .exif({
          fileSizeInByte: 5000,
          profileDescription: 'Adobe RGB',
          bitsPerSample: 14,
        })
        .build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));

      await sut.handleGenerateThumbnails({ id: asset.id });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(3);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        expect.objectContaining({
          format: ImageFormat.Jpeg,
          progressive: true,
        }),
        expect.stringMatching(/_fullsize-[\da-f-]+\.jpeg$/),
      );
    });
  });

  describe('Lightroom sidecar previews', () => {
    const developed = {
      data: Buffer.from('developed pixels'),
      info: { width: 600, height: 400, channels: 4 as const },
      colorspace: Colorspace.Srgb,
      nativeDimensions: { width: 3000, height: 2000 },
      isDeveloped: true,
    };

    beforeEach(() => {
      mocks.person.getFaces.mockResolvedValue([]);
      mocks.ocr.getByAssetId.mockResolvedValue([]);
      mocks.media.developImage.mockResolvedValue(developed);
      mocks.media.decodeImage.mockResolvedValue({
        data: rawBuffer,
        info: { width: 6000, height: 4000, channels: 3 } as OutputInfo,
      });
      mocks.systemMetadata.get.mockResolvedValue({
        image: { extractEmbedded: true, colorspace: Colorspace.Srgb, fullsize: { enabled: false } },
      });
    });

    it.each([
      { extension: 'dng', isDeveloped: false },
      { extension: 'dng', isDeveloped: true },
      { extension: 'nef', isDeveloped: false },
      { extension: 'arw', isDeveloped: true },
      { extension: 'cr3', isDeveloped: false },
    ])(
      'renders ordinary $extension RAW through the native helper (embedded edits: $isDeveloped)',
      async ({ extension, isDeveloped }) => {
        const asset = AssetFactory.from({
          originalFileName: `photo.${extension}`,
          originalPath: `/photos/photo.${extension}`,
        })
          .exif({
            exifImageWidth: 6016,
            exifImageHeight: 4016,
            orientation: String(ExifOrientation.Rotate90CW),
            profileDescription: 'Adobe RGB',
          })
          .build();
        const rendered = {
          ...developed,
          info: { width: 1440, height: 2160, channels: 4 as const },
          nativeDimensions: { width: 4000, height: 6000 },
          isDeveloped,
        };
        mocks.media.developImage.mockResolvedValue(rendered);
        mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));

        await expect(sut.handleGenerateThumbnails({ id: asset.id })).resolves.toBe(JobStatus.Success);

        expect(mocks.media.developImage).toHaveBeenCalledExactlyOnceWith({
          originalPath: asset.originalPath,
          colorspace: Colorspace.Srgb,
          size: 1440,
        });
        expect(mocks.media.extract).not.toHaveBeenCalled();
        expect(mocks.media.decodeImage).not.toHaveBeenCalled();
        expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(2);
        for (const [bitmap, options] of mocks.media.generateThumbnail.mock.calls) {
          expect(bitmap).toEqual({ data: rendered.data, info: rendered.info });
          expect(options).toMatchObject({ colorspace: Colorspace.Srgb, edits: [] });
        }
        expect(mocks.asset.publishImageGeneration).toHaveBeenCalledExactlyOnceWith(
          expect.objectContaining({
            fingerprint: 'development-input',
            sidecarPath: null,
            base: { width: 4000, height: 6000, isDeveloped },
            dimensions: { width: 4000, height: 6000 },
          }),
        );
      },
    );

    it.each([false, true])('shares one native RAW render with Immich edits (base fullsize: %s)', async (enabled) => {
      const asset = AssetFactory.from({ originalFileName: 'photo.dng', originalPath: '/photos/photo.dng' })
        .exif({ exifImageWidth: 6016, exifImageHeight: 4016 })
        .edit({ action: AssetEditAction.Crop, parameters: { x: 100, y: 200, width: 2000, height: 1000 } })
        .build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      mocks.systemMetadata.get.mockResolvedValue({ image: { colorspace: Colorspace.Srgb, fullsize: { enabled } } });
      const native = { ...developed, info: { width: 3000, height: 2000, channels: 4 as const }, isDeveloped: false };
      mocks.media.developImage.mockResolvedValue(native);

      await expect(sut.handleAssetEditThumbnailGeneration({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.media.developImage).toHaveBeenCalledExactlyOnceWith({
        originalPath: asset.originalPath,
        colorspace: Colorspace.Srgb,
        size: undefined,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(enabled ? 6 : 5);
      const publication = mocks.asset.publishImageGeneration.mock.calls[0][0];
      expect(publication).toMatchObject({
        base: { width: 3000, height: 2000, isDeveloped: false },
        dimensions: { width: 2000, height: 1000 },
      });
      const keys = publication.files.map((file) => `${file.type}/${file.isEdited ?? false}`);
      expect(new Set(keys).size).toBe(keys.length);
      const fullsize = publication.files.find((file) => file.type === AssetFileType.FullSize && file.isEdited)!;
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: native.data, info: native.info },
        expect.objectContaining({ edits: asset.edits.map(({ action, parameters }) => ({ action, parameters })) }),
        fullsize.path,
      );
      expect(publication.files.some((file) => file.type === AssetFileType.FullSize && !file.isEdited)).toBe(enabled);
    });

    it('preserves the ordinary RAW cache when native rendering fails instead of using a small TIFF preview', async () => {
      const asset = AssetFactory.from({ originalFileName: 'photo.dng', originalPath: '/photos/photo.dng' })
        .exif()
        .file({ type: AssetFileType.Preview, path: '/cache/last-valid-preview.jpeg' })
        .build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      mocks.media.developImage.mockRejectedValue(new Error('Native RAW decode failed'));

      await expect(sut.handleGenerateThumbnails({ id: asset.id })).rejects.toThrow('Native RAW decode failed');

      expect(mocks.media.extract).not.toHaveBeenCalled();
      expect(mocks.media.decodeImage).not.toHaveBeenCalled();
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
      expect(mocks.asset.publishImageGeneration).not.toHaveBeenCalled();
      expect(mocks.asset.deleteFiles).not.toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('discards staged RAW output if embedded metadata changes while rendering', async () => {
      const asset = AssetFactory.from({ originalFileName: 'photo.dng', originalPath: '/photos/photo.dng' })
        .exif()
        .build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      mocks.media.getDevelopmentInputFingerprint.mockResolvedValueOnce('old').mockResolvedValueOnce('new');

      await expect(sut.handleGenerateThumbnails({ id: asset.id })).resolves.toBe(JobStatus.Skipped);

      expect(mocks.asset.publishImageGeneration).not.toHaveBeenCalled();
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SidecarCheck,
        data: { id: asset.id, source: 'sidecar' },
      });
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FileDelete,
        data: { files: expect.arrayContaining(mocks.media.generateThumbnail.mock.calls.map((call) => call[2])) },
      });
      const deletion = mocks.job.queue.mock.calls.map(([job]) => job).find((job) => job.name === JobName.FileDelete);
      expect(deletion?.data.files).toHaveLength(2);
    });

    it('renders the sidecar before RAW extraction and shares its bitmap across the existing preview caches', async () => {
      const asset = makeSidecarAsset().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));

      await expect(sut.handleGenerateThumbnails({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.media.developImage).toHaveBeenCalledExactlyOnceWith({
        originalPath: asset.originalPath,
        sidecarPath: '/library/image.nef.xmp',
        colorspace: Colorspace.Srgb,
        size: 1440,
      });
      expect(mocks.media.extract).not.toHaveBeenCalled();
      expect(mocks.media.decodeImage).not.toHaveBeenCalled();
      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(2);
      const bitmap = mocks.media.generateThumbnail.mock.calls[0][0];
      expect(bitmap).toEqual({ data: developed.data, info: developed.info });
      expect(mocks.media.generateThumbnail.mock.calls[1][0]).toBe(bitmap);
      expect(mocks.media.generateThumbhash.mock.calls[0][0]).toBe(bitmap);
      expect(mocks.asset.publishImageGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          base: { width: 3000, height: 2000, isDeveloped: true },
          dimensions: { width: 3000, height: 2000 },
          files: [
            expect.objectContaining({ type: AssetFileType.Preview, isEdited: false }),
            expect.objectContaining({ type: AssetFileType.Thumbnail, isEdited: false }),
          ],
          visibility: { faces: { visible: [], hidden: [] }, ocr: { visible: [], hidden: [] } },
        }),
      );
      expect(mocks.person.updateVisibility).not.toHaveBeenCalled();
      expect(mocks.ocr.updateOcrVisibilities).not.toHaveBeenCalled();
      expect(mocks.asset.upsertFile).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('uses one native render for the developed base and Immich crop variants', async () => {
      const asset = makeSidecarAsset()
        .edit({ action: AssetEditAction.Crop, parameters: { x: 100, y: 200, width: 2000, height: 1000 } })
        .build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      mocks.systemMetadata.get.mockResolvedValue({ image: { fullsize: { enabled: true } } });

      await expect(sut.handleAssetEditThumbnailGeneration({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.media.developImage).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ size: undefined }));
      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(6);
      for (const [bitmap] of mocks.media.generateThumbnail.mock.calls) {
        expect(bitmap.data).toBe(developed.data);
        expect(bitmap.info).toBe(developed.info);
      }
      expect(mocks.asset.publishImageGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          base: { width: 3000, height: 2000, isDeveloped: true },
          dimensions: { width: 2000, height: 1000 },
          files: expect.arrayContaining([
            expect.objectContaining({ type: AssetFileType.FullSize, isEdited: false }),
            expect.objectContaining({ type: AssetFileType.FullSize, isEdited: true }),
          ]),
        }),
      );
    });

    it('rejects an existing Immich crop outside the newly developed base', async () => {
      const asset = makeSidecarAsset()
        .edit({ action: AssetEditAction.Crop, parameters: { x: 2900, y: 0, width: 200, height: 100 } })
        .build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));

      await expect(sut.handleGenerateThumbnails({ id: asset.id })).rejects.toThrow(
        'Existing Immich crop is outside the developed image',
      );

      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
      expect(mocks.asset.publishImageGeneration).not.toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it.each(['jpg', 'png'])('falls back to the original %s for a metadata-only sidecar', async (extension) => {
      const asset = AssetFactory.from({
        originalFileName: `image.${extension}`,
        originalPath: `/photos/image.${extension}`,
      })
        .exif({ exifImageWidth: 6000, exifImageHeight: 4000 })
        .file({ type: AssetFileType.Sidecar, path: `/library/image.${extension}.xmp` })
        .build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      mocks.media.developImage.mockResolvedValue(null);
      mocks.media.getImageMetadata.mockResolvedValue({ width: 6000, height: 4000, isTransparent: false });

      await expect(sut.handleGenerateThumbnails({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.media.developImage).toHaveBeenCalledOnce();
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(asset.originalPath, expect.any(Object));
      expect(mocks.asset.publishImageGeneration).toHaveBeenCalledWith(
        expect.objectContaining({ base: { width: 6000, height: 4000, isDeveloped: false } }),
      );
    });

    it.each([false, true])(
      'renders RAW natively when external sidecar edits are skipped (embedded edits: %s)',
      async (isDeveloped) => {
        const asset = makeSidecarAsset().build();
        mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
        mocks.media.developImage.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...developed, isDeveloped });

        await expect(sut.handleGenerateThumbnails({ id: asset.id })).resolves.toBe(JobStatus.Success);

        expect(mocks.media.developImage).toHaveBeenCalledTimes(2);
        expect(mocks.media.developImage).toHaveBeenNthCalledWith(1, {
          originalPath: asset.originalPath,
          sidecarPath: '/library/image.nef.xmp',
          colorspace: Colorspace.Srgb,
          size: 1440,
        });
        expect(mocks.media.developImage).toHaveBeenNthCalledWith(2, {
          originalPath: asset.originalPath,
          colorspace: Colorspace.Srgb,
          size: 1440,
        });
        expect(mocks.media.extract).not.toHaveBeenCalled();
        expect(mocks.media.decodeImage).not.toHaveBeenCalled();
        expect(mocks.asset.publishImageGeneration).toHaveBeenCalledWith(
          expect.objectContaining({
            fingerprint: 'development-input',
            sidecarPath: '/library/image.nef.xmp',
            base: { width: 3000, height: 2000, isDeveloped },
          }),
        );
      },
    );

    it.each([false, true])(
      'preserves RAW caches if the native request returns no bitmap (external sidecar: %s)',
      async (hasSidecar) => {
        const asset = makeSidecarAsset().build();
        mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue({
          ...getForGenerateThumbnail(asset),
          sidecarPath: hasSidecar ? '/library/image.nef.xmp' : null,
        });
        mocks.media.developImage.mockResolvedValue(null);

        await expect(sut.handleGenerateThumbnails({ id: asset.id })).rejects.toThrow(
          'Native RAW renderer did not return a bitmap',
        );

        expect(mocks.media.developImage).toHaveBeenCalledTimes(hasSidecar ? 2 : 1);
        expect(mocks.media.extract).not.toHaveBeenCalled();
        expect(mocks.media.decodeImage).not.toHaveBeenCalled();
        expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
        expect(mocks.asset.publishImageGeneration).not.toHaveBeenCalled();
        expect(mocks.asset.deleteFiles).not.toHaveBeenCalled();
        expect(mocks.job.queue).not.toHaveBeenCalled();
      },
    );

    it('preserves RAW caches if native rendering fails after skipping an external packet', async () => {
      const asset = makeSidecarAsset().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      mocks.media.developImage.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('Native decode failed'));

      await expect(sut.handleGenerateThumbnails({ id: asset.id })).rejects.toThrow('Native decode failed');

      expect(mocks.media.developImage).toHaveBeenCalledTimes(2);
      expect(mocks.media.extract).not.toHaveBeenCalled();
      expect(mocks.asset.publishImageGeneration).not.toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('replaces external-sidecar previews with the native RAW base when the sidecar has been removed', async () => {
      const asset = makeSidecarAsset().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue({
        ...getForGenerateThumbnail(asset),
        sidecarPath: null,
        development: {
          observedInputFingerprint: 'previous',
          publishedInputFingerprint: 'previous',
          publishedBase: { width: 3000, height: 2000, isDeveloped: true },
        },
      });
      mocks.asset.publishImageGeneration.mockResolvedValue(['/cache/published-preview.jpeg']);
      mocks.media.developImage.mockResolvedValue({
        ...developed,
        nativeDimensions: { width: 6000, height: 4000 },
        isDeveloped: false,
      });

      await expect(sut.handleGenerateThumbnails({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.media.developImage).toHaveBeenCalledExactlyOnceWith({
        originalPath: asset.originalPath,
        colorspace: Colorspace.Srgb,
        size: 1440,
      });
      expect(mocks.media.decodeImage).not.toHaveBeenCalled();
      expect(mocks.asset.publishImageGeneration).toHaveBeenCalledWith(
        expect.objectContaining({ base: { width: 6000, height: 4000, isDeveloped: false } }),
      );
      expect(mocks.job.queue).toHaveBeenCalledExactlyOnceWith({
        name: JobName.FileDelete,
        data: { files: ['/cache/published-preview.jpeg'] },
      });
    });

    it('preserves published previews when the rendering helper fails', async () => {
      const asset = makeSidecarAsset().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      mocks.media.developImage.mockRejectedValue(new Error('unsupported develop operation'));

      await expect(sut.handleGenerateThumbnails({ id: asset.id })).rejects.toThrow('unsupported develop operation');

      expect(mocks.media.developImage).toHaveBeenCalledOnce();
      expect(mocks.media.extract).not.toHaveBeenCalled();
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
      expect(mocks.asset.publishImageGeneration).not.toHaveBeenCalled();
      expect(mocks.asset.deleteFiles).not.toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('waits for all encoders before cleaning only staged files after an encoding failure', async () => {
      const asset = makeSidecarAsset().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      let finishPreview!: () => void;
      const preview = new Promise<void>((resolve) => (finishPreview = resolve));
      mocks.media.generateThumbnail.mockRejectedValueOnce(new Error('encoder failed')).mockReturnValueOnce(preview);
      const result = sut.handleGenerateThumbnails({ id: asset.id });
      const rejection = expect(result).rejects.toThrow('encoder failed');

      await vi.waitFor(() => expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(2));
      expect(mocks.job.queue).not.toHaveBeenCalled();
      finishPreview();
      await rejection;

      expect(mocks.asset.publishImageGeneration).not.toHaveBeenCalled();
      expect(mocks.asset.deleteFiles).not.toHaveBeenCalled();
      expect(mocks.job.queue).toHaveBeenCalledExactlyOnceWith({
        name: JobName.FileDelete,
        data: {
          files: [mocks.media.generateThumbnail.mock.calls[1][2], mocks.media.generateThumbnail.mock.calls[0][2]],
        },
      });
    });

    it('discards stale files and schedules another sidecar check if the source changes during rendering', async () => {
      const asset = makeSidecarAsset().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      mocks.media.getDevelopmentInputFingerprint.mockResolvedValueOnce('old').mockResolvedValueOnce('new');

      await expect(sut.handleGenerateThumbnails({ id: asset.id })).resolves.toBe(JobStatus.Skipped);

      expect(mocks.asset.publishImageGeneration).not.toHaveBeenCalled();
      expect(mocks.websocket.clientSend).not.toHaveBeenCalled();
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SidecarCheck,
        data: { id: asset.id, source: 'sidecar' },
      });
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FileDelete,
        data: { files: expect.arrayContaining(mocks.media.generateThumbnail.mock.calls.map((call) => call[2])) },
      });
    });

    it('retries without announcing a generation rejected by the publication transaction', async () => {
      const asset = makeSidecarAsset().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      mocks.asset.publishImageGeneration.mockResolvedValue(null);

      await expect(sut.handleGenerateThumbnails({ id: asset.id })).resolves.toBe(JobStatus.Skipped);

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.AssetGenerateThumbnails,
        data: { id: asset.id, source: 'sidecar' },
      });
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FileDelete,
        data: { files: expect.arrayContaining(mocks.media.generateThumbnail.mock.calls.map((call) => call[2])) },
      });
      expect(mocks.person.updateVisibility).not.toHaveBeenCalled();
      expect(mocks.ocr.updateOcrVisibilities).not.toHaveBeenCalled();
      expect(mocks.asset.getById).not.toHaveBeenCalled();
      expect(mocks.websocket.clientSend).not.toHaveBeenCalled();
    });

    it('announces the accepted revision and cleans only the previous cache generation', async () => {
      const asset = makeSidecarAsset().build();
      const updated = { ...asset, updateId: newUuid(), isDeveloped: true, width: 3000, height: 2000 };
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      mocks.asset.publishImageGeneration.mockResolvedValue(['/cache/published-preview.jpeg']);
      mocks.asset.getById.mockResolvedValue({ ...getForAsset(updated), isDeveloped: true });

      await expect(sut.handleGenerateThumbnails({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.asset.observeImageDevelopmentInput).toHaveBeenCalledExactlyOnceWith(asset.id, 'development-input');
      expect(mocks.websocket.clientSend).toHaveBeenCalledExactlyOnceWith(
        'on_asset_update',
        asset.ownerId,
        expect.objectContaining({ id: asset.id, mediaRevision: updated.updateId, isDeveloped: true }),
      );
      expect(mocks.job.queue).toHaveBeenCalledExactlyOnceWith({
        name: JobName.FileDelete,
        data: { files: ['/cache/published-preview.jpeg'] },
      });
    });
  });

  describe('handleAssetEditThumbnailGeneration', () => {
    let rawInfo: RawImageInfo;

    beforeEach(() => {
      rawInfo = { width: 100, height: 100, channels: 3 };
      mocks.person.getFaces.mockResolvedValue([]);
      mocks.ocr.getByAssetId.mockResolvedValue([]);
      mocks.media.decodeImage.mockImplementation((input) =>
        Promise.resolve(
          typeof input === 'string'
            ? { data: rawBuffer, info: rawInfo as OutputInfo } // string implies original file
            : { data: fullsizeBuffer, info: rawInfo as OutputInfo }, // buffer implies embedded image extracted
        ),
      );
      mocks.media.getImageMetadata.mockResolvedValue({ width: 100, height: 100, isTransparent: false });
    });

    it('should skip videos', async () => {
      const asset = AssetFactory.from({ type: AssetType.Video }).exif().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));

      await expect(sut.handleAssetEditThumbnailGeneration({ id: asset.id })).resolves.toBe(JobStatus.Success);
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should upsert 3 edited files for edit jobs', async () => {
      const asset = AssetFactory.from()
        .exif()
        .edit({ action: AssetEditAction.Crop })
        .files([
          { type: AssetFileType.FullSize, isEdited: true },
          { type: AssetFileType.Preview, isEdited: true },
          { type: AssetFileType.Thumbnail, isEdited: true },
        ])
        .build();

      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      const thumbhashBuffer = Buffer.from('a thumbhash', 'utf8');
      mocks.media.generateThumbhash.mockResolvedValue(thumbhashBuffer);
      mocks.person.getFaces.mockResolvedValue([]);
      mocks.ocr.getByAssetId.mockResolvedValue([]);

      await sut.handleAssetEditThumbnailGeneration({ id: asset.id });

      expect(mocks.asset.publishImageGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          files: expect.arrayContaining([
            expect.objectContaining({ type: AssetFileType.FullSize, isEdited: true }),
            expect.objectContaining({ type: AssetFileType.Preview, isEdited: true }),
            expect.objectContaining({ type: AssetFileType.Thumbnail, isEdited: true }),
          ]),
        }),
      );
    });

    it('should apply edits when generating thumbnails', async () => {
      const asset = AssetFactory.from()
        .exif()
        .edit({ action: AssetEditAction.Crop, parameters: { height: 1152, width: 1512, x: 216, y: 1512 } })
        .build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      mocks.person.getFaces.mockResolvedValue([]);
      mocks.ocr.getByAssetId.mockResolvedValue([]);

      await sut.handleAssetEditThumbnailGeneration({ id: asset.id });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        expect.objectContaining({
          edits: [
            expect.objectContaining({
              action: 'crop',
              parameters: { height: 1152, width: 1512, x: 216, y: 1512 },
            }),
          ],
        }),
        expect.any(String),
      );
    });

    it('should clean up edited files if an asset has no edits', async () => {
      const asset = AssetFactory.from({ thumbhash: factory.buffer() })
        .exif()
        .files([
          { type: AssetFileType.Preview, path: 'edited1.jpg', isEdited: true },
          { type: AssetFileType.Thumbnail, path: 'edited2.jpg', isEdited: true },
          { type: AssetFileType.FullSize, path: 'edited3.jpg', isEdited: true },
        ])
        .build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      mocks.asset.publishImageGeneration.mockResolvedValue(asset.files.map((file) => file.path));

      const status = await sut.handleAssetEditThumbnailGeneration({ id: asset.id });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FileDelete,
        data: {
          files: expect.arrayContaining(['edited1.jpg', 'edited2.jpg', 'edited3.jpg']),
        },
      });

      expect(status).toBe(JobStatus.Success);
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
      expect(mocks.asset.upsertFiles).not.toHaveBeenCalled();
    });

    it('should generate all 3 edited files if an asset has edits', async () => {
      const asset = AssetFactory.from().exif().edit().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      mocks.person.getFaces.mockResolvedValue([]);
      mocks.ocr.getByAssetId.mockResolvedValue([]);

      await sut.handleAssetEditThumbnailGeneration({ id: asset.id });

      expect(mocks.media.generateThumbnail).toHaveBeenCalledTimes(3);
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        expect.anything(),
        expect.stringMatching(/_preview_edited-[\da-f-]+\.jpeg$/),
      );
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        expect.anything(),
        expect.stringMatching(/_thumbnail_edited-[\da-f-]+\.webp$/),
      );
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data: rawBuffer, info: rawInfo },
        expect.anything(),
        expect.stringMatching(/_fullsize_edited-[\da-f-]+\.jpeg$/),
      );
    });

    it('should generate the original thumbhash if no edits exist', async () => {
      const asset = AssetFactory.from().exif().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      mocks.media.generateThumbhash.mockResolvedValue(factory.buffer());

      await sut.handleAssetEditThumbnailGeneration({ id: asset.id, source: 'upload' });

      expect(mocks.media.generateThumbhash).toHaveBeenCalled();
    });

    it('should apply thumbhash if job source is edit and edits exist', async () => {
      const asset = AssetFactory.from().exif().edit().build();
      mocks.assetJob.getForGenerateThumbnailJob.mockResolvedValue(getForGenerateThumbnail(asset));
      const thumbhashBuffer = factory.buffer();
      mocks.media.generateThumbhash.mockResolvedValue(thumbhashBuffer);
      mocks.person.getFaces.mockResolvedValue([]);
      mocks.ocr.getByAssetId.mockResolvedValue([]);

      await sut.handleAssetEditThumbnailGeneration({ id: asset.id });

      expect(mocks.asset.publishImageGeneration).toHaveBeenCalledWith(
        expect.objectContaining({ thumbhash: thumbhashBuffer }),
      );
    });
  });

  describe('handleGeneratePersonThumbnail', () => {
    it('should generate a thumbnail even if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);
      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.newThumbnailMiddle);
      mocks.media.generateThumbnail.mockResolvedValue();
      mocks.media.decodeImage.mockResolvedValue({
        data: Buffer.from(''),
        info: { width: 1000, height: 1000 } as OutputInfo,
      });

      await expect(
        sut.handleGeneratePersonThumbnail({ ownerId: 'owner-1', personGroupId: 'person-group-1' }),
      ).resolves.toBe(JobStatus.Success);
      expect(mocks.media.generateThumbnail).toHaveBeenCalled();
    });

    it('should skip a person not found', async () => {
      await sut.handleGeneratePersonThumbnail({ ownerId: 'owner-1', personGroupId: 'person-group-1' });
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should skip a person without a face asset id', async () => {
      const person = PersonFactory.create({ faceAssetId: null });
      await sut.handleGeneratePersonThumbnail({ ownerId: person.ownerId, personGroupId: person.personGroupId });
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should skip a person with face not found', async () => {
      await sut.handleGeneratePersonThumbnail({ ownerId: 'owner-1', personGroupId: 'person-group-1' });
      expect(mocks.media.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should generate a thumbnail', async () => {
      const person = PersonFactory.create();

      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.newThumbnailMiddle);
      mocks.media.generateThumbnail.mockResolvedValue();
      const data = Buffer.from('');
      const info = { width: 1000, height: 1000 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });

      await expect(
        sut.handleGeneratePersonThumbnail({ ownerId: person.ownerId, personGroupId: person.personGroupId }),
      ).resolves.toBe(JobStatus.Success);

      expect(mocks.person.getDataForThumbnailGenerationJob).toHaveBeenCalledWith({
        ownerId: person.ownerId,
        personGroupId: person.personGroupId,
      });
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.any(String));
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(personThumbnailStub.newThumbnailMiddle.originalPath, {
        colorspace: Colorspace.P3,
        orientation: undefined,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data, info },
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.Jpeg,
          quality: 80,
          progressive: false,
          edits: [
            {
              action: 'crop',
              parameters: {
                height: 274,
                width: 274,
                x: 238,
                y: 163,
              },
            },
          ],
          processInvalidImages: false,
          size: 250,
        },
        expect.any(String),
      );
      expect(mocks.person.update).toHaveBeenCalledWith({
        ownerId: person.ownerId,
        personGroupId: person.personGroupId,
        thumbnailPath: expect.any(String),
      });
    });

    it('should use preview path if video', async () => {
      const person = PersonFactory.create();

      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.videoThumbnail);
      mocks.media.generateThumbnail.mockResolvedValue();
      const data = Buffer.from('');
      const info = { width: 1000, height: 1000 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });

      await expect(
        sut.handleGeneratePersonThumbnail({ ownerId: person.ownerId, personGroupId: person.personGroupId }),
      ).resolves.toBe(JobStatus.Success);

      expect(mocks.person.getDataForThumbnailGenerationJob).toHaveBeenCalledWith({
        ownerId: person.ownerId,
        personGroupId: person.personGroupId,
      });
      expect(mocks.storage.mkdirSync).toHaveBeenCalledWith(expect.any(String));
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(expect.any(String), {
        colorspace: Colorspace.P3,
        orientation: undefined,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data, info },
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.Jpeg,
          quality: 80,
          progressive: false,
          edits: [
            {
              action: 'crop',
              parameters: {
                height: 274,
                width: 274,
                x: 238,
                y: 163,
              },
            },
          ],
          processInvalidImages: false,
          size: 250,
        },
        expect.any(String),
      );
      expect(mocks.person.update).toHaveBeenCalledWith({
        ownerId: person.ownerId,
        personGroupId: person.personGroupId,
        thumbnailPath: expect.any(String),
      });
    });

    it('should generate a thumbnail without going negative', async () => {
      const person = PersonFactory.create();

      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.newThumbnailStart);
      mocks.media.generateThumbnail.mockResolvedValue();
      const data = Buffer.from('');
      const info = { width: 2160, height: 3840 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });

      await expect(
        sut.handleGeneratePersonThumbnail({ ownerId: person.ownerId, personGroupId: person.personGroupId }),
      ).resolves.toBe(JobStatus.Success);

      expect(mocks.media.decodeImage).toHaveBeenCalledWith(personThumbnailStub.newThumbnailStart.originalPath, {
        colorspace: Colorspace.P3,
        orientation: undefined,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data, info },
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.Jpeg,
          quality: 80,
          progressive: false,
          edits: [
            {
              action: 'crop',
              parameters: {
                height: 510,
                width: 510,
                x: 0,
                y: 85,
              },
            },
          ],
          processInvalidImages: false,
          size: 250,
        },
        expect.any(String),
      );
    });

    it('should generate a thumbnail without overflowing', async () => {
      const person = PersonFactory.create();

      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.newThumbnailEnd);
      mocks.person.update.mockResolvedValue(person);
      mocks.media.generateThumbnail.mockResolvedValue();
      const data = Buffer.from('');
      const info = { width: 1000, height: 1000 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });

      await expect(
        sut.handleGeneratePersonThumbnail({ ownerId: person.ownerId, personGroupId: person.personGroupId }),
      ).resolves.toBe(JobStatus.Success);

      expect(mocks.media.decodeImage).toHaveBeenCalledWith(personThumbnailStub.newThumbnailEnd.originalPath, {
        colorspace: Colorspace.P3,
        orientation: undefined,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data, info },
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.Jpeg,
          quality: 80,
          progressive: false,
          edits: [
            {
              action: 'crop',
              parameters: {
                height: 408,
                width: 408,
                x: 591,
                y: 591,
              },
            },
          ],
          processInvalidImages: false,
          size: 250,
        },
        expect.any(String),
      );
    });

    it('should handle negative coordinates', async () => {
      const person = PersonFactory.create();

      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.negativeCoordinate);
      mocks.person.update.mockResolvedValue(person);
      mocks.media.generateThumbnail.mockResolvedValue();
      const data = Buffer.from('');
      const info = { width: 4624, height: 3080 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });

      await expect(
        sut.handleGeneratePersonThumbnail({ ownerId: person.ownerId, personGroupId: person.personGroupId }),
      ).resolves.toBe(JobStatus.Success);

      expect(mocks.media.decodeImage).toHaveBeenCalledWith(personThumbnailStub.negativeCoordinate.originalPath, {
        colorspace: Colorspace.P3,
        orientation: undefined,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data, info },
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.Jpeg,
          quality: 80,
          progressive: false,
          edits: [
            {
              action: 'crop',
              parameters: {
                height: 412,
                width: 412,
                x: 0,
                y: 62,
              },
            },
          ],
          processInvalidImages: false,
          size: 250,
        },
        expect.any(String),
      );
    });

    it('should handle overflowing coordinate', async () => {
      const person = PersonFactory.create();

      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.overflowingCoordinate);
      mocks.person.update.mockResolvedValue(person);
      mocks.media.generateThumbnail.mockResolvedValue();
      const data = Buffer.from('');
      const info = { width: 4624, height: 3080 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });

      await expect(
        sut.handleGeneratePersonThumbnail({ ownerId: person.ownerId, personGroupId: person.personGroupId }),
      ).resolves.toBe(JobStatus.Success);

      expect(mocks.media.decodeImage).toHaveBeenCalledWith(personThumbnailStub.overflowingCoordinate.originalPath, {
        colorspace: Colorspace.P3,
        orientation: undefined,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data, info },
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.Jpeg,
          quality: 80,
          progressive: false,
          edits: [
            {
              action: 'crop',
              parameters: {
                height: 138,
                width: 138,
                x: 4485,
                y: 94,
              },
            },
          ],
          processInvalidImages: false,
          size: 250,
        },
        expect.any(String),
      );
    });

    it('should use embedded preview if enabled and raw image', async () => {
      const person = PersonFactory.create();

      mocks.systemMetadata.get.mockResolvedValue({ image: { extractEmbedded: true } });
      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.rawEmbeddedThumbnail);
      mocks.person.update.mockResolvedValue(person);
      mocks.media.generateThumbnail.mockResolvedValue();
      const extracted = Buffer.from('');
      const data = Buffer.from('');
      const info = { width: 2160, height: 3840 } as OutputInfo;
      mocks.media.extract.mockResolvedValue({ buffer: extracted, format: RawExtractedFormat.Jpeg });
      mocks.media.decodeImage.mockResolvedValue({ data, info });
      mocks.media.getImageMetadata.mockResolvedValue({ width: 2160, height: 3840, isTransparent: false });

      await expect(
        sut.handleGeneratePersonThumbnail({ ownerId: person.ownerId, personGroupId: person.personGroupId }),
      ).resolves.toBe(JobStatus.Success);

      expect(mocks.media.extract).toHaveBeenCalledWith(personThumbnailStub.rawEmbeddedThumbnail.originalPath);
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(extracted, {
        colorspace: Colorspace.P3,
        orientation: ExifOrientation.Horizontal,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        { data, info },
        {
          colorspace: Colorspace.P3,
          format: ImageFormat.Jpeg,
          quality: 80,
          progressive: false,
          edits: [
            {
              action: 'crop',
              parameters: {
                height: 844,
                width: 844,
                x: 388,
                y: 730,
              },
            },
          ],
          processInvalidImages: false,
          size: 250,
        },
        expect.any(String),
      );
    });

    it('should not use embedded preview if enabled and not raw image', async () => {
      const person = PersonFactory.create();

      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.newThumbnailMiddle);
      mocks.media.generateThumbnail.mockResolvedValue();
      const data = Buffer.from('');
      const info = { width: 2160, height: 3840 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });

      await expect(
        sut.handleGeneratePersonThumbnail({ ownerId: person.ownerId, personGroupId: person.personGroupId }),
      ).resolves.toBe(JobStatus.Success);

      expect(mocks.media.extract).not.toHaveBeenCalled();
      expect(mocks.media.generateThumbnail).toHaveBeenCalled();
    });

    it('should not use embedded preview if enabled and raw image if not exists', async () => {
      const person = PersonFactory.create();

      mocks.systemMetadata.get.mockResolvedValue({ image: { extractEmbedded: true } });
      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.rawEmbeddedThumbnail);
      mocks.media.generateThumbnail.mockResolvedValue();
      const data = Buffer.from('');
      const info = { width: 2160, height: 3840 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });

      await expect(
        sut.handleGeneratePersonThumbnail({ ownerId: person.ownerId, personGroupId: person.personGroupId }),
      ).resolves.toBe(JobStatus.Success);

      expect(mocks.media.extract).toHaveBeenCalledWith(personThumbnailStub.rawEmbeddedThumbnail.originalPath);
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(personThumbnailStub.rawEmbeddedThumbnail.originalPath, {
        colorspace: Colorspace.P3,
        orientation: undefined,
        processInvalidImages: false,
      });
      expect(mocks.media.generateThumbnail).toHaveBeenCalled();
    });

    it('should not use embedded preview if enabled and raw image if low resolution', async () => {
      const person = PersonFactory.create();

      mocks.systemMetadata.get.mockResolvedValue({ image: { extractEmbedded: true } });
      mocks.person.getDataForThumbnailGenerationJob.mockResolvedValue(personThumbnailStub.rawEmbeddedThumbnail);
      mocks.media.generateThumbnail.mockResolvedValue();
      const extracted = Buffer.from('');
      const data = Buffer.from('');
      const info = { width: 1000, height: 1000 } as OutputInfo;
      mocks.media.decodeImage.mockResolvedValue({ data, info });
      mocks.media.extract.mockResolvedValue({ buffer: extracted, format: RawExtractedFormat.Jpeg });
      mocks.media.getImageMetadata.mockResolvedValue({ width: 1000, height: 1000, isTransparent: false });

      await expect(
        sut.handleGeneratePersonThumbnail({ ownerId: person.ownerId, personGroupId: person.personGroupId }),
      ).resolves.toBe(JobStatus.Success);

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
      const asset = AssetFactory.create({ type: AssetType.Video });
      mocks.assetJob.streamForVideoConversion.mockReturnValue(makeStream([asset]));
      mocks.person.getAll.mockReturnValue(makeStream());

      await sut.handleQueueVideoConversion({ force: true });

      expect(mocks.assetJob.streamForVideoConversion).toHaveBeenCalledWith(true);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetEncodeVideo,
          data: { id: asset.id },
        },
      ]);
    });

    it('should queue all video assets without encoded videos', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video });
      mocks.assetJob.streamForVideoConversion.mockReturnValue(makeStream([asset]));

      await sut.handleQueueVideoConversion({});

      expect(mocks.assetJob.streamForVideoConversion).toHaveBeenCalledWith(void 0);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetEncodeVideo,
          data: { id: asset.id },
        },
      ]);
    });

    it('should queue hidden assets when force is not set', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video, visibility: AssetVisibility.Hidden });
      mocks.assetJob.streamForVideoConversion.mockReturnValue(makeStream([asset]));

      await sut.handleQueueVideoConversion({});
      expect(mocks.assetJob.streamForVideoConversion).toHaveBeenCalledWith(void 0);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetEncodeVideo,
          data: { id: asset.id },
        },
      ]);
    });
  });

  describe('handleVideoConversion', () => {
    let asset: ReturnType<typeof AssetFactory.create> & {
      videoStream: VideoStreamInfo & { timeBase: number };
      audioStream: AudioStreamInfo | null;
      format: VideoFormat;
    };
    beforeEach(() => {
      asset = {
        ...AssetFactory.create({ id: 'video-id', type: AssetType.Video, originalPath: '/original/path.ext' }),
        videoStream: probeStub.videoStreamH264.videoStream,
        audioStream: null,
        format: probeStub.videoStreamH264.format,
      };
      mocks.assetJob.getForVideoConversion.mockResolvedValue(asset);
      sut.videoInterfaces = { dri: ['renderD128'], mali: true };
    });

    it('should skip transcoding if asset not found', async () => {
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should transcode the highest bitrate video stream', async () => {
      mocks.logger.isLevelEnabled.mockReturnValue(false);
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.multipleVideoStreams });

      await sut.handleVideoConversion({ id: 'video-id' });

      expect(mocks.systemMetadata.get).toHaveBeenCalled();
      expect(mocks.storage.mkdirSync).toHaveBeenCalled();
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-map', '0:1', '-map', '0:3']),
          twoPass: false,
        }),
      );
    });

    it('should transcode the highest bitrate audio stream', async () => {
      mocks.logger.isLevelEnabled.mockReturnValue(false);
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.multipleAudioStreams });

      await sut.handleVideoConversion({ id: 'video-id' });

      expect(mocks.systemMetadata.get).toHaveBeenCalled();
      expect(mocks.storage.mkdirSync).toHaveBeenCalled();
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-map', '0:0', '-map', '0:2']),
          twoPass: false,
        }),
      );
    });

    it('should skip a video without any streams', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.noVideoStreams });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should skip a video without any height', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.noHeight });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should throw an error if an unknown transcode policy is configured', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.noAudioStreams });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: 'foo' } } as never as SystemConfig);

      await expect(sut.handleVideoConversion({ id: 'video-id' })).rejects.toThrowError();
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should throw an error if transcoding fails and hw acceleration is disabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.multipleVideoStreams });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { transcode: TranscodePolicy.All, accel: TranscodeHardwareAcceleration.Disabled },
      });
      mocks.media.transcode.mockRejectedValue(new Error('Error transcoding video'));

      await expect(sut.handleVideoConversion({ id: 'video-id' })).resolves.toBe(JobStatus.Failed);
      expect(mocks.media.transcode).toHaveBeenCalledTimes(1);
    });

    it('should transcode when set to all', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.multipleVideoStreams });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.All } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.any(Array),
          twoPass: false,
        }),
      );
    });

    it('should transcode when optimal and too big', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStream2160p });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.Optimal } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.any(Array),
          twoPass: false,
        }),
      );
    });

    it('should not transcode when policy bitrate and bitrate lower than max bitrate', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStream40Mbps });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.Bitrate, maxBitrate: '50M' } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should transcode when policy bitrate and bitrate higher than max bitrate', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStream40Mbps });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.Bitrate, maxBitrate: '30M' } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.any(Array),
          twoPass: false,
        }),
      );
    });

    it('should not transcode when max bitrate is not a number', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStream40Mbps });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.Bitrate, maxBitrate: 'foo' } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should not transcode when max bitrate is 0', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStream40Mbps });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.Bitrate, maxBitrate: '0' } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should not scale resolution if no target resolution', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStream2160p });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { transcode: TranscodePolicy.All, targetResolution: 'original' },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('scale')]),
          twoPass: false,
        }),
      );
    });

    it('should scale horizontally when video is horizontal', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStream2160p });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.Optimal } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([expect.stringMatching(/scale(_.+)?=-2:720/)]),
          twoPass: false,
        }),
      );
    });

    it('should scale vertically when video is vertical', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamVertical2160p });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.Optimal } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([expect.stringMatching(/scale(_.+)?=720:-2/)]),
          twoPass: false,
        }),
      );
    });

    it('should scale horizontally when a vertical video is rotated to landscape', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({
        ...asset,
        ...probeStub.videoStreamRotatedHorizontal2160p,
      });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.Optimal } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([expect.stringMatching(/scale(_.+)?=-2:720/)]),
          twoPass: false,
        }),
      );
    });

    it.each([
      { accel: TranscodeHardwareAcceleration.Nvenc, scaling: 'scale_cuda=-2:720' },
      { accel: TranscodeHardwareAcceleration.Qsv, scaling: 'scale_qsv=-1:720' },
      { accel: TranscodeHardwareAcceleration.Vaapi, scaling: 'scale_vaapi=-2:720' },
      { accel: TranscodeHardwareAcceleration.Rkmpp, scaling: 'scale_rkrga=-2:720' },
    ])('should scale rotated video by its stored dimensions when decoding with $accel', async ({ accel, scaling }) => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamVertical2160p });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel, accelDecode: true, transcode: TranscodePolicy.Optimal },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-noautorotate']),
          outputOptions: expect.arrayContaining([expect.stringContaining(scaling)]),
        }),
      );
    });

    it('should always scale video if height is uneven', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamOddHeight });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { transcode: TranscodePolicy.All, targetResolution: 'original' },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([expect.stringMatching(/scale(_.+)?=-2:354/)]),
          twoPass: false,
        }),
      );
    });

    it('should always scale video if width is uneven', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamOddWidth });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { transcode: TranscodePolicy.All, targetResolution: 'original' },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([expect.stringMatching(/scale(_.+)?=354:-2/)]),
          twoPass: false,
        }),
      );
    });

    it('should copy video stream when video matches target', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { targetVideoCodec: VideoCodec.Hevc, acceptedAudioCodecs: [AudioCodec.Aac] },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v', 'copy', '-c:a', 'aac']),
          twoPass: false,
        }),
      );
    });

    it('should not include hevc tag when target is hevc and video stream is copied from a different codec', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamH264 });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          targetVideoCodec: VideoCodec.Hevc,
          acceptedVideoCodecs: [VideoCodec.H264, VideoCodec.Hevc],
          acceptedAudioCodecs: [AudioCodec.Aac],
        },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining(['-tag:v', 'hvc1']),
          twoPass: false,
        }),
      );
    });

    it('should include hevc tag when target is hevc and copying hevc video stream', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          targetVideoCodec: VideoCodec.Hevc,
          acceptedVideoCodecs: [VideoCodec.H264, VideoCodec.Hevc],
          acceptedAudioCodecs: [AudioCodec.Aac],
        },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v', 'copy', '-tag:v', 'hvc1']),
          twoPass: false,
        }),
      );
    });

    it('should include hevc tag when target is hevc and using hwa', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamHDR10 });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          targetVideoCodec: VideoCodec.Hevc,
          accel: TranscodeHardwareAcceleration.Nvenc,
        },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v', 'hevc_nvenc', '-tag:v', 'hvc1']),
          twoPass: false,
        }),
      );
    });

    it('should copy audio stream when audio matches target', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.audioStreamAac });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.Optimal } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v', 'h264', '-c:a', 'copy']),
          twoPass: false,
        }),
      );
    });

    it('should remux when input is not an accepted container', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamAvi });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v', 'copy', '-c:a', 'copy']),
          twoPass: false,
        }),
      );
    });

    it('should throw an exception if transcode value is invalid', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStream2160p });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: 'invalid' as any } });

      await expect(sut.handleVideoConversion({ id: 'video-id' })).rejects.toThrowError();
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should not transcode if transcoding is disabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStream2160p });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.Disabled } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should not remux when input is not an accepted container and transcoding is disabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.Disabled } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should not transcode if target codec is invalid', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStream2160p });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: 'invalid' as any } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should delete existing transcode if current policy does not require transcoding', async () => {
      const localAsset = AssetFactory.from({ type: AssetType.Video })
        .file({ type: AssetFileType.EncodedVideo, path: '/encoded/video/path.mp4' })
        .build();
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.Disabled } });
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...localAsset, ...probeStub.videoStream2160p });

      await sut.handleVideoConversion({ id: localAsset.id });

      expect(mocks.media.transcode).not.toHaveBeenCalled();
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FileDelete,
        data: { files: ['/encoded/video/path.mp4'] },
      });
    });

    it('should set max bitrate if above 0', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { maxBitrate: '4500k' } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v', 'h264', '-maxrate', '4500k', '-bufsize', '9000k']),
          twoPass: false,
        }),
      );
    });

    it('should default max bitrate to kbps if no unit is provided', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { maxBitrate: '4500' } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v', 'h264', '-maxrate', '4500k', '-bufsize', '9000k']),
          twoPass: false,
        }),
      );
    });

    it('should transcode in two passes for h264/h265 when enabled and max bitrate is above 0', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { twoPass: true, maxBitrate: '4500k' } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([
            '-c:v',
            'h264',
            '-b:v',
            '3104k',
            '-minrate',
            '1552k',
            '-maxrate',
            '4500k',
          ]),
          twoPass: true,
        }),
      );
    });

    it('should fallback to one pass for h264/h265 if two-pass is enabled but no max bitrate is set', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { twoPass: true } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v', 'h264', '-c:a', 'copy']),
          twoPass: false,
        }),
      );
    });

    it('should transcode by bitrate in two passes for vp9 when two pass mode and max bitrate are enabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          maxBitrate: '4500k',
          twoPass: true,
          targetVideoCodec: VideoCodec.Vp9,
        },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-b:v', '3104k', '-minrate', '1552k', '-maxrate', '4500k']),
          twoPass: true,
        }),
      );
    });

    it('should transcode by crf in two passes for vp9 when two pass mode is enabled and max bitrate is disabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          maxBitrate: '0',
          twoPass: true,
          targetVideoCodec: VideoCodec.Vp9,
        },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-maxrate')]),
          twoPass: true,
        }),
      );
    });

    it('should configure preset for vp9', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.Vp9, preset: 'slow' } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-cpu-used', '2']),
          twoPass: false,
        }),
      );
    });

    it('should not configure preset for vp9 if invalid', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { preset: 'invalid', targetVideoCodec: VideoCodec.Vp9 } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-cpu-used')]),
          twoPass: false,
        }),
      );
    });

    it('should configure threads if above 0', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.Vp9, threads: 2 } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-threads', '2']),
          twoPass: false,
        }),
      );
    });

    it('should disable thread pooling for h264 if thread limit is 1', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { threads: 1 } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-threads', '1', '-x264-params', 'frame-threads=1:pools=none']),
          twoPass: false,
        }),
      );
    });

    it('should omit thread flags for h264 if thread limit is at or below 0', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { threads: 0 } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-threads')]),
          twoPass: false,
        }),
      );
    });

    it('should disable thread pooling for hevc if thread limit is 1', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamVp9 });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { threads: 1, targetVideoCodec: VideoCodec.Hevc } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([
            '-c:v',
            'hevc',
            '-threads',
            '1',
            '-x265-params',
            'frame-threads=1:pools=none',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should omit thread flags for hevc if thread limit is at or below 0', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamVp9 });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { threads: 0, targetVideoCodec: VideoCodec.Hevc } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-threads')]),
          twoPass: false,
        }),
      );
    });

    it('should use av1 if specified', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamVp9 });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.Av1 } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([
            '-c:v',
            'libsvtav1',
            '-movflags',
            'faststart',
            '-fps_mode',
            'passthrough',
            '-map',
            '0:0',
            '-map',
            '0:3',
            '-v',
            'verbose',
            '-vf',
            'scale=-2:720',
            '-preset',
            '12',
            '-crf',
            '23',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should map `veryslow` preset to 4 for av1', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamVp9 });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.Av1, preset: 'veryslow' } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-preset', '4']),
          twoPass: false,
        }),
      );
    });

    it('should set max bitrate for av1 if specified', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamVp9 });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.Av1, maxBitrate: '2M' } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-svtav1-params', 'mbr=2M']),
          twoPass: false,
        }),
      );
    });

    it('should set threads for av1 if specified', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamVp9 });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { targetVideoCodec: VideoCodec.Av1, threads: 4 } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-svtav1-params', 'lp=4']),
          twoPass: false,
        }),
      );
    });

    it('should set both bitrate and threads for av1 if specified', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamVp9 });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { targetVideoCodec: VideoCodec.Av1, threads: 4, maxBitrate: '2M' },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-svtav1-params', 'lp=4:mbr=2M']),
          twoPass: false,
        }),
      );
    });

    it('should skip transcoding for audioless videos with optimal policy if video codec is correct', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.noAudioStreams });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          targetVideoCodec: VideoCodec.Hevc,
          transcode: TranscodePolicy.Optimal,
          targetResolution: '1080p',
        },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    describe('should skip transcoding for accepted audio codecs with optimal policy if video is fine', () => {
      const acceptedCodecs = [
        { codec: 'aac', probeStub: probeStub.audioStreamAac },
        { codec: 'mp3', probeStub: probeStub.audioStreamMp3 },
        { codec: 'opus', probeStub: probeStub.audioStreamOpus },
      ];

      beforeEach(() => {
        mocks.systemMetadata.get.mockResolvedValue({
          ffmpeg: {
            targetVideoCodec: VideoCodec.Hevc,
            transcode: TranscodePolicy.Optimal,
            targetResolution: '1080p',
          },
        });
      });

      it.each(acceptedCodecs)('should skip $codec', async ({ probeStub: stub }) => {
        mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...stub });
        await sut.handleVideoConversion({ id: 'video-id' });
        expect(mocks.media.transcode).not.toHaveBeenCalled();
      });
    });

    it('should use libopus audio encoder when target audio is opus', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.audioStreamAac });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          targetAudioCodec: AudioCodec.Opus,
          transcode: TranscodePolicy.All,
        },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:a', 'libopus']),
          twoPass: false,
        }),
      );
    });

    it('should fail if hwaccel is enabled for an unsupported codec', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Nvenc, targetVideoCodec: VideoCodec.Vp9 },
      });
      await expect(sut.handleVideoConversion({ id: 'video-id' })).rejects.toThrowError();
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should fail if hwaccel option is invalid', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: 'invalid' as any } });
      await expect(sut.handleVideoConversion({ id: 'video-id' })).rejects.toThrowError();
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should set options for nvenc sw decode', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Nvenc, accelDecode: false },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-init_hw_device', 'cuda=cuda:0', '-filter_hw_device', 'cuda']),
          outputOptions: expect.arrayContaining([
            '-tune',
            'hq',
            '-qmin',
            '0',
            '-rc-lookahead',
            '20',
            '-i_qfactor',
            '0.75',
            '-c:v',
            'h264_nvenc',
            '-c:a',
            'copy',
            '-movflags',
            'faststart',
            '-fps_mode',
            'passthrough',
            '-map',
            '0:0',
            '-map',
            '0:3',
            '-g',
            '256',
            '-v',
            'verbose',
            '-vf',
            'hwupload_cuda,scale_cuda=-2:720:format=nv12',
            '-preset',
            'p1',
            '-cq:v',
            '23',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should set two pass options for nvenc when enabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          accel: TranscodeHardwareAcceleration.Nvenc,
          maxBitrate: '10000k',
          twoPass: true,
        },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([expect.stringContaining('-multipass')]),
          twoPass: false,
        }),
      );
    });

    it('should set vbr options for nvenc when max bitrate is enabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Nvenc, maxBitrate: '10000k' },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-cq:v', '23', '-maxrate', '10000k', '-bufsize', '6897k']),
          twoPass: false,
        }),
      );
    });

    it('should set cq options for nvenc when max bitrate is disabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Nvenc, maxBitrate: '10000k' },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.stringContaining('-maxrate'),
          twoPass: false,
        }),
      );
    });

    it('should omit preset for nvenc if invalid', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Nvenc, preset: 'invalid' },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-preset')]),
          twoPass: false,
        }),
      );
    });

    it('should ignore two pass for nvenc if max bitrate is disabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHardwareAcceleration.Nvenc } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-multipass')]),
          twoPass: false,
        }),
      );
    });

    it('should use hardware decoding for nvenc if enabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Nvenc, accelDecode: true },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel',
            'cuda',
            '-hwaccel_output_format',
            'cuda',
            '-noautorotate',
            '-threads',
            '1',
          ]),
          outputOptions: expect.arrayContaining([expect.stringContaining('scale_cuda=-2:720:format=nv12')]),
          twoPass: false,
        }),
      );
    });

    it('should use hardware tone-mapping for nvenc if hardware decoding is enabled and should tone map', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamHDR });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Nvenc, accelDecode: true },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda']),
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
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStream10Bit });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Nvenc, accelDecode: true },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda']),
          outputOptions: expect.arrayContaining([expect.stringContaining('scale_cuda=-2:720:format=nv12')]),
          twoPass: false,
        }),
      );
    });

    it('should set options for qsv with sw decode', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Qsv, maxBitrate: '10000k', accelDecode: false },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-init_hw_device',
            'qsv=hw,child_device=/dev/dri/renderD128',
            '-filter_hw_device',
            'hw',
          ]),
          outputOptions: expect.arrayContaining([
            '-c:v',
            'h264_qsv',
            '-c:a',
            'copy',
            '-movflags',
            'faststart',
            '-fps_mode',
            'passthrough',
            '-map',
            '0:0',
            '-map',
            '0:3',
            '-bf',
            '7',
            '-refs',
            '5',
            '-g',
            '256',
            '-v',
            'verbose',
            '-vf',
            'hwupload=extra_hw_frames=64,scale_qsv=-1:720:mode=hq:format=nv12',
            '-preset',
            '7',
            '-global_quality:v',
            '23',
            '-b:v',
            '6897k',
            '-maxrate',
            '10000k',
            '-bufsize',
            '20000k',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should set options for qsv with custom dri node with sw decode', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          accel: TranscodeHardwareAcceleration.Qsv,
          maxBitrate: '10000k',
          preferredHwDevice: '/dev/dri/renderD128',
          accelDecode: false,
        },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-init_hw_device',
            'qsv=hw,child_device=/dev/dri/renderD128',
            '-filter_hw_device',
            'hw',
          ]),
          outputOptions: expect.any(Array),
          twoPass: false,
        }),
      );
    });

    it('should omit preset for qsv if invalid', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Qsv, preset: 'invalid' },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-preset')]),
          twoPass: false,
        }),
      );
    });

    it('should set low power mode for qsv if target video codec is vp9', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Qsv, targetVideoCodec: VideoCodec.Vp9 },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-low_power', '1']),
          twoPass: false,
        }),
      );
    });

    it('should fail for qsv if no hw devices', async () => {
      sut.videoInterfaces = { dri: [], mali: false };
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHardwareAcceleration.Qsv } });

      await expect(sut.handleVideoConversion({ id: 'video-id' })).rejects.toThrowError();

      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should prefer higher index renderD* device for qsv', async () => {
      sut.videoInterfaces = { dri: ['card1', 'renderD129', 'card0', 'renderD128'], mali: false };
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHardwareAcceleration.Qsv } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-qsv_device', '/dev/dri/renderD129']),
          outputOptions: expect.arrayContaining(['-c:v', 'h264_qsv']),
          twoPass: false,
        }),
      );
    });

    it('should use hardware decoding for qsv if enabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Qsv, accelDecode: true },
      });

      await sut.handleVideoConversion({ id: 'video-id' });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel',
            'qsv',
            '-hwaccel_output_format',
            'qsv',
            '-async_depth',
            '4',
            '-noautorotate',
            '-threads',
            '1',
            '-qsv_device',
            '/dev/dri/renderD128',
          ]),
          outputOptions: expect.arrayContaining([expect.stringContaining('scale_qsv=-1:720:async_depth=4:mode=hq')]),
          twoPass: false,
        }),
      );
    });

    it('should use hardware tone-mapping for qsv if hardware decoding is enabled and should tone map', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamHDR });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Qsv, accelDecode: true },
      });

      await sut.handleVideoConversion({ id: 'video-id' });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel',
            'qsv',
            '-hwaccel_output_format',
            'qsv',
            '-async_depth',
            '4',
            '-threads',
            '1',
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
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Qsv, accelDecode: true, preferredHwDevice: 'renderD129' },
      });

      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel', 'qsv', '-qsv_device', '/dev/dri/renderD129']),
          outputOptions: expect.any(Array),
          twoPass: false,
        }),
      );
    });

    it('should set format to nv12 for qsv if input is not yuv420p', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStream10Bit });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Qsv, accelDecode: true },
      });

      await sut.handleVideoConversion({ id: 'video-id' });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel',
            'qsv',
            '-hwaccel_output_format',
            'qsv',
            '-async_depth',
            '4',
            '-threads',
            '1',
          ]),
          outputOptions: expect.arrayContaining([expect.stringContaining('format=nv12')]),
          twoPass: false,
        }),
      );
    });

    it('should set options for sw decode vaapi', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Vaapi, accelDecode: false },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-init_hw_device',
            'vaapi=accel:/dev/dri/renderD128',
            '-filter_hw_device',
            'accel',
          ]),
          outputOptions: expect.arrayContaining([
            '-c:v',
            'h264_vaapi',
            '-c:a',
            'copy',
            '-movflags',
            'faststart',
            '-fps_mode',
            'passthrough',
            '-map',
            '0:0',
            '-map',
            '0:3',
            '-g',
            '256',
            '-v',
            'verbose',
            '-vf',
            'hwupload=extra_hw_frames=64,scale_vaapi=-2:720:mode=hq:out_range=pc:format=nv12',
            '-compression_level',
            '7',
            '-rc_mode',
            '1',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should set vbr options for vaapi when max bitrate is enabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Vaapi, maxBitrate: '10000k' },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([
            '-c:v',
            'h264_vaapi',
            '-b:v',
            '6897k',
            '-maxrate',
            '10000k',
            '-minrate',
            '3448.5k',
            '-rc_mode',
            '3',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should set cq options for vaapi when max bitrate is disabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHardwareAcceleration.Vaapi } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([
            '-c:v',
            'h264_vaapi',
            '-c:a',
            'copy',
            '-qp:v',
            '23',
            '-global_quality:v',
            '23',
            '-rc_mode',
            '1',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should omit preset for vaapi if invalid', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Vaapi, preset: 'invalid' },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.not.arrayContaining([expect.stringContaining('-compression_level')]),
          twoPass: false,
        }),
      );
    });

    it('should prefer higher index renderD* device for vaapi', async () => {
      sut.videoInterfaces = { dri: ['card1', 'renderD129', 'card0', 'renderD128'], mali: false };
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHardwareAcceleration.Vaapi } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel_device', '/dev/dri/renderD129']),
          outputOptions: expect.arrayContaining(['-c:v', 'h264_vaapi']),
          twoPass: false,
        }),
      );
    });

    it('should select specific gpu node if selected', async () => {
      sut.videoInterfaces = { dri: ['renderD129', 'card1', 'card0', 'renderD128'], mali: false };
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Vaapi, preferredHwDevice: '/dev/dri/renderD128' },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel_device', '/dev/dri/renderD128']),
          outputOptions: expect.arrayContaining(['-c:v', 'h264_vaapi']),
          twoPass: false,
        }),
      );
    });

    it('should use hardware decoding for vaapi if enabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Vaapi, accelDecode: true },
      });

      await sut.handleVideoConversion({ id: 'video-id' });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel',
            'vaapi',
            '-hwaccel_output_format',
            'vaapi',
            '-noautorotate',
            '-threads',
            '1',
            '-hwaccel_device',
            '/dev/dri/renderD128',
          ]),
          outputOptions: expect.arrayContaining([expect.stringContaining('scale_vaapi=-2:720:mode=hq:out_range=pc')]),
          twoPass: false,
        }),
      );
    });

    it('should use hardware tone-mapping for vaapi if hardware decoding is enabled and should tone map', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamHDR });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Vaapi, accelDecode: true },
      });

      await sut.handleVideoConversion({ id: 'video-id' });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel',
            'vaapi',
            '-hwaccel_output_format',
            'vaapi',
            '-threads',
            '1',
          ]),
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
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStream10Bit });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Vaapi, accelDecode: true },
      });

      await sut.handleVideoConversion({ id: 'video-id' });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel',
            'vaapi',
            '-hwaccel_output_format',
            'vaapi',
            '-threads',
            '1',
          ]),
          outputOptions: expect.arrayContaining([expect.stringContaining('format=nv12')]),
          twoPass: false,
        }),
      );
    });

    it('should use preferred device for vaapi when hardware decoding', async () => {
      sut.videoInterfaces = { dri: ['renderD128', 'renderD129', 'renderD130'], mali: false };
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Vaapi, accelDecode: true, preferredHwDevice: 'renderD129' },
      });

      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining(['-hwaccel', 'vaapi', '-hwaccel_device', '/dev/dri/renderD129']),
          outputOptions: expect.any(Array),
          twoPass: false,
        }),
      );
    });

    it('should fallback to hw encoding and sw decoding if hw transcoding fails and hw decoding is enabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Vaapi, accelDecode: true },
      });
      mocks.media.transcode.mockRejectedValueOnce(new Error('error'));
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledTimes(2);
      expect(mocks.media.transcode).toHaveBeenLastCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-init_hw_device',
            'vaapi=accel:/dev/dri/renderD128',
            '-filter_hw_device',
            'accel',
          ]),
          outputOptions: expect.arrayContaining(['-c:v', 'h264_vaapi']),
          twoPass: false,
        }),
      );
    });

    it('should fallback to sw decoding if fallback to sw decoding + hw encoding fails', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Vaapi, accelDecode: true },
      });
      mocks.media.transcode.mockRejectedValueOnce(new Error('error'));
      mocks.media.transcode.mockRejectedValueOnce(new Error('error'));
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledTimes(3);
      expect(mocks.media.transcode).toHaveBeenLastCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v', 'h264']),
          twoPass: false,
        }),
      );
    });

    it('should fallback to sw transcoding if hw transcoding fails and hw decoding is disabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Vaapi, accelDecode: false },
      });
      mocks.media.transcode.mockRejectedValueOnce(new Error('error'));
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledTimes(2);
      expect(mocks.media.transcode).toHaveBeenLastCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v', 'h264']),
          twoPass: false,
        }),
      );
    });

    it('should fail for vaapi if no hw devices', async () => {
      sut.videoInterfaces = { dri: [], mali: true };
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { accel: TranscodeHardwareAcceleration.Vaapi } });
      await expect(sut.handleVideoConversion({ id: 'video-id' })).rejects.toThrowError();
      expect(mocks.media.transcode).not.toHaveBeenCalled();
    });

    it('should set options for rkmpp', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Rkmpp, accelDecode: true },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel',
            'rkmpp',
            '-hwaccel_output_format',
            'drm_prime',
            '-afbc',
            'rga',
            '-noautorotate',
          ]),
          outputOptions: expect.arrayContaining([
            '-c:v',
            'h264_rkmpp',
            '-c:a',
            'copy',
            '-movflags',
            'faststart',
            '-fps_mode',
            'passthrough',
            '-map',
            '0:0',
            '-map',
            '0:3',
            '-g',
            '256',
            '-v',
            'verbose',
            '-vf',
            'scale_rkrga=-2:720:format=nv12:afbc=1:async_depth=4',
            '-level',
            '51',
            '-rc_mode',
            'CQP',
            '-qp_init',
            '23',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should set vbr options for rkmpp when max bitrate is enabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamVp9 });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: {
          accel: TranscodeHardwareAcceleration.Rkmpp,
          accelDecode: true,
          maxBitrate: '10000k',
          targetVideoCodec: VideoCodec.Hevc,
        },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel',
            'rkmpp',
            '-hwaccel_output_format',
            'drm_prime',
            '-afbc',
            'rga',
          ]),
          outputOptions: expect.arrayContaining([
            '-c:v',
            'hevc_rkmpp',
            '-level',
            '153',
            '-rc_mode',
            'AVBR',
            '-b:v',
            '10000k',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should set cqp options for rkmpp when max bitrate is disabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Rkmpp, accelDecode: true, crf: 30, maxBitrate: '0' },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel',
            'rkmpp',
            '-hwaccel_output_format',
            'drm_prime',
            '-afbc',
            'rga',
          ]),
          outputOptions: expect.arrayContaining([
            '-c:v',
            'h264_rkmpp',
            '-level',
            '51',
            '-rc_mode',
            'CQP',
            '-qp_init',
            '30',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should set OpenCL tonemapping options for rkmpp when OpenCL is available', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamHDR });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Rkmpp, accelDecode: true, crf: 30, maxBitrate: '0' },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel',
            'rkmpp',
            '-hwaccel_output_format',
            'drm_prime',
            '-afbc',
            'rga',
          ]),
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
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.noAudioStreams });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Rkmpp, accelDecode: true, crf: 30, maxBitrate: '0' },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.arrayContaining([
            '-hwaccel',
            'rkmpp',
            '-hwaccel_output_format',
            'drm_prime',
            '-afbc',
            'rga',
          ]),
          outputOptions: expect.arrayContaining([
            expect.stringContaining('scale_rkrga=-2:720:format=nv12:afbc=1:async_depth=4'),
          ]),
          twoPass: false,
        }),
      );
    });

    it('should use software decoding and tone-mapping if hardware decoding is disabled', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamHDR });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Rkmpp, accelDecode: false, crf: 30, maxBitrate: '0' },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
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
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamHDR });
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { accel: TranscodeHardwareAcceleration.Rkmpp, accelDecode: true, crf: 30, maxBitrate: '0' },
      });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
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
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamHDR });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.Required } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([
            '-c:v',
            'h264',
            '-c:a',
            'copy',
            '-vf',
            'tonemapx=tonemap=hable:desat=0:p=bt709:t=bt709:m=bt709:r=pc:peak=100:format=yuv420p',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should tonemap when policy is optimal and video is hdr', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStreamHDR });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.Optimal } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining([
            '-c:v',
            'h264',
            '-c:a',
            'copy',
            '-vf',
            'tonemapx=tonemap=hable:desat=0:p=bt709:t=bt709:m=bt709:r=pc:peak=100:format=yuv420p',
          ]),
          twoPass: false,
        }),
      );
    });

    it('should transcode when policy is required and video is not yuv420p', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStream10Bit });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.Required } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v', 'h264', '-c:a', 'copy', '-vf', 'format=yuv420p']),
          twoPass: false,
        }),
      );
    });

    it('should convert to yuv420p when scaling without tone-mapping', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStream4K10Bit });
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { transcode: TranscodePolicy.Required } });
      await sut.handleVideoConversion({ id: 'video-id' });
      expect(mocks.media.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        expect.any(String),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:v', 'h264', '-c:a', 'copy', '-vf', 'scale=-2:720,format=yuv420p']),
          twoPass: false,
        }),
      );
    });

    it('should count frames for progress when log level is debug', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.matroskaContainer });
      mocks.logger.isLevelEnabled.mockReturnValue(true);

      await sut.handleVideoConversion({ id: 'video-id' });

      expect(mocks.media.transcode).toHaveBeenCalledWith('/original/path.ext', expect.any(String), {
        inputOptions: expect.any(Array),
        outputOptions: expect.any(Array),
        twoPass: false,
        progress: {
          frameCount: probeStub.videoStream2160p.videoStream!.frameCount,
          percentInterval: expect.any(Number),
        },
      });
    });

    it('should not count frames for progress when log level is not debug', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.videoStream2160p });
      mocks.logger.isLevelEnabled.mockReturnValue(false);
      await sut.handleVideoConversion({ id: 'video-id' });
    });

    it('should process unknown audio stream', async () => {
      mocks.assetJob.getForVideoConversion.mockResolvedValue({ ...asset, ...probeStub.audioStreamUnknown });
      await sut.handleVideoConversion({ id: asset.id });

      expect(mocks.media.transcode).toHaveBeenCalledWith(
        asset.originalPath,
        expect.stringContaining('video-id.mp4'),
        expect.objectContaining({
          inputOptions: expect.any(Array),
          outputOptions: expect.arrayContaining(['-c:a', 'copy']),
          twoPass: false,
        }),
      );
    });
  });

  describe('isSRGB', () => {
    it('should return true for srgb colorspace', () => {
      expect(sut.isSRGB({ colorspace: 'sRGB' } as ShallowDehydrateObject<Exif>)).toEqual(true);
    });

    it('should return true for srgb profile description', () => {
      expect(sut.isSRGB({ profileDescription: 'sRGB v1.31' } as ShallowDehydrateObject<Exif>)).toEqual(true);
    });

    it('should return true for 8-bit image with no colorspace metadata', () => {
      expect(sut.isSRGB({ bitsPerSample: 8 } as ShallowDehydrateObject<Exif>)).toEqual(true);
    });

    it('should return true for image with no colorspace or bit depth metadata', () => {
      expect(sut.isSRGB({} as Exif)).toEqual(true);
    });

    it('should return false for non-srgb colorspace', () => {
      expect(sut.isSRGB({ colorspace: 'Adobe RGB' } as ShallowDehydrateObject<Exif>)).toEqual(false);
    });

    it('should return false for non-srgb profile description', () => {
      expect(sut.isSRGB({ profileDescription: 'sP3C' } as ShallowDehydrateObject<Exif>)).toEqual(false);
    });

    it('should return false for 16-bit image with no colorspace metadata', () => {
      expect(sut.isSRGB({ bitsPerSample: 16 } as ShallowDehydrateObject<Exif>)).toEqual(false);
    });

    it('should return true for 16-bit image with sRGB colorspace', () => {
      expect(sut.isSRGB({ colorspace: 'sRGB', bitsPerSample: 16 } as ShallowDehydrateObject<Exif>)).toEqual(true);
    });

    it('should return true for 16-bit image with sRGB profile', () => {
      expect(sut.isSRGB({ profileDescription: 'sRGB', bitsPerSample: 16 } as ShallowDehydrateObject<Exif>)).toEqual(
        true,
      );
    });
  });

  describe('syncFiles', () => {
    it('should upsert new files when they do not exist', async () => {
      const asset = {
        id: 'asset-id',
        files: [],
      };

      await sut['syncFiles'](asset.files, [
        {
          assetId: asset.id,
          type: AssetFileType.Preview,
          path: '/new/preview.jpg',
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
        {
          assetId: asset.id,
          type: AssetFileType.Thumbnail,
          path: '/new/thumbnail.jpg',
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
      ]);

      expect(mocks.asset.upsertFiles).toHaveBeenCalledWith([
        {
          assetId: 'asset-id',
          path: '/new/preview.jpg',
          type: AssetFileType.Preview,
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
        {
          assetId: 'asset-id',
          path: '/new/thumbnail.jpg',
          type: AssetFileType.Thumbnail,
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
      ]);
      expect(mocks.asset.deleteFiles).not.toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should replace existing files with new paths', async () => {
      const asset = {
        id: 'asset-id',
        files: [
          {
            id: 'file-1',
            assetId: 'asset-id',
            type: AssetFileType.Preview,
            path: '/old/preview.jpg',
            isEdited: false,
            isProgressive: false,
            isTransparent: false,
          },
          {
            id: 'file-2',
            assetId: 'asset-id',
            type: AssetFileType.Thumbnail,
            path: '/old/thumbnail.jpg',
            isEdited: false,
            isProgressive: false,
            isTransparent: false,
          },
        ],
      };

      await sut['syncFiles'](asset.files, [
        {
          assetId: asset.id,
          type: AssetFileType.Preview,
          path: '/new/preview.jpg',
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
        {
          assetId: asset.id,
          type: AssetFileType.Thumbnail,
          path: '/new/thumbnail.jpg',
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
      ]);

      expect(mocks.asset.upsertFiles).toHaveBeenCalledWith([
        {
          assetId: 'asset-id',
          path: '/new/preview.jpg',
          type: AssetFileType.Preview,
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
        {
          assetId: 'asset-id',
          path: '/new/thumbnail.jpg',
          type: AssetFileType.Thumbnail,
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
      ]);
      expect(mocks.asset.deleteFiles).not.toHaveBeenCalled();
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FileDelete,
        data: { files: ['/old/preview.jpg', '/old/thumbnail.jpg'] },
      });
    });

    it('should delete files when newPath is not provided', async () => {
      const asset = {
        id: 'asset-id',
        files: [
          {
            id: 'file-1',
            assetId: 'asset-id',
            type: AssetFileType.Preview,
            path: '/old/preview.jpg',
            isEdited: false,
            isProgressive: false,
            isTransparent: false,
          },
          {
            id: 'file-2',
            assetId: 'asset-id',
            type: AssetFileType.Thumbnail,
            path: '/old/thumbnail.jpg',
            isEdited: false,
            isProgressive: false,
            isTransparent: false,
          },
        ],
      };

      await sut['syncFiles'](asset.files, []);

      expect(mocks.asset.upsertFiles).not.toHaveBeenCalled();
      expect(mocks.asset.deleteFiles).toHaveBeenCalledWith([
        {
          id: 'file-1',
          assetId: 'asset-id',
          type: AssetFileType.Preview,
          path: '/old/preview.jpg',
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
        {
          id: 'file-2',
          assetId: 'asset-id',
          type: AssetFileType.Thumbnail,
          path: '/old/thumbnail.jpg',
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
      ]);
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FileDelete,
        data: { files: ['/old/preview.jpg', '/old/thumbnail.jpg'] },
      });
    });

    it('should not make changes when file paths already match', async () => {
      const asset = {
        id: 'asset-id',
        files: [
          {
            id: 'file-1',
            assetId: 'asset-id',
            type: AssetFileType.Preview,
            path: '/same/preview.jpg',
            isEdited: false,
            isProgressive: false,
            isTransparent: false,
          },
          {
            id: 'file-2',
            assetId: 'asset-id',
            type: AssetFileType.Thumbnail,
            path: '/same/thumbnail.jpg',
            isEdited: false,
            isProgressive: false,
            isTransparent: false,
          },
        ],
      };

      await sut['syncFiles'](asset.files, [
        {
          assetId: asset.id,
          type: AssetFileType.Preview,
          path: '/same/preview.jpg',
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
        {
          assetId: asset.id,
          type: AssetFileType.Thumbnail,
          path: '/same/thumbnail.jpg',
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
      ]);

      expect(mocks.asset.upsertFiles).not.toHaveBeenCalled();
      expect(mocks.asset.deleteFiles).not.toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should handle mixed operations (upsert, replace, delete)', async () => {
      const asset = {
        id: 'asset-id',
        files: [
          {
            id: 'file-1',
            assetId: 'asset-id',
            type: AssetFileType.Preview,
            path: '/old/preview.jpg',
            isEdited: false,
            isProgressive: false,
            isTransparent: false,
          },
          {
            id: 'file-2',
            assetId: 'asset-id',
            type: AssetFileType.Thumbnail,
            path: '/old/thumbnail.jpg',
            isEdited: false,
            isProgressive: false,
            isTransparent: false,
          },
        ],
      };

      await sut['syncFiles'](asset.files, [
        {
          assetId: asset.id,
          type: AssetFileType.Preview,
          path: '/new/preview.jpg',
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        }, // replace
        {
          assetId: asset.id,
          type: AssetFileType.FullSize,
          path: '/new/fullsize.jpg',
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        }, // new
      ]);

      expect(mocks.asset.upsertFiles).toHaveBeenCalledWith([
        {
          assetId: 'asset-id',
          path: '/new/preview.jpg',
          type: AssetFileType.Preview,
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
        {
          assetId: 'asset-id',
          path: '/new/fullsize.jpg',
          type: AssetFileType.FullSize,
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
      ]);
      expect(mocks.asset.deleteFiles).toHaveBeenCalledWith([
        {
          id: 'file-2',
          assetId: 'asset-id',
          type: AssetFileType.Thumbnail,
          path: '/old/thumbnail.jpg',
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
      ]);
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FileDelete,
        data: { files: ['/old/preview.jpg', '/old/thumbnail.jpg'] },
      });
    });

    it('should handle empty file list', async () => {
      const asset = {
        id: 'asset-id',
        files: [],
      };

      await sut['syncFiles'](asset.files, []);

      expect(mocks.asset.upsertFiles).not.toHaveBeenCalled();
      expect(mocks.asset.deleteFiles).not.toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should delete non-existent file types when newPath is not provided', async () => {
      const asset = {
        id: 'asset-id',
        files: [
          {
            id: 'file-1',
            assetId: 'asset-id',
            type: AssetFileType.Preview,
            path: '/old/preview.jpg',
            isEdited: false,
            isProgressive: false,
            isTransparent: false,
          },
        ],
      };

      await sut['syncFiles'](asset.files, []);

      expect(mocks.asset.upsertFiles).not.toHaveBeenCalled();
      expect(mocks.asset.deleteFiles).toHaveBeenCalledWith([
        {
          id: 'file-1',
          assetId: 'asset-id',
          type: AssetFileType.Preview,
          path: '/old/preview.jpg',
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
      ]);
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FileDelete,
        data: { files: ['/old/preview.jpg'] },
      });
    });

    it('should update database when isProgressive changes', async () => {
      const asset = {
        id: 'asset-id',
        files: [
          {
            id: 'file-1',
            assetId: 'asset-id',
            type: AssetFileType.Preview,
            path: '/old/preview.jpg',
            isEdited: false,
            isProgressive: false,
            isTransparent: false,
          },
          {
            id: 'file-2',
            assetId: 'asset-id',
            type: AssetFileType.Thumbnail,
            path: '/old/thumbnail.jpg',
            isEdited: false,
            isProgressive: false,
            isTransparent: false,
          },
        ],
      };

      await sut['syncFiles'](asset.files, [
        {
          assetId: asset.id,
          type: AssetFileType.Preview,
          path: '/old/preview.jpg',
          isEdited: false,
          isProgressive: true,
          isTransparent: false,
        },
        {
          assetId: asset.id,
          type: AssetFileType.Thumbnail,
          path: '/old/thumbnail.jpg',
          isEdited: false,
          isProgressive: false,
          isTransparent: false,
        },
      ]);

      expect(mocks.asset.upsertFiles).toHaveBeenCalledWith([
        {
          assetId: 'asset-id',
          path: '/old/preview.jpg',
          type: AssetFileType.Preview,
          isEdited: false,
          isProgressive: true,
          isTransparent: false,
        },
      ]);
      expect(mocks.asset.deleteFiles).not.toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });
  });
});

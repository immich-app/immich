import { BinaryField, ExifDateTime } from 'exiftool-vendored';
import { randomBytes } from 'node:crypto';
import { Stats } from 'node:fs';
import { defaults } from 'src/config';
import { MapAsset } from 'src/dtos/asset-response.dto';
import { AssetType, AssetVisibility, ExifOrientation, ImmichWorker, JobName, JobStatus, SourceType } from 'src/enum';
import { ImmichTags } from 'src/repositories/metadata.repository';
import { firstDateTime, MetadataService } from 'src/services/metadata.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { fileStub } from 'test/fixtures/file.stub';
import { probeStub } from 'test/fixtures/media.stub';
import { personStub } from 'test/fixtures/person.stub';
import { tagStub } from 'test/fixtures/tag.stub';
import { factory } from 'test/small.factory';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

const forSidecarJob = (
  asset: {
    id?: string;
    originalPath?: string;
    sidecarPath?: string | null;
  } = {},
) => {
  return {
    id: factory.uuid(),
    originalPath: '/path/to/IMG_123.jpg',
    sidecarPath: null,
    ...asset,
  };
};

const makeFaceTags = (face: Partial<{ Name: string }> = {}, orientation?: ImmichTags['Orientation']) => ({
  Orientation: orientation,
  RegionInfo: {
    AppliedToDimensions: { W: 1000, H: 100, Unit: 'pixel' },
    RegionList: [
      {
        Type: 'face',
        Area: {
          X: 0.1,
          Y: 0.4,
          W: 0.2,
          H: 0.4,
          Unit: 'normalized',
        },
        ...face,
      },
    ],
  },
});

describe(MetadataService.name, () => {
  let sut: MetadataService;
  let mocks: ServiceMocks;

  const mockReadTags = (exifData?: Partial<ImmichTags>, sidecarData?: Partial<ImmichTags>) => {
    mocks.metadata.readTags.mockReset();
    mocks.metadata.readTags.mockResolvedValueOnce(exifData ?? {});
    mocks.metadata.readTags.mockResolvedValueOnce(sidecarData ?? {});
  };

  beforeEach(() => {
    ({ sut, mocks } = newTestService(MetadataService));

    mockReadTags();

    mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);

    delete process.env.TZ;
  });

  afterEach(async () => {
    await sut.onShutdown();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('onBootstrapEvent', () => {
    it('should pause and resume queue during init', async () => {
      mocks.job.pause.mockResolvedValue();
      mocks.map.init.mockResolvedValue();
      mocks.job.resume.mockResolvedValue();

      await sut.onBootstrap();

      expect(mocks.job.pause).toHaveBeenCalledTimes(1);
      expect(mocks.map.init).toHaveBeenCalledTimes(1);
      expect(mocks.job.resume).toHaveBeenCalledTimes(1);
    });
  });

  describe('onConfigInit', () => {
    it('should update metadata processing concurrency', () => {
      sut.onConfigInit({ newConfig: defaults });

      expect(mocks.metadata.setMaxConcurrency).toHaveBeenCalledWith(defaults.job.metadataExtraction.concurrency);
      expect(mocks.metadata.setMaxConcurrency).toHaveBeenCalledTimes(1);
    });
  });

  describe('onConfigUpdate', () => {
    it('should update metadata processing concurrency', () => {
      const newConfig = structuredClone(defaults);
      newConfig.job.metadataExtraction.concurrency = 10;

      sut.onConfigUpdate({ oldConfig: defaults, newConfig });

      expect(mocks.metadata.setMaxConcurrency).toHaveBeenCalledWith(newConfig.job.metadataExtraction.concurrency);
      expect(mocks.metadata.setMaxConcurrency).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleQueueMetadataExtraction', () => {
    it('should queue metadata extraction for all assets without exif values', async () => {
      mocks.assetJob.streamForMetadataExtraction.mockReturnValue(makeStream([assetStub.image]));

      await expect(sut.handleQueueMetadataExtraction({ force: false })).resolves.toBe(JobStatus.Success);
      expect(mocks.assetJob.streamForMetadataExtraction).toHaveBeenCalledWith(false);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetExtractMetadata,
          data: { id: assetStub.image.id },
        },
      ]);
    });

    it('should queue metadata extraction for all assets', async () => {
      mocks.assetJob.streamForMetadataExtraction.mockReturnValue(makeStream([assetStub.image]));

      await expect(sut.handleQueueMetadataExtraction({ force: true })).resolves.toBe(JobStatus.Success);
      expect(mocks.assetJob.streamForMetadataExtraction).toHaveBeenCalledWith(true);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetExtractMetadata,
          data: { id: assetStub.image.id },
        },
      ]);
    });
  });

  describe('handleMetadataExtraction', () => {
    beforeEach(() => {
      const time = new Date('2022-01-01T00:00:00.000Z');
      const timeMs = time.valueOf();
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: time,
        mtimeMs: timeMs,
        birthtimeMs: timeMs,
      } as Stats);
    });

    it('should handle an asset that could not be found', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(void 0);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.image.id);
      expect(mocks.asset.upsertExif).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should handle a date in a sidecar file', async () => {
      const originalDate = new Date('2023-11-21T16:13:17.517Z');
      const sidecarDate = new Date('2022-01-01T00:00:00.000Z');
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.sidecar);
      mockReadTags({ CreationDate: originalDate.toISOString() }, { CreationDate: sidecarDate.toISOString() });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.sidecar.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(expect.objectContaining({ dateTimeOriginal: sidecarDate }));
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.image.id,
          duration: null,
          fileCreatedAt: sidecarDate,
          localDateTime: sidecarDate,
        }),
      );
    });

    it('should take the file modification date when missing exif and earlier than creation date', async () => {
      const fileCreatedAt = new Date('2022-01-01T00:00:00.000Z');
      const fileModifiedAt = new Date('2021-01-01T00:00:00.000Z');
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: fileModifiedAt,
        mtimeMs: fileModifiedAt.valueOf(),
        birthtimeMs: fileCreatedAt.valueOf(),
      } as Stats);
      mockReadTags();

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.image.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ dateTimeOriginal: fileModifiedAt }),
      );
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        duration: null,
        fileCreatedAt: fileModifiedAt,
        fileModifiedAt,
        localDateTime: fileModifiedAt,
      });
    });

    it('should take the file creation date when missing exif and earlier than modification date', async () => {
      const fileCreatedAt = new Date('2021-01-01T00:00:00.000Z');
      const fileModifiedAt = new Date('2022-01-01T00:00:00.000Z');
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: fileModifiedAt,
        mtimeMs: fileModifiedAt.valueOf(),
        birthtimeMs: fileCreatedAt.valueOf(),
      } as Stats);
      mockReadTags();

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.image.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(expect.objectContaining({ dateTimeOriginal: fileCreatedAt }));
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        duration: null,
        fileCreatedAt,
        fileModifiedAt,
        localDateTime: fileCreatedAt,
      });
    });

    it('should account for the server being in a non-UTC timezone', async () => {
      process.env.TZ = 'America/Los_Angeles';
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.sidecar);
      mockReadTags({ DateTimeOriginal: '2022:01:01 00:00:00' });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          dateTimeOriginal: new Date('2022-01-01T08:00:00.000Z'),
        }),
      );

      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          localDateTime: new Date('2022-01-01T00:00:00.000Z'),
        }),
      );
    });

    it('should handle lists of numbers', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: assetStub.image.fileModifiedAt,
        mtimeMs: assetStub.image.fileModifiedAt.valueOf(),
        birthtimeMs: assetStub.image.fileCreatedAt.valueOf(),
      } as Stats);
      mockReadTags({
        ISO: [160],
      });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.image.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(expect.objectContaining({ iso: 160 }));
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        duration: null,
        fileCreatedAt: assetStub.image.fileCreatedAt,
        fileModifiedAt: assetStub.image.fileCreatedAt,
        localDateTime: assetStub.image.fileCreatedAt,
      });
    });

    it('should not delete latituide and longitude without reverse geocode', async () => {
      // regression test for issue 17511
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.withLocation);
      mocks.systemMetadata.get.mockResolvedValue({ reverseGeocoding: { enabled: false } });
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: assetStub.withLocation.fileModifiedAt,
        mtimeMs: assetStub.withLocation.fileModifiedAt.valueOf(),
        birthtimeMs: assetStub.withLocation.fileCreatedAt.valueOf(),
      } as Stats);
      mockReadTags({
        GPSLatitude: assetStub.withLocation.exifInfo!.latitude!,
        GPSLongitude: assetStub.withLocation.exifInfo!.longitude!,
      });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.image.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ city: null, state: null, country: null }),
      );
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.withLocation.id,
        duration: null,
        fileCreatedAt: assetStub.withLocation.fileCreatedAt,
        fileModifiedAt: assetStub.withLocation.fileModifiedAt,
        localDateTime: new Date('2023-02-22T05:06:29.716Z'),
      });
    });

    it('should apply reverse geocoding', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.withLocation);
      mocks.systemMetadata.get.mockResolvedValue({ reverseGeocoding: { enabled: true } });
      mocks.map.reverseGeocode.mockResolvedValue({ city: 'City', state: 'State', country: 'Country' });
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: assetStub.withLocation.fileModifiedAt,
        mtimeMs: assetStub.withLocation.fileModifiedAt.valueOf(),
        birthtimeMs: assetStub.withLocation.fileCreatedAt.valueOf(),
      } as Stats);
      mockReadTags({
        GPSLatitude: assetStub.withLocation.exifInfo!.latitude!,
        GPSLongitude: assetStub.withLocation.exifInfo!.longitude!,
      });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.image.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ city: 'City', state: 'State', country: 'Country' }),
      );
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.withLocation.id,
        duration: null,
        fileCreatedAt: assetStub.withLocation.fileCreatedAt,
        fileModifiedAt: assetStub.withLocation.fileModifiedAt,
        localDateTime: new Date('2023-02-22T05:06:29.716Z'),
      });
    });

    it('should discard latitude and longitude on null island', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.withLocation);
      mockReadTags({
        GPSLatitude: 0,
        GPSLongitude: 0,
      });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.image.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(expect.objectContaining({ latitude: null, longitude: null }));
    });

    it('should extract tags from TagsList', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ TagsList: ['Parent'] });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: 'user-id', value: 'Parent', parent: undefined });
    });

    it('should extract hierarchy from TagsList', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ TagsList: ['Parent/Child'] });
      mocks.tag.upsertValue.mockResolvedValueOnce(tagStub.parentUpsert);
      mocks.tag.upsertValue.mockResolvedValueOnce(tagStub.childUpsert);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(1, {
        userId: 'user-id',
        value: 'Parent',
        parentId: undefined,
      });
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(2, {
        userId: 'user-id',
        value: 'Parent/Child',
        parentId: 'tag-parent',
      });
    });

    it('should extract tags from Keywords as a string', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ Keywords: 'Parent' });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: 'user-id', value: 'Parent', parent: undefined });
    });

    it('should extract tags from Keywords as a list', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ Keywords: ['Parent'] });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: 'user-id', value: 'Parent', parent: undefined });
    });

    it('should extract tags from Keywords as a list with a number', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ Keywords: ['Parent', 2024] });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: 'user-id', value: 'Parent', parent: undefined });
      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: 'user-id', value: '2024', parent: undefined });
    });

    it('should extract hierarchal tags from Keywords', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ Keywords: 'Parent/Child' });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(1, {
        userId: 'user-id',
        value: 'Parent',
        parentId: undefined,
      });
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(2, {
        userId: 'user-id',
        value: 'Parent/Child',
        parentId: 'tag-parent',
      });
    });

    it('should ignore Keywords when TagsList is present', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ Keywords: 'Child', TagsList: ['Parent/Child'] });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(1, {
        userId: 'user-id',
        value: 'Parent',
        parentId: undefined,
      });
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(2, {
        userId: 'user-id',
        value: 'Parent/Child',
        parentId: 'tag-parent',
      });
    });

    it('should extract hierarchy from HierarchicalSubject', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ HierarchicalSubject: ['Parent|Child', 'TagA'] });
      mocks.tag.upsertValue.mockResolvedValueOnce(tagStub.parentUpsert);
      mocks.tag.upsertValue.mockResolvedValueOnce(tagStub.childUpsert);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(1, {
        userId: 'user-id',
        value: 'Parent',
        parentId: undefined,
      });
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(2, {
        userId: 'user-id',
        value: 'Parent/Child',
        parentId: 'tag-parent',
      });
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(3, { userId: 'user-id', value: 'TagA', parent: undefined });
    });

    it('should extract tags from HierarchicalSubject as a list with a number', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ HierarchicalSubject: ['Parent', 2024] });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: 'user-id', value: 'Parent', parent: undefined });
      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: 'user-id', value: '2024', parent: undefined });
    });

    it('should extract ignore / characters in a HierarchicalSubject tag', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ HierarchicalSubject: ['Mom/Dad'] });
      mocks.tag.upsertValue.mockResolvedValueOnce(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({
        userId: 'user-id',
        value: 'Mom|Dad',
        parent: undefined,
      });
    });

    it('should ignore HierarchicalSubject when TagsList is present', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ HierarchicalSubject: ['Parent2|Child2'], TagsList: ['Parent/Child'] });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(1, {
        userId: 'user-id',
        value: 'Parent',
        parentId: undefined,
      });
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(2, {
        userId: 'user-id',
        value: 'Parent/Child',
        parentId: 'tag-parent',
      });
    });

    it('should remove existing tags', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({});

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.replaceAssetTags).toHaveBeenCalledWith('asset-id', []);
    });

    it('should not apply motion photos if asset is video', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue({
        ...assetStub.livePhotoMotionAsset,
        visibility: AssetVisibility.Timeline,
      });
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoMotionAsset.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.id);
      expect(mocks.storage.createOrOverwriteFile).not.toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ assetType: AssetType.Video, visibility: AssetVisibility.Hidden }),
      );
    });

    it('should handle an invalid Directory Item', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({
        MotionPhoto: 1,
        ContainerDirectory: [{ Foo: 100 }],
      });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
    });

    it('should extract the correct video orientation', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.video);
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamVertical2160p);
      mockReadTags({});

      await sut.handleMetadataExtraction({ id: assetStub.video.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.video.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ orientation: ExifOrientation.Rotate270CW.toString() }),
      );
    });

    it('should extract the MotionPhotoVideo tag from Samsung HEIC motion photos', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue({
        ...assetStub.livePhotoWithOriginalFileName,
        livePhotoVideoId: null,
        libraryId: null,
      });
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: assetStub.livePhotoWithOriginalFileName.fileModifiedAt,
        mtimeMs: assetStub.livePhotoWithOriginalFileName.fileModifiedAt.valueOf(),
        birthtimeMs: assetStub.livePhotoWithOriginalFileName.fileCreatedAt.valueOf(),
      } as Stats);
      mockReadTags({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MotionPhotoVideo: new BinaryField(0, ''),
        // The below two are included to ensure that the MotionPhotoVideo tag is extracted
        // instead of the EmbeddedVideoFile, since HEIC MotionPhotos include both
        EmbeddedVideoFile: new BinaryField(0, ''),
        EmbeddedVideoType: 'MotionPhoto_Data',
      });
      mocks.crypto.hashSha1.mockReturnValue(randomBytes(512));
      mocks.asset.create.mockResolvedValue(assetStub.livePhotoMotionAsset);
      mocks.crypto.randomUUID.mockReturnValue(fileStub.livePhotoMotion.uuid);
      const video = randomBytes(512);
      mocks.metadata.extractBinaryTag.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoWithOriginalFileName.id });
      expect(mocks.metadata.extractBinaryTag).toHaveBeenCalledWith(
        assetStub.livePhotoWithOriginalFileName.originalPath,
        'MotionPhotoVideo',
      );
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.livePhotoWithOriginalFileName.id);
      expect(mocks.asset.create).toHaveBeenCalledWith({
        checksum: expect.any(Buffer),
        deviceAssetId: 'NONE',
        deviceId: 'NONE',
        fileCreatedAt: assetStub.livePhotoWithOriginalFileName.fileCreatedAt,
        fileModifiedAt: assetStub.livePhotoWithOriginalFileName.fileModifiedAt,
        id: fileStub.livePhotoMotion.uuid,
        visibility: AssetVisibility.Hidden,
        libraryId: assetStub.livePhotoWithOriginalFileName.libraryId,
        localDateTime: assetStub.livePhotoWithOriginalFileName.fileCreatedAt,
        originalFileName: 'asset_1.mp4',
        originalPath: expect.stringContaining('/data/encoded-video/user-id/li/ve/live-photo-motion-asset-MP.mp4'),
        ownerId: assetStub.livePhotoWithOriginalFileName.ownerId,
        type: AssetType.Video,
      });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.ownerId, 512);
      expect(mocks.storage.createFile).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.originalPath, video);
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoWithOriginalFileName.id,
        livePhotoVideoId: fileStub.livePhotoMotion.uuid,
      });
      expect(mocks.asset.update).toHaveBeenCalledTimes(3);
      expect(mocks.job.queue).toHaveBeenCalledExactlyOnceWith({
        name: JobName.AssetEncodeVideo,
        data: { id: assetStub.livePhotoMotionAsset.id },
      });
    });

    it('should extract the EmbeddedVideo tag from Samsung JPEG motion photos', async () => {
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: assetStub.livePhotoWithOriginalFileName.fileModifiedAt,
        mtimeMs: assetStub.livePhotoWithOriginalFileName.fileModifiedAt.valueOf(),
        birthtimeMs: assetStub.livePhotoWithOriginalFileName.fileCreatedAt.valueOf(),
      } as Stats);
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue({
        ...assetStub.livePhotoWithOriginalFileName,
        livePhotoVideoId: null,
        libraryId: null,
      });
      mockReadTags({
        Directory: 'foo/bar/',
        EmbeddedVideoFile: new BinaryField(0, ''),
        EmbeddedVideoType: 'MotionPhoto_Data',
        MotionPhoto: 1,
      });
      mocks.crypto.hashSha1.mockReturnValue(randomBytes(512));
      mocks.asset.create.mockResolvedValue(assetStub.livePhotoMotionAsset);
      mocks.crypto.randomUUID.mockReturnValue(fileStub.livePhotoMotion.uuid);
      const video = randomBytes(512);
      mocks.metadata.extractBinaryTag.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoWithOriginalFileName.id });
      expect(mocks.metadata.extractBinaryTag).toHaveBeenCalledWith(
        assetStub.livePhotoWithOriginalFileName.originalPath,
        'EmbeddedVideoFile',
      );
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.livePhotoWithOriginalFileName.id);
      expect(mocks.asset.create).toHaveBeenCalledWith({
        checksum: expect.any(Buffer),
        deviceAssetId: 'NONE',
        deviceId: 'NONE',
        fileCreatedAt: assetStub.livePhotoWithOriginalFileName.fileCreatedAt,
        fileModifiedAt: assetStub.livePhotoWithOriginalFileName.fileModifiedAt,
        id: fileStub.livePhotoMotion.uuid,
        visibility: AssetVisibility.Hidden,
        libraryId: assetStub.livePhotoWithOriginalFileName.libraryId,
        localDateTime: assetStub.livePhotoWithOriginalFileName.fileCreatedAt,
        originalFileName: 'asset_1.mp4',
        originalPath: expect.stringContaining('/data/encoded-video/user-id/li/ve/live-photo-motion-asset-MP.mp4'),
        ownerId: assetStub.livePhotoWithOriginalFileName.ownerId,
        type: AssetType.Video,
      });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.ownerId, 512);
      expect(mocks.storage.createFile).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.originalPath, video);
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoWithOriginalFileName.id,
        livePhotoVideoId: fileStub.livePhotoMotion.uuid,
      });
      expect(mocks.asset.update).toHaveBeenCalledTimes(3);
      expect(mocks.job.queue).toHaveBeenCalledExactlyOnceWith({
        name: JobName.AssetEncodeVideo,
        data: { id: assetStub.livePhotoMotionAsset.id },
      });
    });

    it('should extract the motion photo video from the XMP directory entry ', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue({
        ...assetStub.livePhotoWithOriginalFileName,
        livePhotoVideoId: null,
        libraryId: null,
      });
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: assetStub.livePhotoWithOriginalFileName.fileModifiedAt,
        mtimeMs: assetStub.livePhotoWithOriginalFileName.fileModifiedAt.valueOf(),
        birthtimeMs: assetStub.livePhotoWithOriginalFileName.fileCreatedAt.valueOf(),
      } as Stats);
      mockReadTags({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      mocks.crypto.hashSha1.mockReturnValue(randomBytes(512));
      mocks.asset.create.mockResolvedValue(assetStub.livePhotoMotionAsset);
      mocks.crypto.randomUUID.mockReturnValue(fileStub.livePhotoMotion.uuid);
      const video = randomBytes(512);
      mocks.storage.readFile.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoWithOriginalFileName.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.livePhotoWithOriginalFileName.id);
      expect(mocks.storage.readFile).toHaveBeenCalledWith(
        assetStub.livePhotoWithOriginalFileName.originalPath,
        expect.any(Object),
      );
      expect(mocks.asset.create).toHaveBeenCalledWith({
        checksum: expect.any(Buffer),
        deviceAssetId: 'NONE',
        deviceId: 'NONE',
        fileCreatedAt: assetStub.livePhotoWithOriginalFileName.fileCreatedAt,
        fileModifiedAt: assetStub.livePhotoWithOriginalFileName.fileModifiedAt,
        id: fileStub.livePhotoMotion.uuid,
        visibility: AssetVisibility.Hidden,
        libraryId: assetStub.livePhotoWithOriginalFileName.libraryId,
        localDateTime: assetStub.livePhotoWithOriginalFileName.fileCreatedAt,
        originalFileName: 'asset_1.mp4',
        originalPath: expect.stringContaining('/data/encoded-video/user-id/li/ve/live-photo-motion-asset-MP.mp4'),
        ownerId: assetStub.livePhotoWithOriginalFileName.ownerId,
        type: AssetType.Video,
      });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.ownerId, 512);
      expect(mocks.storage.createFile).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.originalPath, video);
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoWithOriginalFileName.id,
        livePhotoVideoId: fileStub.livePhotoMotion.uuid,
      });
      expect(mocks.asset.update).toHaveBeenCalledTimes(3);
      expect(mocks.job.queue).toHaveBeenCalledExactlyOnceWith({
        name: JobName.AssetEncodeVideo,
        data: { id: assetStub.livePhotoMotionAsset.id },
      });
    });

    it('should delete old motion photo video assets if they do not match what is extracted', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.livePhotoWithOriginalFileName);
      mockReadTags({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      mocks.crypto.hashSha1.mockReturnValue(randomBytes(512));
      mocks.asset.create.mockImplementation(
        (asset) => Promise.resolve({ ...assetStub.livePhotoMotionAsset, ...asset }) as Promise<MapAsset>,
      );
      const video = randomBytes(512);
      mocks.storage.readFile.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoWithOriginalFileName.id });
      expect(mocks.job.queue).toHaveBeenNthCalledWith(1, {
        name: JobName.AssetDelete,
        data: { id: assetStub.livePhotoWithOriginalFileName.livePhotoVideoId, deleteOnDisk: true },
      });
    });

    it('should not create a new motion photo video asset if the hash of the extracted video matches an existing asset', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.livePhotoStillAsset);
      mockReadTags({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      mocks.crypto.hashSha1.mockReturnValue(randomBytes(512));
      mocks.asset.getByChecksum.mockResolvedValue(assetStub.livePhotoMotionAsset);
      const video = randomBytes(512);
      mocks.storage.readFile.mockResolvedValue(video);
      mocks.storage.checkFileExists.mockResolvedValue(true);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id });
      expect(mocks.asset.create).not.toHaveBeenCalled();
      expect(mocks.storage.createOrOverwriteFile).not.toHaveBeenCalled();
      // The still asset gets saved by handleMetadataExtraction, but not the video
      expect(mocks.asset.update).toHaveBeenCalledTimes(1);
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should link and hide motion video asset to still asset if the hash of the extracted video matches an existing asset', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue({
        ...assetStub.livePhotoStillAsset,
        livePhotoVideoId: null,
      });
      mockReadTags({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      mocks.crypto.hashSha1.mockReturnValue(randomBytes(512));
      mocks.asset.getByChecksum.mockResolvedValue({
        ...assetStub.livePhotoMotionAsset,
        visibility: AssetVisibility.Timeline,
      });
      const video = randomBytes(512);
      mocks.storage.readFile.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoMotionAsset.id,
        visibility: AssetVisibility.Hidden,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
      expect(mocks.asset.update).toHaveBeenCalledTimes(4);
    });

    it('should not update storage usage if motion photo is external', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue({
        ...assetStub.livePhotoStillAsset,
        livePhotoVideoId: null,
        isExternal: true,
      });
      mockReadTags({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      mocks.crypto.hashSha1.mockReturnValue(randomBytes(512));
      mocks.asset.create.mockResolvedValue(assetStub.livePhotoMotionAsset);
      const video = randomBytes(512);
      mocks.storage.readFile.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id });
      expect(mocks.user.updateUsage).not.toHaveBeenCalled();
    });

    it('should save all metadata', async () => {
      const dateForTest = new Date('1970-01-01T00:00:00.000-11:30');

      const tags: ImmichTags = {
        BitsPerSample: 1,
        ComponentBitDepth: 1,
        ImagePixelDepth: '1',
        BitDepth: 1,
        ColorBitDepth: 1,
        ColorSpace: '1',
        DateTimeOriginal: ExifDateTime.fromISO(dateForTest.toISOString()),
        ExposureTime: '100ms',
        FocalLength: 20,
        ImageDescription: 'test description',
        ISO: 100,
        LensModel: 'test lens',
        MediaGroupUUID: 'livePhoto',
        Make: 'test-factory',
        Model: "'mockel'",
        ModifyDate: ExifDateTime.fromISO(dateForTest.toISOString()),
        Orientation: 0,
        ProfileDescription: 'extensive description',
        ProjectionType: 'equirectangular',
        tz: 'UTC-11:30',
        Rating: 3,
      };
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags(tags);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.image.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith({
        assetId: assetStub.image.id,
        bitsPerSample: expect.any(Number),
        autoStackId: null,
        colorspace: tags.ColorSpace,
        dateTimeOriginal: dateForTest,
        description: tags.ImageDescription,
        exifImageHeight: null,
        exifImageWidth: null,
        exposureTime: tags.ExposureTime,
        fNumber: null,
        fileSizeInByte: 123_456,
        focalLength: tags.FocalLength,
        fps: null,
        iso: tags.ISO,
        latitude: null,
        lensModel: tags.LensModel,
        livePhotoCID: tags.MediaGroupUUID,
        longitude: null,
        make: tags.Make,
        model: tags.Model,
        modifyDate: expect.any(Date),
        orientation: tags.Orientation?.toString(),
        profileDescription: tags.ProfileDescription,
        projectionType: 'EQUIRECTANGULAR',
        timeZone: tags.tz,
        rating: tags.Rating,
        country: null,
        state: null,
        city: null,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.image.id,
          duration: null,
          fileCreatedAt: dateForTest,
          localDateTime: dateForTest,
        }),
      );
    });

    it('should extract +00:00 timezone from raw value', async () => {
      // exiftool-vendored returns "no timezone" information even though "+00:00" might be set explicitly
      // https://github.com/photostructure/exiftool-vendored.js/issues/203

      // this only tests our assumptions of exiftool-vendored, demonstrating the issue
      const someDate = '2024-09-01T00:00:00.000';
      expect(ExifDateTime.fromISO(someDate + 'Z')?.zone).toBe('UTC');
      expect(ExifDateTime.fromISO(someDate + '+00:00')?.zone).toBe('UTC'); // this is the issue, should be UTC+0
      expect(ExifDateTime.fromISO(someDate + '+04:00')?.zone).toBe('UTC+4');

      const tags: ImmichTags = {
        DateTimeOriginal: ExifDateTime.fromISO(someDate + '+00:00'),
        tz: undefined,
      };
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags(tags);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.image.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          timeZone: 'UTC+0',
        }),
      );
    });

    it('should extract duration', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.video);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        format: {
          ...probeStub.videoStreamH264.format,
          duration: 6.21,
        },
      });

      await sut.handleMetadataExtraction({ id: assetStub.video.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.video.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalled();
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.image.id,
          duration: '00:00:06.210',
        }),
      );
    });

    it('should only extract duration for videos', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        format: {
          ...probeStub.videoStreamH264.format,
          duration: 6.21,
        },
      });
      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.image.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalled();
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.image.id,
          duration: null,
        }),
      );
    });

    it('should omit duration of zero', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.video);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        format: {
          ...probeStub.videoStreamH264.format,
          duration: 0,
        },
      });

      await sut.handleMetadataExtraction({ id: assetStub.video.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.video.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalled();
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.image.id,
          duration: null,
        }),
      );
    });

    it('should a handle duration of 1 week', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.video);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        format: {
          ...probeStub.videoStreamH264.format,
          duration: 604_800,
        },
      });

      await sut.handleMetadataExtraction({ id: assetStub.video.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.video.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalled();
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.video.id,
          duration: '168:00:00.000',
        }),
      );
    });

    it('should ignore duration from exif data', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({}, { Duration: { Value: 123 } });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.update).toHaveBeenCalledWith(expect.objectContaining({ duration: null }));
    });

    it('should trim whitespace from description', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ Description: '\t \v \f \n \r' });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '',
        }),
      );

      mockReadTags({ ImageDescription: ' my\n description' });
      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'my\n description',
        }),
      );
    });

    it('should handle a numeric description', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ Description: 1000 });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '1000',
        }),
      );
    });

    it('should skip importing metadata when the feature is disabled', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.primaryImage);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: false } } });
      mockReadTags(makeFaceTags({ Name: 'Person 1' }));
      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.person.getDistinctNames).not.toHaveBeenCalled();
    });

    it('should skip importing metadata face for assets without tags.RegionInfo', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.primaryImage);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
      mockReadTags();
      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.person.getDistinctNames).not.toHaveBeenCalled();
    });

    it('should skip importing faces without name', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.primaryImage);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
      mockReadTags(makeFaceTags());
      mocks.person.getDistinctNames.mockResolvedValue([]);
      mocks.person.createAll.mockResolvedValue([]);
      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.person.createAll).not.toHaveBeenCalled();
      expect(mocks.person.refreshFaces).not.toHaveBeenCalled();
      expect(mocks.person.updateAll).not.toHaveBeenCalled();
    });

    it('should skip importing faces with empty name', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.primaryImage);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
      mockReadTags(makeFaceTags({ Name: '' }));
      mocks.person.getDistinctNames.mockResolvedValue([]);
      mocks.person.createAll.mockResolvedValue([]);
      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.person.createAll).not.toHaveBeenCalled();
      expect(mocks.person.refreshFaces).not.toHaveBeenCalled();
      expect(mocks.person.updateAll).not.toHaveBeenCalled();
    });

    it('should apply metadata face tags creating new persons', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.primaryImage);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
      mockReadTags(makeFaceTags({ Name: personStub.withName.name }));
      mocks.person.getDistinctNames.mockResolvedValue([]);
      mocks.person.createAll.mockResolvedValue([personStub.withName.id]);
      mocks.person.update.mockResolvedValue(personStub.withName);
      await sut.handleMetadataExtraction({ id: assetStub.primaryImage.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.primaryImage.id);
      expect(mocks.person.getDistinctNames).toHaveBeenCalledWith(assetStub.primaryImage.ownerId, { withHidden: true });
      expect(mocks.person.createAll).toHaveBeenCalledWith([
        expect.objectContaining({ name: personStub.withName.name }),
      ]);
      expect(mocks.person.refreshFaces).toHaveBeenCalledWith(
        [
          {
            id: 'random-uuid',
            assetId: assetStub.primaryImage.id,
            personId: 'random-uuid',
            imageHeight: 100,
            imageWidth: 1000,
            boundingBoxX1: 0,
            boundingBoxX2: 200,
            boundingBoxY1: 20,
            boundingBoxY2: 60,
            sourceType: SourceType.Exif,
          },
        ],
        [],
      );
      expect(mocks.person.updateAll).toHaveBeenCalledWith([
        { id: 'random-uuid', ownerId: 'admin-id', faceAssetId: 'random-uuid' },
      ]);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.PersonGenerateThumbnail,
          data: { id: personStub.withName.id },
        },
      ]);
    });

    it('should assign metadata face tags to existing persons', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.primaryImage);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
      mockReadTags(makeFaceTags({ Name: personStub.withName.name }));
      mocks.person.getDistinctNames.mockResolvedValue([{ id: personStub.withName.id, name: personStub.withName.name }]);
      mocks.person.createAll.mockResolvedValue([]);
      mocks.person.update.mockResolvedValue(personStub.withName);
      await sut.handleMetadataExtraction({ id: assetStub.primaryImage.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.primaryImage.id);
      expect(mocks.person.getDistinctNames).toHaveBeenCalledWith(assetStub.primaryImage.ownerId, { withHidden: true });
      expect(mocks.person.createAll).not.toHaveBeenCalled();
      expect(mocks.person.refreshFaces).toHaveBeenCalledWith(
        [
          {
            id: 'random-uuid',
            assetId: assetStub.primaryImage.id,
            personId: personStub.withName.id,
            imageHeight: 100,
            imageWidth: 1000,
            boundingBoxX1: 0,
            boundingBoxX2: 200,
            boundingBoxY1: 20,
            boundingBoxY2: 60,
            sourceType: SourceType.Exif,
          },
        ],
        [],
      );
      expect(mocks.person.updateAll).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalledWith();
    });

    describe('handleFaceTagOrientation', () => {
      const orientationTests = [
        {
          description: 'undefined',
          orientation: undefined,
          expected: { imgW: 1000, imgH: 100, x1: 0, x2: 200, y1: 20, y2: 60 },
        },
        {
          description: 'Horizontal = 1',
          orientation: ExifOrientation.Horizontal,
          expected: { imgW: 1000, imgH: 100, x1: 0, x2: 200, y1: 20, y2: 60 },
        },
        {
          description: 'MirrorHorizontal = 2',
          orientation: ExifOrientation.MirrorHorizontal,
          expected: { imgW: 1000, imgH: 100, x1: 800, x2: 1000, y1: 20, y2: 60 },
        },
        {
          description: 'Rotate180 = 3',
          orientation: ExifOrientation.Rotate180,
          expected: { imgW: 1000, imgH: 100, x1: 800, x2: 1000, y1: 40, y2: 80 },
        },
        {
          description: 'MirrorVertical = 4',
          orientation: ExifOrientation.MirrorVertical,
          expected: { imgW: 1000, imgH: 100, x1: 0, x2: 200, y1: 40, y2: 80 },
        },
        {
          description: 'MirrorHorizontalRotate270CW = 5',
          orientation: ExifOrientation.MirrorHorizontalRotate270CW,
          expected: { imgW: 100, imgH: 1000, x1: 20, x2: 60, y1: 0, y2: 200 },
        },
        {
          description: 'Rotate90CW = 6',
          orientation: ExifOrientation.Rotate90CW,
          expected: { imgW: 100, imgH: 1000, x1: 40, x2: 80, y1: 0, y2: 200 },
        },
        {
          description: 'MirrorHorizontalRotate90CW = 7',
          orientation: ExifOrientation.MirrorHorizontalRotate90CW,
          expected: { imgW: 100, imgH: 1000, x1: 40, x2: 80, y1: 800, y2: 1000 },
        },
        {
          description: 'Rotate270CW = 8',
          orientation: ExifOrientation.Rotate270CW,
          expected: { imgW: 100, imgH: 1000, x1: 20, x2: 60, y1: 800, y2: 1000 },
        },
      ];

      it.each(orientationTests)(
        'should transform RegionInfo geometry according to exif orientation $description',
        async ({ orientation, expected }) => {
          const { imgW, imgH, x1, x2, y1, y2 } = expected;

          mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.primaryImage);
          mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
          mockReadTags(makeFaceTags({ Name: personStub.withName.name }, orientation));
          mocks.person.getDistinctNames.mockResolvedValue([]);
          mocks.person.createAll.mockResolvedValue([personStub.withName.id]);
          mocks.person.update.mockResolvedValue(personStub.withName);
          await sut.handleMetadataExtraction({ id: assetStub.primaryImage.id });
          expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.primaryImage.id);
          expect(mocks.person.getDistinctNames).toHaveBeenCalledWith(assetStub.primaryImage.ownerId, {
            withHidden: true,
          });
          expect(mocks.person.createAll).toHaveBeenCalledWith([
            expect.objectContaining({ name: personStub.withName.name }),
          ]);
          expect(mocks.person.refreshFaces).toHaveBeenCalledWith(
            [
              {
                id: 'random-uuid',
                assetId: assetStub.primaryImage.id,
                personId: 'random-uuid',
                imageWidth: imgW,
                imageHeight: imgH,
                boundingBoxX1: x1,
                boundingBoxX2: x2,
                boundingBoxY1: y1,
                boundingBoxY2: y2,
                sourceType: SourceType.Exif,
              },
            ],
            [],
          );
          expect(mocks.person.updateAll).toHaveBeenCalledWith([
            { id: 'random-uuid', ownerId: 'admin-id', faceAssetId: 'random-uuid' },
          ]);
          expect(mocks.job.queueAll).toHaveBeenCalledWith([
            {
              name: JobName.PersonGenerateThumbnail,
              data: { id: personStub.withName.id },
            },
          ]);
        },
      );
    });

    it('should handle invalid modify date', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ ModifyDate: '00:00:00.000' });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          modifyDate: expect.any(Date),
        }),
      );
    });

    it('should handle invalid rating value', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ Rating: 6 });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: null,
        }),
      );
    });

    it('should handle valid rating value', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ Rating: 5 });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 5,
        }),
      );
    });

    it('should handle valid negative rating value', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags({ Rating: -1 });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: -1,
        }),
      );
    });

    it('should handle livePhotoCID not set', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.image.id);
      expect(mocks.asset.findLivePhotoMatch).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ visibility: AssetVisibility.Hidden }),
      );
      expect(mocks.album.removeAssetsFromAll).not.toHaveBeenCalled();
    });

    it('should handle not finding a match', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamVertical2160p);
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.livePhotoMotionAsset);
      mockReadTags({ ContentIdentifier: 'CID' });

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoMotionAsset.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.id);
      expect(mocks.asset.findLivePhotoMatch).toHaveBeenCalledWith({
        livePhotoCID: 'CID',
        ownerId: assetStub.livePhotoMotionAsset.ownerId,
        otherAssetId: assetStub.livePhotoMotionAsset.id,
        libraryId: null,
        type: AssetType.Image,
      });
      expect(mocks.asset.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ visibility: AssetVisibility.Hidden }),
      );
      expect(mocks.album.removeAssetsFromAll).not.toHaveBeenCalled();
    });

    it('should link photo and video', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.livePhotoStillAsset);
      mocks.asset.findLivePhotoMatch.mockResolvedValue(assetStub.livePhotoMotionAsset);
      mockReadTags({ ContentIdentifier: 'CID' });

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(assetStub.livePhotoStillAsset.id);
      expect(mocks.asset.findLivePhotoMatch).toHaveBeenCalledWith({
        livePhotoCID: 'CID',
        ownerId: assetStub.livePhotoStillAsset.ownerId,
        otherAssetId: assetStub.livePhotoStillAsset.id,
        type: AssetType.Video,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoMotionAsset.id,
        visibility: AssetVisibility.Hidden,
      });
      expect(mocks.album.removeAssetsFromAll).toHaveBeenCalledWith([assetStub.livePhotoMotionAsset.id]);
    });

    it('should notify clients on live photo link', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue({
        ...assetStub.livePhotoStillAsset,
      });
      mocks.asset.findLivePhotoMatch.mockResolvedValue(assetStub.livePhotoMotionAsset);
      mockReadTags({ ContentIdentifier: 'CID' });

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id });

      expect(mocks.event.emit).toHaveBeenCalledWith('AssetHide', {
        userId: assetStub.livePhotoMotionAsset.ownerId,
        assetId: assetStub.livePhotoMotionAsset.id,
      });
    });

    it('should search by libraryId', async () => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue({
        ...assetStub.livePhotoStillAsset,
        libraryId: 'library-id',
      });
      mocks.asset.findLivePhotoMatch.mockResolvedValue(assetStub.livePhotoMotionAsset);
      mockReadTags({ ContentIdentifier: 'CID' });

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id });

      expect(mocks.event.emit).toHaveBeenCalledWith('AssetMetadataExtracted', {
        assetId: assetStub.livePhotoStillAsset.id,
        userId: assetStub.livePhotoStillAsset.ownerId,
      });
      expect(mocks.asset.findLivePhotoMatch).toHaveBeenCalledWith({
        ownerId: 'user-id',
        otherAssetId: 'live-photo-still-asset',
        livePhotoCID: 'CID',
        libraryId: 'library-id',
        type: 'VIDEO',
      });
    });

    it.each([
      {
        exif: {
          Make: '1',
          Model: '2',
          Device: { Manufacturer: '3', ModelName: '4' },
          AndroidMake: '4',
          AndroidModel: '5',
        },
        expected: { make: '1', model: '2' },
      },
      {
        exif: { Device: { Manufacturer: '1', ModelName: '2' }, AndroidMake: '3', AndroidModel: '4' },
        expected: { make: '1', model: '2' },
      },
      { exif: { AndroidMake: '1', AndroidModel: '2' }, expected: { make: '1', model: '2' } },
    ])('should read camera make and model $exif -> $expected', async ({ exif, expected }) => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags(exif);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(expect.objectContaining(expected));
    });

    it.each([
      { exif: {}, expected: null },
      { exif: { LensID: '1', LensSpec: '2', LensType: '3', LensModel: '4' }, expected: '1' },
      { exif: { LensSpec: '2', LensType: '3', LensModel: '4' }, expected: '3' },
      { exif: { LensSpec: '2', LensModel: '4' }, expected: '2' },
      { exif: { LensModel: '4' }, expected: '4' },
      { exif: { LensID: '----' }, expected: null },
      { exif: { LensID: 'Unknown (0 ff ff)' }, expected: null },
      {
        exif: { LensID: 'Unknown (E1 40 19 36 2C 35 DF 0E) Tamron 10-24mm f/3.5-4.5 Di II VC HLD (B023) ?' },
        expected: null,
      },
      { exif: { LensID: ' Unknown 6-30mm' }, expected: null },
      { exif: { LensID: '' }, expected: null },
    ])('should read camera lens information $exif -> $expected', async ({ exif, expected }) => {
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(assetStub.image);
      mockReadTags(exif);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          lensModel: expected,
        }),
      );
    });
  });

  describe('handleQueueSidecar', () => {
    it('should queue assets with sidecar files', async () => {
      mocks.assetJob.streamForSidecar.mockReturnValue(makeStream([assetStub.image]));

      await sut.handleQueueSidecar({ force: true });
      expect(mocks.assetJob.streamForSidecar).toHaveBeenCalledWith(true);

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.SidecarCheck,
          data: { id: assetStub.sidecar.id },
        },
      ]);
    });

    it('should queue assets without sidecar files', async () => {
      mocks.assetJob.streamForSidecar.mockReturnValue(makeStream([assetStub.image]));

      await sut.handleQueueSidecar({ force: false });

      expect(mocks.assetJob.streamForSidecar).toHaveBeenCalledWith(false);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.SidecarCheck,
          data: { id: assetStub.image.id },
        },
      ]);
    });
  });

  describe('handleSidecarCheck', () => {
    it('should do nothing if asset could not be found', async () => {
      mocks.assetJob.getForSidecarCheckJob.mockResolvedValue(void 0);

      await expect(sut.handleSidecarCheck({ id: assetStub.image.id })).resolves.toBeUndefined();

      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should detect a new sidecar at .jpg.xmp', async () => {
      const asset = forSidecarJob({ originalPath: '/path/to/IMG_123.jpg' });

      mocks.assetJob.getForSidecarCheckJob.mockResolvedValue(asset);
      mocks.storage.checkFileExists.mockResolvedValueOnce(true);

      await expect(sut.handleSidecarCheck({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.asset.update).toHaveBeenCalledWith({ id: asset.id, sidecarPath: `/path/to/IMG_123.jpg.xmp` });
    });

    it('should detect a new sidecar at .xmp', async () => {
      const asset = forSidecarJob({ originalPath: '/path/to/IMG_123.jpg' });

      mocks.assetJob.getForSidecarCheckJob.mockResolvedValue(asset);
      mocks.storage.checkFileExists.mockResolvedValueOnce(false);
      mocks.storage.checkFileExists.mockResolvedValueOnce(true);

      await expect(sut.handleSidecarCheck({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.asset.update).toHaveBeenCalledWith({ id: asset.id, sidecarPath: '/path/to/IMG_123.xmp' });
    });

    it('should unset sidecar path if file does not exist anymore', async () => {
      const asset = forSidecarJob({ originalPath: '/path/to/IMG_123.jpg', sidecarPath: '/path/to/IMG_123.jpg.xmp' });
      mocks.assetJob.getForSidecarCheckJob.mockResolvedValue(asset);
      mocks.storage.checkFileExists.mockResolvedValue(false);

      await expect(sut.handleSidecarCheck({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.asset.update).toHaveBeenCalledWith({ id: asset.id, sidecarPath: null });
    });

    it('should do nothing if the sidecar file still exists', async () => {
      const asset = forSidecarJob({ originalPath: '/path/to/IMG_123.jpg', sidecarPath: '/path/to/IMG_123.jpg' });

      mocks.assetJob.getForSidecarCheckJob.mockResolvedValue(asset);
      mocks.storage.checkFileExists.mockResolvedValueOnce(true);

      await expect(sut.handleSidecarCheck({ id: asset.id })).resolves.toBe(JobStatus.Skipped);

      expect(mocks.asset.update).not.toHaveBeenCalled();
    });
  });

  describe('handleSidecarWrite', () => {
    it('should skip assets that do not exist anymore', async () => {
      mocks.assetJob.getForSidecarWriteJob.mockResolvedValue(void 0);
      await expect(sut.handleSidecarWrite({ id: 'asset-123' })).resolves.toBe(JobStatus.Failed);
      expect(mocks.metadata.writeTags).not.toHaveBeenCalled();
    });

    it('should skip jobs with no metadata', async () => {
      const asset = factory.jobAssets.sidecarWrite();
      mocks.assetJob.getForSidecarWriteJob.mockResolvedValue(asset);
      await expect(sut.handleSidecarWrite({ id: asset.id })).resolves.toBe(JobStatus.Skipped);
      expect(mocks.metadata.writeTags).not.toHaveBeenCalled();
    });

    it('should write tags', async () => {
      const asset = factory.jobAssets.sidecarWrite();
      const description = 'this is a description';
      const gps = 12;
      const date = '2023-11-22T04:56:12.196Z';

      mocks.assetJob.getForSidecarWriteJob.mockResolvedValue(asset);
      await expect(
        sut.handleSidecarWrite({
          id: asset.id,
          description,
          latitude: gps,
          longitude: gps,
          dateTimeOriginal: date,
        }),
      ).resolves.toBe(JobStatus.Success);
      expect(mocks.metadata.writeTags).toHaveBeenCalledWith(asset.sidecarPath, {
        Description: description,
        ImageDescription: description,
        DateTimeOriginal: date,
        GPSLatitude: gps,
        GPSLongitude: gps,
      });
    });
  });

  describe('firstDateTime', () => {
    it('should ignore date-only tags like GPSDateStamp', () => {
      const tags = {
        GPSDateStamp: '2023:08:08', // Date-only tag, should be ignored
        SonyDateTime2: '2023:07:07 07:00:00',
      };

      const result = firstDateTime(tags);
      expect(result?.tag).toBe('SonyDateTime2');
      expect(result?.dateTime?.toDate()?.toISOString()).toBe('2023-07-07T07:00:00.000Z');
    });

    it('should respect full priority order with all date tags present', () => {
      const tags = {
        // SubSec and standard EXIF date tags
        SubSecDateTimeOriginal: '2023:01:01 01:00:00',
        SubSecCreateDate: '2023:02:02 02:00:00',
        SubSecMediaCreateDate: '2023:03:03 03:00:00',
        DateTimeOriginal: '2023:04:04 04:00:00',
        CreateDate: '2023:05:05 05:00:00',
        MediaCreateDate: '2023:06:06 06:00:00',
        CreationDate: '2023:07:07 07:00:00',
        DateTimeCreated: '2023:08:08 08:00:00',

        // Additional date tags
        TimeCreated: '2023:09:09 09:00:00',
        GPSDateTime: '2023:10:10 10:00:00',
        DateTimeUTC: '2023:11:11 11:00:00',
        GPSDateStamp: '2023:12:12', // Date-only tag, should be ignored
        SonyDateTime2: '2023:13:13 13:00:00',

        // Non-standard tag
        SourceImageCreateTime: '2023:14:14 14:00:00',
      };

      const result = firstDateTime(tags);
      // Should use SubSecDateTimeOriginal as it has highest priority
      expect(result?.tag).toBe('SubSecDateTimeOriginal');
      expect(result?.dateTime?.toDate()?.toISOString()).toBe('2023-01-01T01:00:00.000Z');
    });

    it('should handle missing SubSec tags and use available date tags', () => {
      const tags = {
        // Standard date tags
        CreationDate: '2023:07:07 07:00:00',
        DateTimeCreated: '2023:08:08 08:00:00',

        // Additional date tags
        TimeCreated: '2023:09:09 09:00:00',
        GPSDateTime: '2023:10:10 10:00:00',
        DateTimeUTC: '2023:11:11 11:00:00',
        GPSDateStamp: '2023:12:12', // Date-only tag, should be ignored
        SonyDateTime2: '2023:13:13 13:00:00',
      };

      const result = firstDateTime(tags);
      // Should use CreationDate when available
      expect(result?.tag).toBe('CreationDate');
      expect(result?.dateTime?.toDate()?.toISOString()).toBe('2023-07-07T07:00:00.000Z');
    });

    it('should handle invalid date formats gracefully', () => {
      const tags = {
        TimeCreated: 'invalid-date',
        GPSDateTime: '2023:10:10 10:00:00',
        DateTimeUTC: 'also-invalid',
        SonyDateTime2: '2023:13:13 13:00:00',
      };

      const result = firstDateTime(tags);
      // Should skip invalid dates and use the first valid one
      expect(result?.tag).toBe('GPSDateTime');
      expect(result?.dateTime?.toDate()?.toISOString()).toBe('2023-10-10T10:00:00.000Z');
    });

    it('should prefer CreationDate over CreateDate', () => {
      const tags = {
        CreationDate: '2025:05:24 18:26:20+02:00',
        CreateDate: '2025:08:27 08:45:40',
      };

      const result = firstDateTime(tags);
      expect(result?.tag).toBe('CreationDate');
      expect(result?.dateTime?.toDate()?.toISOString()).toBe('2025-05-24T16:26:20.000Z');
    });
  });
});

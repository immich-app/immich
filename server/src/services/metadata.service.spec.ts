import { BinaryField, ExifDateTime } from 'exiftool-vendored';
import { DateTime } from 'luxon';
import { randomBytes } from 'node:crypto';
import { Stats } from 'node:fs';
import { defaults } from 'src/config';
import {
  AssetFileType,
  AssetType,
  AssetVisibility,
  ExifOrientation,
  ImmichWorker,
  JobName,
  JobStatus,
  SourceType,
} from 'src/enum';
import { StorageBackend } from 'src/interfaces/storage-backend.interface';
import { ImmichTags } from 'src/repositories/metadata.repository';
import { firstDateTime, MetadataService } from 'src/services/metadata.service';
import { StorageService } from 'src/services/storage.service';
import { AssetFactory } from 'test/factories/asset.factory';
import { PersonFactory } from 'test/factories/person.factory';
import { probeStub } from 'test/fixtures/media.stub';
import { tagStub } from 'test/fixtures/tag.stub';
import { factory } from 'test/small.factory';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

const forSidecarJob = (
  asset: {
    id?: string;
    originalPath?: string;
    files?: { id: string; type: AssetFileType; path: string; isEdited: boolean }[];
  } = {},
) => {
  return {
    id: factory.uuid(),
    originalPath: '/path/to/IMG_123.jpg',
    files: [],
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

    it('should throw and log error when init fails', async () => {
      mocks.job.pause.mockResolvedValue();
      mocks.map.init.mockRejectedValue(new Error('geodata init failed'));

      await expect(sut.onBootstrap()).rejects.toThrow('Metadata service init failed');
      expect(mocks.logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Unable to initialize reverse geocoding'),
        expect.anything(),
      );
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
      const asset = AssetFactory.create();
      mocks.assetJob.streamForMetadataExtraction.mockReturnValue(makeStream([asset]));

      await expect(sut.handleQueueMetadataExtraction({ force: false })).resolves.toBe(JobStatus.Success);
      expect(mocks.assetJob.streamForMetadataExtraction).toHaveBeenCalledWith(false);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetExtractMetadata,
          data: { id: asset.id },
        },
      ]);
    });

    it('should queue metadata extraction for all assets', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForMetadataExtraction.mockReturnValue(makeStream([asset]));

      await expect(sut.handleQueueMetadataExtraction({ force: true })).resolves.toBe(JobStatus.Success);
      expect(mocks.assetJob.streamForMetadataExtraction).toHaveBeenCalledWith(true);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetExtractMetadata,
          data: { id: asset.id },
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

      await sut.handleMetadataExtraction({ id: 'non-existent' });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith('non-existent');
      expect(mocks.asset.upsertExif).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should handle a date in a sidecar file', async () => {
      const originalDate = new Date('2023-11-21T16:13:17.517Z');
      const sidecarDate = new Date('2022-01-01T00:00:00.000Z');
      const asset = AssetFactory.from().file({ type: AssetFileType.Sidecar }).build();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ CreationDate: originalDate.toISOString() }, { CreationDate: sidecarDate.toISOString() });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(expect.objectContaining({ dateTimeOriginal: sidecarDate }), {
        lockedPropertiesBehavior: 'skip',
      });
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: asset.id,
          duration: null,
          fileCreatedAt: sidecarDate,
          localDateTime: sidecarDate,
        }),
      );
    });

    it('should take the file modification date when missing exif and earlier than creation date', async () => {
      const fileCreatedAt = new Date('2022-01-01T00:00:00.000Z');
      const fileModifiedAt = new Date('2021-01-01T00:00:00.000Z');
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: fileModifiedAt,
        mtimeMs: fileModifiedAt.valueOf(),
        birthtimeMs: fileCreatedAt.valueOf(),
      } as Stats);
      mockReadTags();

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ dateTimeOriginal: fileModifiedAt }),
        { lockedPropertiesBehavior: 'skip' },
      );
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: asset.id,
        duration: null,
        fileCreatedAt: fileModifiedAt,
        fileModifiedAt,
        localDateTime: fileModifiedAt,
        width: null,
        height: null,
      });
    });

    it('should take the file creation date when missing exif and earlier than modification date', async () => {
      const fileCreatedAt = new Date('2021-01-01T00:00:00.000Z');
      const fileModifiedAt = new Date('2022-01-01T00:00:00.000Z');
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: fileModifiedAt,
        mtimeMs: fileModifiedAt.valueOf(),
        birthtimeMs: fileCreatedAt.valueOf(),
      } as Stats);
      mockReadTags();

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ dateTimeOriginal: fileCreatedAt }),
        { lockedPropertiesBehavior: 'skip' },
      );
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: asset.id,
        duration: null,
        fileCreatedAt,
        fileModifiedAt,
        localDateTime: fileCreatedAt,
        width: null,
        height: null,
      });
    });

    it('should determine dateTimeOriginal regardless of the server time zone', async () => {
      process.env.TZ = 'America/Los_Angeles';
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ DateTimeOriginal: '2022:01:01 00:00:00' });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          dateTimeOriginal: new Date('2022-01-01T00:00:00.000Z'),
        }),
        { lockedPropertiesBehavior: 'skip' },
      );

      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          localDateTime: new Date('2022-01-01T00:00:00.000Z'),
        }),
      );
    });

    it('should handle lists of numbers', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: asset.fileModifiedAt,
        mtimeMs: asset.fileModifiedAt.valueOf(),
        birthtimeMs: asset.fileCreatedAt.valueOf(),
      } as Stats);
      mockReadTags({ ISO: [160] });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(expect.objectContaining({ iso: 160 }), {
        lockedPropertiesBehavior: 'skip',
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: asset.id,
        duration: null,
        fileCreatedAt: asset.fileCreatedAt,
        fileModifiedAt: asset.fileModifiedAt,
        localDateTime: asset.fileCreatedAt,
        width: null,
        height: null,
      });
    });

    it('should not delete latituide and longitude without reverse geocode', async () => {
      // regression test for issue 17511
      const asset = AssetFactory.from().exif().build();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ reverseGeocoding: { enabled: false } });
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: asset.fileModifiedAt,
        mtimeMs: asset.fileModifiedAt.valueOf(),
        birthtimeMs: asset.fileCreatedAt.valueOf(),
      } as Stats);
      mockReadTags({
        GPSLatitude: asset.exifInfo.latitude!,
        GPSLongitude: asset.exifInfo.longitude!,
      });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ city: null, state: null, country: null }),
        { lockedPropertiesBehavior: 'skip' },
      );
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: asset.id,
        duration: null,
        fileCreatedAt: asset.fileCreatedAt,
        fileModifiedAt: asset.fileModifiedAt,
        localDateTime: asset.localDateTime,
        width: null,
        height: null,
      });
    });

    it('should apply reverse geocoding', async () => {
      const asset = AssetFactory.from().exif({ latitude: 10, longitude: 20 }).build();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ reverseGeocoding: { enabled: true } });
      mocks.map.reverseGeocode.mockResolvedValue({ city: 'City', state: 'State', country: 'Country' });
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: asset.fileModifiedAt,
        mtimeMs: asset.fileModifiedAt.valueOf(),
        birthtimeMs: asset.fileCreatedAt.valueOf(),
      } as Stats);
      mockReadTags({ GPSLatitude: 10, GPSLongitude: 20 });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ city: 'City', state: 'State', country: 'Country' }),
        { lockedPropertiesBehavior: 'skip' },
      );
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: asset.id,
        duration: null,
        fileCreatedAt: asset.fileCreatedAt,
        fileModifiedAt: asset.fileModifiedAt,
        localDateTime: asset.localDateTime,
        width: null,
        height: null,
      });
    });

    it('should discard latitude and longitude on null island', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({
        GPSLatitude: 0,
        GPSLongitude: 0,
      });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: null, longitude: null }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should extract tags from TagsList', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.asset.getForMetadataExtractionTags.mockResolvedValue({ tags: ['Parent'] });
      mockReadTags({ TagsList: ['Parent'] });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: asset.ownerId, value: 'Parent', parent: undefined });
    });

    it('should extract hierarchy from TagsList', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.asset.getForMetadataExtractionTags.mockResolvedValue({ tags: ['Parent/Child'] });
      mockReadTags({ TagsList: ['Parent/Child'] });
      mocks.tag.upsertValue.mockResolvedValueOnce(tagStub.parentUpsert);
      mocks.tag.upsertValue.mockResolvedValueOnce(tagStub.childUpsert);

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(1, {
        userId: asset.ownerId,
        value: 'Parent',
        parentId: undefined,
      });
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(2, {
        userId: asset.ownerId,
        value: 'Parent/Child',
        parentId: 'tag-parent',
      });
    });

    it('should extract tags from Keywords as a string', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.asset.getForMetadataExtractionTags.mockResolvedValue({ tags: ['Parent'] });
      mockReadTags({ Keywords: 'Parent' });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: asset.ownerId, value: 'Parent', parent: undefined });
    });

    it('should extract tags from Keywords as a list', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.asset.getForMetadataExtractionTags.mockResolvedValue({ tags: ['Parent'] });
      mockReadTags({ Keywords: ['Parent'] });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: asset.ownerId, value: 'Parent', parent: undefined });
    });

    it('should extract tags from Keywords as a list with a number', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.asset.getForMetadataExtractionTags.mockResolvedValue({ tags: ['Parent', '2024'] });
      mockReadTags({ Keywords: ['Parent', 2024] });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: asset.ownerId, value: 'Parent', parent: undefined });
      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: asset.ownerId, value: '2024', parent: undefined });
    });

    it('should extract hierarchal tags from Keywords', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.asset.getForMetadataExtractionTags.mockResolvedValue({ tags: ['Parent/Child'] });
      mockReadTags({ Keywords: 'Parent/Child' });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(1, {
        userId: asset.ownerId,
        value: 'Parent',
        parentId: undefined,
      });
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(2, {
        userId: asset.ownerId,
        value: 'Parent/Child',
        parentId: 'tag-parent',
      });
    });

    it('should ignore Keywords when TagsList is present', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.asset.getForMetadataExtractionTags.mockResolvedValue({ tags: ['Parent/Child', 'Child'] });
      mockReadTags({ Keywords: 'Child', TagsList: ['Parent/Child'] });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(1, {
        userId: asset.ownerId,
        value: 'Parent',
        parentId: undefined,
      });
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(2, {
        userId: asset.ownerId,
        value: 'Parent/Child',
        parentId: 'tag-parent',
      });
    });

    it('should extract hierarchy from HierarchicalSubject', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.asset.getForMetadataExtractionTags.mockResolvedValue({ tags: ['Parent/Child', 'TagA'] });
      mockReadTags({ HierarchicalSubject: ['Parent|Child', 'TagA'] });
      mocks.tag.upsertValue.mockResolvedValueOnce(tagStub.parentUpsert);
      mocks.tag.upsertValue.mockResolvedValueOnce(tagStub.childUpsert);

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(1, {
        userId: asset.ownerId,
        value: 'Parent',
        parentId: undefined,
      });
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(2, {
        userId: asset.ownerId,
        value: 'Parent/Child',
        parentId: 'tag-parent',
      });
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(3, {
        userId: asset.ownerId,
        value: 'TagA',
        parent: undefined,
      });
    });

    it('should extract tags from HierarchicalSubject as a list with a number', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.asset.getForMetadataExtractionTags.mockResolvedValue({ tags: ['Parent', '2024'] });
      mockReadTags({ HierarchicalSubject: ['Parent', 2024] });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: asset.ownerId, value: 'Parent', parent: undefined });
      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: asset.ownerId, value: '2024', parent: undefined });
    });

    it('should extract ignore / characters in a HierarchicalSubject tag', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.asset.getForMetadataExtractionTags.mockResolvedValue({ tags: ['Mom|Dad'] });
      mockReadTags({ HierarchicalSubject: ['Mom/Dad'] });
      mocks.tag.upsertValue.mockResolvedValueOnce(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({
        userId: asset.ownerId,
        value: 'Mom|Dad',
        parent: undefined,
      });
    });

    it('should ignore HierarchicalSubject when TagsList is present', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.asset.getForMetadataExtractionTags.mockResolvedValue({ tags: ['Parent/Child', 'Parent2/Child2'] });
      mockReadTags({ HierarchicalSubject: ['Parent2|Child2'], TagsList: ['Parent/Child'] });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(1, {
        userId: asset.ownerId,
        value: 'Parent',
        parentId: undefined,
      });
      expect(mocks.tag.upsertValue).toHaveBeenNthCalledWith(2, {
        userId: asset.ownerId,
        value: 'Parent/Child',
        parentId: 'tag-parent',
      });
    });

    it('should remove existing tags', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({});

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.tag.replaceAssetTags).toHaveBeenCalledWith(asset.id, []);
    });

    it('should not apply motion photos if asset is video', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.storage.createOrOverwriteFile).not.toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ assetType: AssetType.Video, visibility: AssetVisibility.Hidden }),
      );
    });

    it('should handle an invalid Directory Item', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({
        MotionPhoto: 1,
        ContainerDirectory: [{ Foo: 100 }],
      });

      await sut.handleMetadataExtraction({ id: asset.id });
    });

    it('should extract the correct video orientation', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamVertical2160p);
      mockReadTags({});

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ orientation: ExifOrientation.Rotate270CW.toString() }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should extract Rotate90CW orientation for video with rotation -90', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        videoStreams: [{ ...probeStub.videoStreamH264.videoStreams[0], rotation: -90 }],
      });
      mockReadTags({});

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ orientation: ExifOrientation.Rotate90CW.toString() }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should extract Horizontal orientation for video with rotation 0', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        videoStreams: [{ ...probeStub.videoStreamH264.videoStreams[0], rotation: 0 }],
      });
      mockReadTags({});

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ orientation: ExifOrientation.Horizontal.toString() }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should extract Rotate180 orientation for video with rotation 180', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        videoStreams: [{ ...probeStub.videoStreamH264.videoStreams[0], rotation: 180 }],
      });
      mockReadTags({});

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ orientation: ExifOrientation.Rotate180.toString() }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should not set orientation for video with unsupported rotation value', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        videoStreams: [{ ...probeStub.videoStreamH264.videoStreams[0], rotation: 45 }],
      });
      mockReadTags({});

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ orientation: null }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should extract video dimensions from probe', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        videoStreams: [{ ...probeStub.videoStreamH264.videoStreams[0], width: 3840, height: 2160 }],
      });
      mockReadTags({});

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ exifImageWidth: 3840, exifImageHeight: 2160 }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should handle video with no video streams', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.media.probe.mockResolvedValue(probeStub.noVideoStreams);
      mockReadTags({});

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ orientation: null }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should extract the MotionPhotoVideo tag from Samsung HEIC motion photos', async () => {
      const asset = AssetFactory.create();
      const motionAsset = AssetFactory.create({ type: AssetType.Video, visibility: AssetVisibility.Hidden });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: asset.fileModifiedAt,
        mtimeMs: asset.fileModifiedAt.valueOf(),
        birthtimeMs: asset.fileCreatedAt.valueOf(),
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
      mocks.asset.create.mockResolvedValue(motionAsset);
      mocks.crypto.randomUUID.mockReturnValue(motionAsset.id);
      const video = randomBytes(512);
      mocks.metadata.extractBinaryTag.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.metadata.extractBinaryTag).toHaveBeenCalledWith(asset.originalPath, 'MotionPhotoVideo');
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.create).toHaveBeenCalledWith({
        checksum: expect.any(Buffer),
        deviceAssetId: 'NONE',
        deviceId: 'NONE',
        fileCreatedAt: asset.fileCreatedAt,
        fileModifiedAt: asset.fileModifiedAt,
        id: motionAsset.id,
        visibility: AssetVisibility.Hidden,
        libraryId: asset.libraryId,
        localDateTime: asset.fileCreatedAt,
        originalFileName: `IMG_${asset.id}.mp4`,
        originalPath: expect.stringContaining(`${motionAsset.id}-MP.mp4`),
        ownerId: asset.ownerId,
        type: AssetType.Video,
      });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(asset.ownerId, 512);
      expect(mocks.storage.createFile).toHaveBeenCalledWith(motionAsset.originalPath, video);
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: asset.id,
        livePhotoVideoId: motionAsset.id,
      });
      expect(mocks.asset.update).toHaveBeenCalledTimes(3);
      expect(mocks.job.queue).toHaveBeenCalledExactlyOnceWith({
        name: JobName.AssetEncodeVideo,
        data: { id: motionAsset.id },
      });
    });

    it('should extract the EmbeddedVideo tag from Samsung JPEG motion photos', async () => {
      const asset = AssetFactory.create();
      const motionAsset = AssetFactory.create({ type: AssetType.Video, visibility: AssetVisibility.Hidden });
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: asset.fileModifiedAt,
        mtimeMs: asset.fileModifiedAt.valueOf(),
        birthtimeMs: asset.fileCreatedAt.valueOf(),
      } as Stats);
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({
        Directory: 'foo/bar/',
        EmbeddedVideoFile: new BinaryField(0, ''),
        EmbeddedVideoType: 'MotionPhoto_Data',
        MotionPhoto: 1,
      });
      mocks.crypto.hashSha1.mockReturnValue(randomBytes(512));
      mocks.asset.create.mockResolvedValue(motionAsset);
      mocks.crypto.randomUUID.mockReturnValue(motionAsset.id);
      const video = randomBytes(512);
      mocks.metadata.extractBinaryTag.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.metadata.extractBinaryTag).toHaveBeenCalledWith(asset.originalPath, 'EmbeddedVideoFile');
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.create).toHaveBeenCalledWith({
        checksum: expect.any(Buffer),
        deviceAssetId: 'NONE',
        deviceId: 'NONE',
        fileCreatedAt: asset.fileCreatedAt,
        fileModifiedAt: asset.fileModifiedAt,
        id: motionAsset.id,
        visibility: AssetVisibility.Hidden,
        libraryId: asset.libraryId,
        localDateTime: asset.fileCreatedAt,
        originalFileName: `IMG_${asset.id}.mp4`,
        originalPath: expect.stringContaining(`${motionAsset.id}-MP.mp4`),
        ownerId: asset.ownerId,
        type: AssetType.Video,
      });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(asset.ownerId, 512);
      expect(mocks.storage.createFile).toHaveBeenCalledWith(motionAsset.originalPath, video);
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: asset.id,
        livePhotoVideoId: motionAsset.id,
      });
      expect(mocks.asset.update).toHaveBeenCalledTimes(3);
      expect(mocks.job.queue).toHaveBeenCalledExactlyOnceWith({
        name: JobName.AssetEncodeVideo,
        data: { id: motionAsset.id },
      });
    });

    it('should extract the motion photo video from the XMP directory entry ', async () => {
      const asset = AssetFactory.create();
      const motionAsset = AssetFactory.create({ type: AssetType.Video, visibility: AssetVisibility.Hidden });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.storage.stat.mockResolvedValue({
        size: 123_456,
        mtime: asset.fileModifiedAt,
        mtimeMs: asset.fileModifiedAt.valueOf(),
        birthtimeMs: asset.fileCreatedAt.valueOf(),
      } as Stats);
      mockReadTags({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      mocks.crypto.hashSha1.mockReturnValue(randomBytes(512));
      mocks.asset.create.mockResolvedValue(motionAsset);
      mocks.crypto.randomUUID.mockReturnValue(motionAsset.id);
      const video = randomBytes(512);
      mocks.storage.readFile.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.storage.readFile).toHaveBeenCalledWith(asset.originalPath, expect.any(Object));
      expect(mocks.asset.create).toHaveBeenCalledWith({
        checksum: expect.any(Buffer),
        deviceAssetId: 'NONE',
        deviceId: 'NONE',
        fileCreatedAt: asset.fileCreatedAt,
        fileModifiedAt: asset.fileModifiedAt,
        id: motionAsset.id,
        visibility: AssetVisibility.Hidden,
        libraryId: asset.libraryId,
        localDateTime: asset.fileCreatedAt,
        originalFileName: `IMG_${asset.id}.mp4`,
        originalPath: expect.stringContaining(`${motionAsset.id}-MP.mp4`),
        ownerId: asset.ownerId,
        type: AssetType.Video,
      });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(asset.ownerId, 512);
      expect(mocks.storage.createFile).toHaveBeenCalledWith(motionAsset.originalPath, video);
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: asset.id,
        livePhotoVideoId: motionAsset.id,
      });
      expect(mocks.asset.update).toHaveBeenCalledTimes(3);
      expect(mocks.job.queue).toHaveBeenCalledExactlyOnceWith({
        name: JobName.AssetEncodeVideo,
        data: { id: motionAsset.id },
      });
    });

    it('should delete old motion photo video assets if they do not match what is extracted', async () => {
      const motionAsset = AssetFactory.create({ type: AssetType.Video, visibility: AssetVisibility.Hidden });
      const asset = AssetFactory.create({ livePhotoVideoId: motionAsset.id });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      mocks.crypto.hashSha1.mockReturnValue(randomBytes(512));
      mocks.asset.create.mockResolvedValue(AssetFactory.create({ type: AssetType.Video }));
      const video = randomBytes(512);
      mocks.storage.readFile.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.job.queue).toHaveBeenNthCalledWith(1, {
        name: JobName.AssetDelete,
        data: { id: asset.livePhotoVideoId, deleteOnDisk: true },
      });
    });

    it('should not create a new motion photo video asset if the hash of the extracted video matches an existing asset', async () => {
      const motionAsset = AssetFactory.create({ type: AssetType.Video, visibility: AssetVisibility.Hidden });
      const asset = AssetFactory.create({ livePhotoVideoId: motionAsset.id });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      mocks.crypto.hashSha1.mockReturnValue(randomBytes(512));
      mocks.asset.getByChecksum.mockResolvedValue(motionAsset);
      const video = randomBytes(512);
      mocks.storage.readFile.mockResolvedValue(video);
      mocks.storage.checkFileExists.mockResolvedValue(true);

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.create).not.toHaveBeenCalled();
      expect(mocks.storage.createOrOverwriteFile).not.toHaveBeenCalled();
      // The still asset gets saved by handleMetadataExtraction, but not the video
      expect(mocks.asset.update).toHaveBeenCalledTimes(1);
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should link and hide motion video asset to still asset if the hash of the extracted video matches an existing asset', async () => {
      const motionAsset = AssetFactory.create({ type: AssetType.Video });
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      mocks.crypto.hashSha1.mockReturnValue(randomBytes(512));
      mocks.asset.getByChecksum.mockResolvedValue(motionAsset);
      const video = randomBytes(512);
      mocks.storage.readFile.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: motionAsset.id,
        visibility: AssetVisibility.Hidden,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: asset.id,
        livePhotoVideoId: motionAsset.id,
      });
      expect(mocks.asset.update).toHaveBeenCalledTimes(4);
    });

    it('should not update storage usage if motion photo is external', async () => {
      const motionAsset = AssetFactory.create({ type: AssetType.Video, visibility: AssetVisibility.Hidden });
      const asset = AssetFactory.create({ isExternal: true });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      mocks.crypto.hashSha1.mockReturnValue(randomBytes(512));
      mocks.asset.create.mockResolvedValue(motionAsset);
      const video = randomBytes(512);
      mocks.storage.readFile.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.user.updateUsage).not.toHaveBeenCalled();
    });

    it('should save all metadata', async () => {
      const dateForTest = new Date('1970-01-01T00:00:00.000-11:30');
      const asset = AssetFactory.create();

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
        zone: 'UTC-11:30',
        TagsList: ['parent/child'],
        Rating: 3,
      };

      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags(tags);

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        {
          assetId: asset.id,
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
          timeZone: tags.zone,
          rating: tags.Rating,
          country: null,
          state: null,
          city: null,
          tags: ['parent/child'],
        },
        { lockedPropertiesBehavior: 'skip' },
      );
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: asset.id,
          duration: null,
          fileCreatedAt: dateForTest,
          localDateTime: DateTime.fromISO('1970-01-01T00:00:00.000Z').toJSDate(),
        }),
      );
    });

    it('should extract +00:00 timezone from raw value', async () => {
      // exiftool-vendored returns "no timezone" information even though "+00:00" might be set explicitly
      // https://github.com/photostructure/exiftool-vendored.js/issues/203

      // this only tests our assumptions of exiftool-vendored, demonstrating the issue
      const asset = AssetFactory.create();
      const someDate = '2024-09-01T00:00:00.000';
      expect(ExifDateTime.fromISO(someDate + 'Z')?.zone).toBe('UTC');
      expect(ExifDateTime.fromISO(someDate + '+00:00')?.zone).toBe('UTC'); // this is the issue, should be UTC+0
      expect(ExifDateTime.fromISO(someDate + '+04:00')?.zone).toBe('UTC+4');

      const tags: ImmichTags = {
        DateTimeOriginal: ExifDateTime.fromISO(someDate + '+00:00'),
        zone: undefined,
      };
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags(tags);

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          timeZone: 'UTC+0',
        }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should extract duration', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        format: {
          ...probeStub.videoStreamH264.format,
          duration: 6.21,
        },
      });

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalled();
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: asset.id,
          duration: '00:00:06.210',
        }),
      );
    });

    it('should only extract duration for videos', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        format: {
          ...probeStub.videoStreamH264.format,
          duration: 6.21,
        },
      });
      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalled();
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: asset.id,
          duration: null,
        }),
      );
    });

    it('should omit duration of zero', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        format: {
          ...probeStub.videoStreamH264.format,
          duration: 0,
        },
      });

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalled();
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: asset.id,
          duration: null,
        }),
      );
    });

    it('should a handle duration of 1 week', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        format: {
          ...probeStub.videoStreamH264.format,
          duration: 604_800,
        },
      });

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.upsertExif).toHaveBeenCalled();
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: asset.id,
          duration: '168:00:00.000',
        }),
      );
    });

    it('should handle string Duration from exif', async () => {
      const asset = AssetFactory.create({ originalFileName: 'file.webp' });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ Duration: '01:30:00.000' }, {});

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.metadata.readTags).toHaveBeenCalledTimes(1);
      expect(mocks.asset.update).toHaveBeenCalledWith(expect.objectContaining({ duration: '01:30:00.000' }));
    });

    it('should use Duration from exif', async () => {
      const asset = AssetFactory.create({ originalFileName: 'file.webp' });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ Duration: 123 }, {});

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.metadata.readTags).toHaveBeenCalledTimes(1);
      expect(mocks.asset.update).toHaveBeenCalledWith(expect.objectContaining({ duration: '00:02:03.000' }));
    });

    it('should prefer Duration from exif over sidecar', async () => {
      const asset = AssetFactory.from({ originalFileName: 'file.webp' }).file({ type: AssetFileType.Sidecar }).build();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);

      mockReadTags({ Duration: 123 }, { Duration: 456 });

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.metadata.readTags).toHaveBeenCalledTimes(2);
      expect(mocks.asset.update).toHaveBeenCalledWith(expect.objectContaining({ duration: '00:02:03.000' }));
    });

    it('should ignore all Duration tags for definitely static images', async () => {
      const asset = AssetFactory.from({ originalFileName: 'file.dng' }).build();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ Duration: 123 }, { Duration: 456 });

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.metadata.readTags).toHaveBeenCalledTimes(1);
      expect(mocks.asset.update).toHaveBeenCalledWith(expect.objectContaining({ duration: null }));
    });

    it('should ignore Duration from exif for videos', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ Duration: 123 }, {});
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        format: {
          ...probeStub.videoStreamH264.format,
          duration: 456,
        },
      });

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.metadata.readTags).toHaveBeenCalledTimes(1);
      expect(mocks.asset.update).toHaveBeenCalledWith(expect.objectContaining({ duration: '00:07:36.000' }));
    });

    it('should trim whitespace from description', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ Description: '\t \v \f \n \r' });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '',
        }),
        { lockedPropertiesBehavior: 'skip' },
      );

      mockReadTags({ ImageDescription: ' my\n description' });
      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'my\n description',
        }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should handle a numeric description', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ Description: 1000 });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '1000',
        }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should skip importing metadata when the feature is disabled', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: false } } });
      mockReadTags(makeFaceTags({ Name: 'Person 1' }));
      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.person.getDistinctNames).not.toHaveBeenCalled();
    });

    it('should skip importing metadata face for assets without tags.RegionInfo', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
      mockReadTags();
      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.person.getDistinctNames).not.toHaveBeenCalled();
    });

    it('should skip importing faces without name', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
      mockReadTags(makeFaceTags());
      mocks.person.getDistinctNames.mockResolvedValue([]);
      mocks.person.createAll.mockResolvedValue([]);
      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.person.createAll).not.toHaveBeenCalled();
      expect(mocks.person.refreshFaces).not.toHaveBeenCalled();
      expect(mocks.person.updateAll).not.toHaveBeenCalled();
    });

    it('should skip importing faces with empty name', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
      mockReadTags(makeFaceTags({ Name: '' }));
      mocks.person.getDistinctNames.mockResolvedValue([]);
      mocks.person.createAll.mockResolvedValue([]);
      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.person.createAll).not.toHaveBeenCalled();
      expect(mocks.person.refreshFaces).not.toHaveBeenCalled();
      expect(mocks.person.updateAll).not.toHaveBeenCalled();
    });

    it('should apply metadata face tags creating new people', async () => {
      const asset = AssetFactory.create();
      const person = PersonFactory.create();

      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
      mockReadTags(makeFaceTags({ Name: person.name }));
      mocks.person.getDistinctNames.mockResolvedValue([]);
      mocks.person.createAll.mockResolvedValue([person.id]);
      mocks.person.update.mockResolvedValue(person);
      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.person.getDistinctNames).toHaveBeenCalledWith(asset.ownerId, { withHidden: true });
      expect(mocks.person.createAll).toHaveBeenCalledWith([expect.objectContaining({ name: person.name })]);
      expect(mocks.person.refreshFaces).toHaveBeenCalledWith(
        [
          {
            id: 'random-uuid',
            assetId: asset.id,
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
        { id: 'random-uuid', ownerId: asset.ownerId, faceAssetId: 'random-uuid' },
      ]);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.PersonGenerateThumbnail,
          data: { id: person.id },
        },
      ]);
    });

    it('should remove existing exif faces before adding new ones', async () => {
      const existingFace = { id: 'face-1', sourceType: SourceType.Exif };
      const asset = AssetFactory.from().face({ id: 'face-1', sourceType: SourceType.Exif }).build();
      const person = PersonFactory.create();

      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
      mockReadTags(makeFaceTags({ Name: person.name }));
      mocks.person.getDistinctNames.mockResolvedValue([{ id: person.id, name: person.name }]);
      mocks.person.createAll.mockResolvedValue([]);

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.person.refreshFaces).toHaveBeenCalledWith(
        expect.any(Array),
        ['face-1'],
      );
    });

    it('should assign metadata face tags to existing persons', async () => {
      const asset = AssetFactory.create();
      const person = PersonFactory.create();

      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
      mockReadTags(makeFaceTags({ Name: person.name }));
      mocks.person.getDistinctNames.mockResolvedValue([{ id: person.id, name: person.name }]);
      mocks.person.createAll.mockResolvedValue([]);
      mocks.person.update.mockResolvedValue(person);
      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.person.getDistinctNames).toHaveBeenCalledWith(asset.ownerId, { withHidden: true });
      expect(mocks.person.createAll).not.toHaveBeenCalled();
      expect(mocks.person.refreshFaces).toHaveBeenCalledWith(
        [
          {
            id: 'random-uuid',
            assetId: asset.id,
            personId: person.id,
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
          const asset = AssetFactory.create();
          const person = PersonFactory.create();

          mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
          mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
          mockReadTags(makeFaceTags({ Name: person.name }, orientation));
          mocks.person.getDistinctNames.mockResolvedValue([]);
          mocks.person.createAll.mockResolvedValue([person.id]);
          mocks.person.update.mockResolvedValue(person);
          await sut.handleMetadataExtraction({ id: asset.id });
          expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
          expect(mocks.person.getDistinctNames).toHaveBeenCalledWith(asset.ownerId, {
            withHidden: true,
          });
          expect(mocks.person.createAll).toHaveBeenCalledWith([expect.objectContaining({ name: person.name })]);
          expect(mocks.person.refreshFaces).toHaveBeenCalledWith(
            [
              {
                id: 'random-uuid',
                assetId: asset.id,
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
            { id: 'random-uuid', ownerId: asset.ownerId, faceAssetId: 'random-uuid' },
          ]);
          expect(mocks.job.queueAll).toHaveBeenCalledWith([
            {
              name: JobName.PersonGenerateThumbnail,
              data: { id: person.id },
            },
          ]);
        },
      );
    });

    it('should convert per-pixel bit depth to per-channel for bitsPerSample', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ BitsPerSample: 24 });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ bitsPerSample: 8 }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should parse BitsPerSample from string tag', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ BitsPerSample: '12 12 12' });

      await sut.handleMetadataExtraction({ id: asset.id });
      // Number.parseInt('12 12 12') returns 12, which is not >= 24, so no division
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ bitsPerSample: 12 }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should use ComponentBitDepth when BitsPerSample is not available', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ ComponentBitDepth: 10 });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ bitsPerSample: 10 }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should extract autoStackId from BurstID', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ BurstID: 'burst-123' });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ autoStackId: 'burst-123' }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should extract autoStackId from BurstUUID when BurstID is not present', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ BurstUUID: 'burst-uuid-456' });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ autoStackId: 'burst-uuid-456' }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should parse ImageSize dimensions from exif tags', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ ImageSize: '4000x3000' });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ exifImageWidth: 4000, exifImageHeight: 3000 }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should handle invalid modify date', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ ModifyDate: '00:00:00.000' });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          modifyDate: expect.any(Date),
        }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should handle invalid rating value', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ Rating: 6 });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: null,
        }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should handle valid rating value', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ Rating: 5 });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 5,
        }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should handle 0 as unrated -> null', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ Rating: 0 });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: null,
        }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should handle valid negative rating value', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ Rating: -1 });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: -1,
        }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should handle livePhotoCID not set', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.findLivePhotoMatch).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ visibility: AssetVisibility.Hidden }),
      );
      expect(mocks.album.removeAssetsFromAll).not.toHaveBeenCalled();
    });

    it('should handle not finding a match', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video });
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamVertical2160p);
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ ContentIdentifier: 'CID' });

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.findLivePhotoMatch).toHaveBeenCalledWith({
        livePhotoCID: 'CID',
        ownerId: asset.ownerId,
        otherAssetId: asset.id,
        libraryId: null,
        type: AssetType.Image,
      });
      expect(mocks.asset.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ visibility: AssetVisibility.Hidden }),
      );
      expect(mocks.album.removeAssetsFromAll).not.toHaveBeenCalled();
    });

    it('should link photo and video', async () => {
      const motionAsset = AssetFactory.create({ type: AssetType.Video });
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.asset.findLivePhotoMatch.mockResolvedValue(motionAsset);
      mockReadTags({ ContentIdentifier: 'CID' });

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.assetJob.getForMetadataExtraction).toHaveBeenCalledWith(asset.id);
      expect(mocks.asset.findLivePhotoMatch).toHaveBeenCalledWith({
        libraryId: null,
        livePhotoCID: 'CID',
        ownerId: asset.ownerId,
        otherAssetId: asset.id,
        type: AssetType.Video,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: asset.id,
        livePhotoVideoId: motionAsset.id,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: motionAsset.id,
        visibility: AssetVisibility.Hidden,
      });
      expect(mocks.album.removeAssetsFromAll).toHaveBeenCalledWith([motionAsset.id]);
    });

    it('should notify clients on live photo link', async () => {
      const motionAsset = AssetFactory.create({ type: AssetType.Video });
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.asset.findLivePhotoMatch.mockResolvedValue(motionAsset);
      mockReadTags({ ContentIdentifier: 'CID' });

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.event.emit).toHaveBeenCalledWith('AssetHide', {
        userId: motionAsset.ownerId,
        assetId: motionAsset.id,
      });
    });

    it('should search by libraryId', async () => {
      const motionAsset = AssetFactory.create({ type: AssetType.Video, libraryId: 'library-id' });
      const asset = AssetFactory.create({ libraryId: 'library-id' });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mocks.asset.findLivePhotoMatch.mockResolvedValue(motionAsset);
      mockReadTags({ ContentIdentifier: 'CID' });

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(mocks.event.emit).toHaveBeenCalledWith('AssetMetadataExtracted', {
        assetId: asset.id,
        userId: asset.ownerId,
      });
      expect(mocks.asset.findLivePhotoMatch).toHaveBeenCalledWith({
        ownerId: asset.ownerId,
        otherAssetId: asset.id,
        livePhotoCID: 'CID',
        libraryId: 'library-id',
        type: AssetType.Video,
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
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags(exif);

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(expect.objectContaining(expected), {
        lockedPropertiesBehavior: 'skip',
      });
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
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags(exif);

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          lensModel: expected,
        }),
        { lockedPropertiesBehavior: 'skip' },
      );
    });

    it('should properly set width/height for normal images', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ ImageWidth: 1000, ImageHeight: 2000 });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1000,
          height: 2000,
        }),
      );
    });

    it('should properly swap asset width/height for rotated images', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ ImageWidth: 1000, ImageHeight: 2000, Orientation: 6 });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 2000,
          height: 1000,
        }),
      );
    });

    it('should not overwrite existing width/height if they already exist', async () => {
      const asset = AssetFactory.create({ width: 1920, height: 1080 });
      mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
      mockReadTags({ ImageWidth: 1280, ImageHeight: 720 });

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(mocks.asset.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1280,
          height: 720,
        }),
      );
    });
  });

  describe('handleQueueSidecar', () => {
    it('should queue assets with sidecar files', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForSidecar.mockReturnValue(makeStream([asset]));

      await sut.handleQueueSidecar({ force: true });

      expect(mocks.assetJob.streamForSidecar).toHaveBeenCalledWith(true);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.SidecarCheck, data: { id: asset.id } }]);
    });

    it('should queue assets without sidecar files', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForSidecar.mockReturnValue(makeStream([asset]));

      await sut.handleQueueSidecar({ force: false });

      expect(mocks.assetJob.streamForSidecar).toHaveBeenCalledWith(false);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.SidecarCheck, data: { id: asset.id } }]);
    });
  });

  describe('handleSidecarCheck', () => {
    it('should do nothing if asset could not be found', async () => {
      mocks.assetJob.getForSidecarCheckJob.mockResolvedValue(void 0);

      await expect(sut.handleSidecarCheck({ id: 'non-existent' })).resolves.toBeUndefined();

      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should detect a new sidecar at .jpg.xmp', async () => {
      const asset = forSidecarJob({ originalPath: '/path/to/IMG_123.jpg', files: [] });

      mocks.assetJob.getForSidecarCheckJob.mockResolvedValue(asset);
      mocks.storage.checkFileExists.mockResolvedValueOnce(true);

      await expect(sut.handleSidecarCheck({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.asset.upsertFile).toHaveBeenCalledWith({
        assetId: asset.id,
        type: AssetFileType.Sidecar,
        path: '/path/to/IMG_123.jpg.xmp',
      });
    });

    it('should detect a new sidecar at .xmp', async () => {
      const asset = forSidecarJob({
        originalPath: '/path/to/IMG_123.jpg',
        files: [],
      });

      mocks.assetJob.getForSidecarCheckJob.mockResolvedValue(asset);
      mocks.storage.checkFileExists.mockResolvedValueOnce(false);
      mocks.storage.checkFileExists.mockResolvedValueOnce(true);

      await expect(sut.handleSidecarCheck({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.asset.upsertFile).toHaveBeenCalledWith({
        assetId: asset.id,
        type: AssetFileType.Sidecar,
        path: '/path/to/IMG_123.xmp',
      });
    });

    it('should unset sidecar path if file no longer exist', async () => {
      const asset = forSidecarJob({
        originalPath: '/path/to/IMG_123.jpg',
        files: [{ id: 'sidecar', path: '/path/to/IMG_123.jpg.xmp', type: AssetFileType.Sidecar, isEdited: false }],
      });
      mocks.assetJob.getForSidecarCheckJob.mockResolvedValue(asset);
      mocks.storage.checkFileExists.mockResolvedValue(false);

      await expect(sut.handleSidecarCheck({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.asset.deleteFile).toHaveBeenCalledWith({ assetId: asset.id, type: AssetFileType.Sidecar });
    });

    it('should do nothing if the sidecar file still exists', async () => {
      const asset = forSidecarJob({
        originalPath: '/path/to/IMG_123.jpg',
        files: [{ id: 'sidecar', path: '/path/to/IMG_123.jpg.xmp', type: AssetFileType.Sidecar, isEdited: false }],
      });

      mocks.assetJob.getForSidecarCheckJob.mockResolvedValue(asset);
      mocks.storage.checkFileExists.mockResolvedValueOnce(true);

      await expect(sut.handleSidecarCheck({ id: asset.id })).resolves.toBe(JobStatus.Skipped);

      expect(mocks.asset.upsertFile).not.toHaveBeenCalled();
      expect(mocks.asset.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('handleTagAsset', () => {
    it('should queue a sidecar write job', async () => {
      await sut.handleTagAsset({ assetId: 'asset-1' });
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.SidecarWrite, data: { id: 'asset-1' } });
    });
  });

  describe('handleUntagAsset', () => {
    it('should queue a sidecar write job', async () => {
      await sut.handleUntagAsset({ assetId: 'asset-2' });
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.SidecarWrite, data: { id: 'asset-2' } });
    });
  });

  describe('handleSidecarWrite', () => {
    it('should skip assets that no longer exist', async () => {
      mocks.assetJob.getLockedPropertiesForMetadataExtraction.mockResolvedValue([]);
      mocks.assetJob.getForSidecarWriteJob.mockResolvedValue(void 0);
      await expect(sut.handleSidecarWrite({ id: 'asset-123' })).resolves.toBe(JobStatus.Failed);
      expect(mocks.metadata.writeTags).not.toHaveBeenCalled();
    });

    it('should skip jobs with no metadata', async () => {
      mocks.assetJob.getLockedPropertiesForMetadataExtraction.mockResolvedValue([]);
      const asset = factory.jobAssets.sidecarWrite();
      mocks.assetJob.getForSidecarWriteJob.mockResolvedValue(asset);
      await expect(sut.handleSidecarWrite({ id: asset.id })).resolves.toBe(JobStatus.Skipped);
      expect(mocks.metadata.writeTags).not.toHaveBeenCalled();
    });

    it('should write tags', async () => {
      const asset = factory.jobAssets.sidecarWrite();
      const description = 'this is a description';
      const gps = 12;
      const date = '2023-11-21T22:56:12.196-06:00';

      mocks.assetJob.getLockedPropertiesForMetadataExtraction.mockResolvedValue([
        'description',
        'latitude',
        'longitude',
        'dateTimeOriginal',
        'timeZone',
      ]);
      mocks.assetJob.getForSidecarWriteJob.mockResolvedValue(asset);
      await expect(
        sut.handleSidecarWrite({
          id: asset.id,
        }),
      ).resolves.toBe(JobStatus.Success);
      expect(mocks.metadata.writeTags).toHaveBeenCalledWith(asset.files[0].path, {
        DateTimeOriginal: date,
        Description: description,
        ImageDescription: description,
        GPSLatitude: gps,
        GPSLongitude: gps,
      });
      expect(mocks.asset.unlockProperties).toHaveBeenCalledWith(asset.id, [
        'description',
        'latitude',
        'longitude',
        'dateTimeOriginal',
        'timeZone',
      ]);
    });

    it('should write rating', async () => {
      const asset = factory.jobAssets.sidecarWrite();
      asset.exifInfo.rating = 4;

      mocks.assetJob.getLockedPropertiesForMetadataExtraction.mockResolvedValue(['rating']);
      mocks.assetJob.getForSidecarWriteJob.mockResolvedValue(asset);
      await expect(sut.handleSidecarWrite({ id: asset.id })).resolves.toBe(JobStatus.Success);
      expect(mocks.metadata.writeTags).toHaveBeenCalledWith(asset.files[0].path, { Rating: 4 });
      expect(mocks.asset.unlockProperties).toHaveBeenCalledWith(asset.id, ['rating']);
    });

    it('should write null rating as 0', async () => {
      const asset = factory.jobAssets.sidecarWrite();
      asset.exifInfo.rating = null;

      mocks.assetJob.getLockedPropertiesForMetadataExtraction.mockResolvedValue(['rating']);
      mocks.assetJob.getForSidecarWriteJob.mockResolvedValue(asset);
      await expect(sut.handleSidecarWrite({ id: asset.id })).resolves.toBe(JobStatus.Success);
      expect(mocks.metadata.writeTags).toHaveBeenCalledWith(asset.files[0].path, { Rating: 0 });
      expect(mocks.asset.unlockProperties).toHaveBeenCalledWith(asset.id, ['rating']);
    });

    it('should create a sidecar file entry when asset has no files', async () => {
      const asset = factory.jobAssets.sidecarWrite();
      asset.files = [];
      asset.exifInfo.rating = 3;

      mocks.assetJob.getLockedPropertiesForMetadataExtraction.mockResolvedValue(['rating']);
      mocks.assetJob.getForSidecarWriteJob.mockResolvedValue(asset);

      await expect(sut.handleSidecarWrite({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.metadata.writeTags).toHaveBeenCalledWith(`${asset.originalPath}.xmp`, { Rating: 3 });
      expect(mocks.asset.upsertFile).toHaveBeenCalledWith({
        assetId: asset.id,
        type: AssetFileType.Sidecar,
        path: `${asset.originalPath}.xmp`,
      });
    });

    it('should write tags list to sidecar', async () => {
      const asset = factory.jobAssets.sidecarWrite();
      asset.exifInfo.tags = ['tag1', 'tag2'];

      mocks.assetJob.getLockedPropertiesForMetadataExtraction.mockResolvedValue(['tags']);
      mocks.assetJob.getForSidecarWriteJob.mockResolvedValue(asset);

      await expect(sut.handleSidecarWrite({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.metadata.writeTags).toHaveBeenCalledWith(asset.files[0].path, { TagsList: ['tag1', 'tag2'] });
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
      expect(result?.dateTime?.toISOString()).toBe('2023-07-07T07:00:00');
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
      expect(result?.dateTime?.toISOString()).toBe('2023-01-01T01:00:00');
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
      expect(result?.dateTime?.toISOString()).toBe('2023-07-07T07:00:00');
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
      expect(result?.dateTime?.toISOString()).toBe('2023-10-10T10:00:00');
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

  describe('S3 storage backend support', () => {
    let mockBackend: {
      downloadToTemp: ReturnType<typeof vi.fn>;
      exists: ReturnType<typeof vi.fn>;
      put: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockBackend = {
        downloadToTemp: vi.fn(),
        exists: vi.fn(),
        put: vi.fn(),
      };
      vi.spyOn(StorageService, 'resolveBackendForKey').mockReturnValue(mockBackend as unknown as StorageBackend);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('handleMetadataExtraction with S3 paths', () => {
      const s3TempPath = '/tmp/immich-temp-original.jpg';
      const s3SidecarTempPath = '/tmp/immich-temp-sidecar.xmp';

      beforeEach(() => {
        const time = new Date('2022-01-01T00:00:00.000Z');
        const timeMs = time.valueOf();
        mocks.storage.stat.mockResolvedValue({
          size: 123_456,
          mtime: time,
          mtimeMs: timeMs,
          birthtimeMs: timeMs,
        } as Stats);
        mockBackend.downloadToTemp.mockResolvedValue({
          tempPath: s3TempPath,
          cleanup: vi.fn().mockResolvedValue(),
        });
      });

      it('should download S3 asset to temp and use local path for readTags/stat', async () => {
        const asset = AssetFactory.create({ originalPath: 'upload/user1/ab/cd/file.jpg' });
        mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
        mockReadTags();

        await sut.handleMetadataExtraction({ id: asset.id });

        expect(mockBackend.downloadToTemp).toHaveBeenCalledWith('upload/user1/ab/cd/file.jpg');
        expect(mocks.metadata.readTags).toHaveBeenCalledWith(s3TempPath);
        expect(mocks.storage.stat).toHaveBeenCalledWith(s3TempPath);
      });

      it('should not call downloadToTemp for absolute (disk) paths', async () => {
        const asset = AssetFactory.create({ originalPath: '/data/library/file.jpg' });
        mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
        mockReadTags();

        await sut.handleMetadataExtraction({ id: asset.id });

        expect(mockBackend.downloadToTemp).not.toHaveBeenCalled();
        expect(mocks.metadata.readTags).toHaveBeenCalledWith('/data/library/file.jpg');
        expect(mocks.storage.stat).toHaveBeenCalledWith('/data/library/file.jpg');
      });

      it('should download S3 sidecar to temp and use local path for readTags', async () => {
        const asset = AssetFactory.from({ originalPath: 'upload/user1/ab/cd/file.jpg' })
          .file({ type: AssetFileType.Sidecar, path: 'upload/user1/ab/cd/file.jpg.xmp' })
          .build();
        mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);

        mockBackend.downloadToTemp
          .mockResolvedValueOnce({ tempPath: s3TempPath, cleanup: vi.fn().mockResolvedValue() })
          .mockResolvedValueOnce({ tempPath: s3SidecarTempPath, cleanup: vi.fn().mockResolvedValue() });

        const sidecarDate = new Date('2023-01-01T00:00:00.000Z');
        mockReadTags({}, { CreationDate: sidecarDate.toISOString() });

        await sut.handleMetadataExtraction({ id: asset.id });

        // Original should be downloaded
        expect(mockBackend.downloadToTemp).toHaveBeenCalledWith('upload/user1/ab/cd/file.jpg');
        // Sidecar should be downloaded
        expect(mockBackend.downloadToTemp).toHaveBeenCalledWith('upload/user1/ab/cd/file.jpg.xmp');
        // readTags should be called with local temp paths
        expect(mocks.metadata.readTags).toHaveBeenCalledWith(s3TempPath);
        expect(mocks.metadata.readTags).toHaveBeenCalledWith(s3SidecarTempPath);
      });

      it('should cleanup temp files after processing S3 asset', async () => {
        const cleanupOriginal = vi.fn().mockResolvedValue();
        const asset = AssetFactory.create({ originalPath: 'upload/user1/ab/cd/file.jpg' });
        mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
        mockBackend.downloadToTemp.mockResolvedValue({ tempPath: s3TempPath, cleanup: cleanupOriginal });
        mockReadTags();

        await sut.handleMetadataExtraction({ id: asset.id });

        expect(cleanupOriginal).toHaveBeenCalledOnce();
      });

      it('should use local temp path for video probe on S3 video assets', async () => {
        const asset = AssetFactory.create({ originalPath: 'upload/user1/ab/cd/video.mp4', type: AssetType.Video });
        mocks.assetJob.getForMetadataExtraction.mockResolvedValue(asset);
        mockBackend.downloadToTemp.mockResolvedValue({
          tempPath: s3TempPath,
          cleanup: vi.fn().mockResolvedValue(),
        });
        mocks.media.probe.mockResolvedValue(probeStub.videoStreamH264);
        mockReadTags();

        await sut.handleMetadataExtraction({ id: asset.id });

        // probe should be called with the local temp path, not the S3 key
        expect(mocks.media.probe).toHaveBeenCalledWith(s3TempPath);
      });
    });

    describe('handleSidecarCheck with S3 paths', () => {
      it('should use backend.exists() for S3 sidecar candidates', async () => {
        const asset = forSidecarJob({
          originalPath: 'upload/user1/ab/cd/IMG_123.jpg',
          files: [],
        });
        mocks.assetJob.getForSidecarCheckJob.mockResolvedValue(asset);
        mockBackend.exists.mockResolvedValueOnce(true);

        await expect(sut.handleSidecarCheck({ id: asset.id })).resolves.toBe(JobStatus.Success);

        expect(mockBackend.exists).toHaveBeenCalledWith('upload/user1/ab/cd/IMG_123.jpg.xmp');
        expect(mocks.storage.checkFileExists).not.toHaveBeenCalled();
        expect(mocks.asset.upsertFile).toHaveBeenCalledWith({
          assetId: asset.id,
          type: AssetFileType.Sidecar,
          path: 'upload/user1/ab/cd/IMG_123.jpg.xmp',
        });
      });

      it('should fall through to .xmp candidate on S3', async () => {
        const asset = forSidecarJob({
          originalPath: 'upload/user1/ab/cd/IMG_123.jpg',
          files: [],
        });
        mocks.assetJob.getForSidecarCheckJob.mockResolvedValue(asset);
        mockBackend.exists.mockResolvedValueOnce(false);
        mockBackend.exists.mockResolvedValueOnce(true);

        await expect(sut.handleSidecarCheck({ id: asset.id })).resolves.toBe(JobStatus.Success);

        expect(mockBackend.exists).toHaveBeenCalledWith('upload/user1/ab/cd/IMG_123.jpg.xmp');
        expect(mockBackend.exists).toHaveBeenCalledWith('upload/user1/ab/cd/IMG_123.xmp');
        expect(mocks.asset.upsertFile).toHaveBeenCalledWith({
          assetId: asset.id,
          type: AssetFileType.Sidecar,
          path: 'upload/user1/ab/cd/IMG_123.xmp',
        });
      });

      it('should use checkFileExists for disk (absolute) paths', async () => {
        const asset = forSidecarJob({
          originalPath: '/path/to/IMG_123.jpg',
          files: [],
        });
        mocks.assetJob.getForSidecarCheckJob.mockResolvedValue(asset);
        mocks.storage.checkFileExists.mockResolvedValueOnce(true);

        await expect(sut.handleSidecarCheck({ id: asset.id })).resolves.toBe(JobStatus.Success);

        expect(mocks.storage.checkFileExists).toHaveBeenCalled();
        expect(mockBackend.exists).not.toHaveBeenCalled();
      });
    });

    describe('handleSidecarWrite with S3 paths', () => {
      it('should download, write tags, and upload sidecar for S3 assets', async () => {
        const asset = factory.jobAssets.sidecarWrite();
        // Make the sidecar path relative (S3)
        asset.originalPath = 'upload/user1/ab/cd/file.jpg';
        asset.files = [
          {
            id: 'sidecar-id',
            type: AssetFileType.Sidecar,
            path: 'upload/user1/ab/cd/file.jpg.xmp',
            isEdited: false,
          },
        ];

        const localSidecarTempPath = '/tmp/immich-temp-sidecar.xmp';
        mockBackend.exists.mockResolvedValue(true);
        mockBackend.downloadToTemp.mockResolvedValue({
          tempPath: localSidecarTempPath,
          cleanup: vi.fn().mockResolvedValue(),
        });
        mocks.storage.createPlainReadStream.mockReturnValue({} as any);

        mocks.assetJob.getLockedPropertiesForMetadataExtraction.mockResolvedValue(['rating']);
        asset.exifInfo.rating = 3;
        mocks.assetJob.getForSidecarWriteJob.mockResolvedValue(asset);

        await expect(sut.handleSidecarWrite({ id: asset.id })).resolves.toBe(JobStatus.Success);

        // Should download existing sidecar
        expect(mockBackend.downloadToTemp).toHaveBeenCalledWith('upload/user1/ab/cd/file.jpg.xmp');
        // Should write tags to the local temp path
        expect(mocks.metadata.writeTags).toHaveBeenCalledWith(localSidecarTempPath, { Rating: 3 });
        // Should upload back to S3
        expect(mockBackend.put).toHaveBeenCalledWith(
          'upload/user1/ab/cd/file.jpg.xmp',
          expect.anything(),
          { contentType: 'application/xml' },
        );
      });

      it('should write tags directly for disk (absolute) sidecar paths', async () => {
        const asset = factory.jobAssets.sidecarWrite();
        asset.exifInfo.rating = 4;

        mocks.assetJob.getLockedPropertiesForMetadataExtraction.mockResolvedValue(['rating']);
        mocks.assetJob.getForSidecarWriteJob.mockResolvedValue(asset);

        await expect(sut.handleSidecarWrite({ id: asset.id })).resolves.toBe(JobStatus.Success);

        expect(mocks.metadata.writeTags).toHaveBeenCalledWith(asset.files[0].path, { Rating: 4 });
        expect(mockBackend.downloadToTemp).not.toHaveBeenCalled();
        expect(mockBackend.put).not.toHaveBeenCalled();
      });
    });
  });
});

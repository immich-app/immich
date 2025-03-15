import { BinaryField, ExifDateTime } from 'exiftool-vendored';
import { randomBytes } from 'node:crypto';
import { constants } from 'node:fs/promises';
import { defaults } from 'src/config';
import { AssetEntity } from 'src/entities/asset.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import { AssetType, ExifOrientation, ImmichWorker, JobName, JobStatus, SourceType } from 'src/enum';
import { WithoutProperty } from 'src/repositories/asset.repository';
import { ImmichTags } from 'src/repositories/metadata.repository';
import { MetadataService } from 'src/services/metadata.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { fileStub } from 'test/fixtures/file.stub';
import { probeStub } from 'test/fixtures/media.stub';
import { metadataStub } from 'test/fixtures/metadata.stub';
import { personStub } from 'test/fixtures/person.stub';
import { tagStub } from 'test/fixtures/tag.stub';
import { newTestService, ServiceMocks } from 'test/utils';

describe(MetadataService.name, () => {
  let sut: MetadataService;
  let mocks: ServiceMocks;

  const mockReadTags = (exifData?: Partial<ImmichTags>, sidecarData?: Partial<ImmichTags>) => {
    exifData = {
      FileSize: '123456',
      FileCreateDate: '2024-01-01T00:00:00.000Z',
      FileModifyDate: '2024-01-01T00:00:00.000Z',
      ...exifData,
    };
    mocks.metadata.readTags.mockReset();
    mocks.metadata.readTags.mockResolvedValueOnce(exifData);
    mocks.metadata.readTags.mockResolvedValueOnce(sidecarData ?? {});
  };

  beforeEach(() => {
    ({ sut, mocks } = newTestService(MetadataService));

    mockReadTags();

    mocks.config.getWorker.mockReturnValue(ImmichWorker.MICROSERVICES);

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
      mocks.asset.getWithout.mockResolvedValue({ items: [assetStub.image], hasNextPage: false });

      await expect(sut.handleQueueMetadataExtraction({ force: false })).resolves.toBe(JobStatus.SUCCESS);
      expect(mocks.asset.getWithout).toHaveBeenCalled();
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.METADATA_EXTRACTION,
          data: { id: assetStub.image.id },
        },
      ]);
    });

    it('should queue metadata extraction for all assets', async () => {
      mocks.asset.getAll.mockResolvedValue({ items: [assetStub.image], hasNextPage: false });

      await expect(sut.handleQueueMetadataExtraction({ force: true })).resolves.toBe(JobStatus.SUCCESS);
      expect(mocks.asset.getAll).toHaveBeenCalled();
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.METADATA_EXTRACTION,
          data: { id: assetStub.image.id },
        },
      ]);
    });
  });

  describe('handleMetadataExtraction', () => {
    it('should handle an asset that could not be found', async () => {
      await expect(sut.handleMetadataExtraction({ id: assetStub.image.id })).resolves.toBe(JobStatus.FAILED);

      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.image.id], { faces: { person: false } });
      expect(mocks.asset.upsertExif).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should handle a date in a sidecar file', async () => {
      const originalDate = new Date('2023-11-21T16:13:17.517Z');
      const sidecarDate = new Date('2022-01-01T00:00:00.000Z');
      mocks.asset.getByIds.mockResolvedValue([assetStub.sidecar]);
      mockReadTags({ CreationDate: originalDate.toISOString() }, { CreationDate: sidecarDate.toISOString() });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.sidecar.id], { faces: { person: false } });
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
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags({
        FileCreateDate: fileCreatedAt.toISOString(),
        FileModifyDate: fileModifiedAt.toISOString(),
      });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.image.id], { faces: { person: false } });
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
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags({
        FileCreateDate: fileCreatedAt.toISOString(),
        FileModifyDate: fileModifiedAt.toISOString(),
      });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.image.id], { faces: { person: false } });
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
      mocks.asset.getByIds.mockResolvedValue([assetStub.sidecar]);
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
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags({
        ISO: [160],
        FileCreateDate: assetStub.image.fileCreatedAt.toISOString(),
        FileModifyDate: assetStub.image.fileModifiedAt.toISOString(),
      });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.image.id], { faces: { person: false } });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(expect.objectContaining({ iso: 160 }));
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        duration: null,
        fileCreatedAt: assetStub.image.fileCreatedAt,
        fileModifiedAt: assetStub.image.fileCreatedAt,
        localDateTime: assetStub.image.fileCreatedAt,
      });
    });

    it('should apply reverse geocoding', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.withLocation]);
      mocks.systemMetadata.get.mockResolvedValue({ reverseGeocoding: { enabled: true } });
      mocks.map.reverseGeocode.mockResolvedValue({ city: 'City', state: 'State', country: 'Country' });
      mockReadTags({
        GPSLatitude: assetStub.withLocation.exifInfo!.latitude!,
        GPSLongitude: assetStub.withLocation.exifInfo!.longitude!,
        FileCreateDate: assetStub.withLocation.fileCreatedAt.toISOString(),
        FileModifyDate: assetStub.withLocation.fileModifiedAt.toISOString(),
      });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.image.id], { faces: { person: false } });
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
      mocks.asset.getByIds.mockResolvedValue([assetStub.withLocation]);
      mockReadTags({
        GPSLatitude: 0,
        GPSLongitude: 0,
      });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.image.id], { faces: { person: false } });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(expect.objectContaining({ latitude: null, longitude: null }));
    });

    it('should extract tags from TagsList', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags({ TagsList: ['Parent'] });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: 'user-id', value: 'Parent', parent: undefined });
    });

    it('should extract hierarchy from TagsList', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
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
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags({ Keywords: 'Parent' });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: 'user-id', value: 'Parent', parent: undefined });
    });

    it('should extract tags from Keywords as a list', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags({ Keywords: ['Parent'] });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: 'user-id', value: 'Parent', parent: undefined });
    });

    it('should extract tags from Keywords as a list with a number', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags({ Keywords: ['Parent', 2024] });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: 'user-id', value: 'Parent', parent: undefined });
      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: 'user-id', value: '2024', parent: undefined });
    });

    it('should extract hierarchal tags from Keywords', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
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
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
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
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
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
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags({ HierarchicalSubject: ['Parent', 2024] });
      mocks.tag.upsertValue.mockResolvedValue(tagStub.parentUpsert);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: 'user-id', value: 'Parent', parent: undefined });
      expect(mocks.tag.upsertValue).toHaveBeenCalledWith({ userId: 'user-id', value: '2024', parent: undefined });
    });

    it('should extract ignore / characters in a HierarchicalSubject tag', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
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
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
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
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags({});

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.tag.replaceAssetTags).toHaveBeenCalledWith('asset-id', []);
    });

    it('should not apply motion photos if asset is video', async () => {
      mocks.asset.getByIds.mockResolvedValue([{ ...assetStub.livePhotoMotionAsset, isVisible: true }]);
      mocks.media.probe.mockResolvedValue(probeStub.matroskaContainer);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoMotionAsset.id });
      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.livePhotoMotionAsset.id], {
        faces: { person: false },
      });
      expect(mocks.storage.createOrOverwriteFile).not.toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ assetType: AssetType.VIDEO, isVisible: false }),
      );
    });

    it('should handle an invalid Directory Item', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags({
        MotionPhoto: 1,
        ContainerDirectory: [{ Foo: 100 }],
      });

      await expect(sut.handleMetadataExtraction({ id: assetStub.image.id })).resolves.toBe(JobStatus.SUCCESS);
    });

    it('should extract the correct video orientation', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.video]);
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamVertical2160p);
      mockReadTags({});

      await sut.handleMetadataExtraction({ id: assetStub.video.id });

      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.video.id], { faces: { person: false } });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ orientation: ExifOrientation.Rotate270CW.toString() }),
      );
    });

    it('should extract the MotionPhotoVideo tag from Samsung HEIC motion photos', async () => {
      mocks.asset.getByIds.mockResolvedValue([{ ...assetStub.livePhotoWithOriginalFileName, livePhotoVideoId: null }]);
      mockReadTags({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MotionPhotoVideo: new BinaryField(0, ''),
        // The below two are included to ensure that the MotionPhotoVideo tag is extracted
        // instead of the EmbeddedVideoFile, since HEIC MotionPhotos include both
        EmbeddedVideoFile: new BinaryField(0, ''),
        EmbeddedVideoType: 'MotionPhoto_Data',
        FileCreateDate: assetStub.livePhotoWithOriginalFileName.fileCreatedAt.toISOString(),
        FileModifyDate: assetStub.livePhotoWithOriginalFileName.fileModifiedAt.toISOString(),
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
      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.livePhotoWithOriginalFileName.id], {
        faces: { person: false },
      });
      expect(mocks.asset.create).toHaveBeenCalledWith({
        checksum: expect.any(Buffer),
        deviceAssetId: 'NONE',
        deviceId: 'NONE',
        fileCreatedAt: assetStub.livePhotoWithOriginalFileName.fileCreatedAt,
        fileModifiedAt: assetStub.livePhotoWithOriginalFileName.fileModifiedAt,
        id: fileStub.livePhotoMotion.uuid,
        isVisible: false,
        libraryId: assetStub.livePhotoWithOriginalFileName.libraryId,
        localDateTime: assetStub.livePhotoWithOriginalFileName.fileCreatedAt,
        originalFileName: 'asset_1.mp4',
        originalPath: 'upload/encoded-video/user-id/li/ve/live-photo-motion-asset-MP.mp4',
        ownerId: assetStub.livePhotoWithOriginalFileName.ownerId,
        type: AssetType.VIDEO,
      });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.ownerId, 512);
      expect(mocks.storage.createFile).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.originalPath, video);
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoWithOriginalFileName.id,
        livePhotoVideoId: fileStub.livePhotoMotion.uuid,
      });
      expect(mocks.asset.update).toHaveBeenCalledTimes(2);
    });

    it('should extract the EmbeddedVideo tag from Samsung JPEG motion photos', async () => {
      mocks.asset.getByIds.mockResolvedValue([{ ...assetStub.livePhotoWithOriginalFileName, livePhotoVideoId: null }]);
      mockReadTags({
        Directory: 'foo/bar/',
        EmbeddedVideoFile: new BinaryField(0, ''),
        EmbeddedVideoType: 'MotionPhoto_Data',
        MotionPhoto: 1,
        FileCreateDate: assetStub.livePhotoWithOriginalFileName.fileCreatedAt.toISOString(),
        FileModifyDate: assetStub.livePhotoWithOriginalFileName.fileModifiedAt.toISOString(),
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
      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.livePhotoWithOriginalFileName.id], {
        faces: { person: false },
      });
      expect(mocks.asset.create).toHaveBeenCalledWith({
        checksum: expect.any(Buffer),
        deviceAssetId: 'NONE',
        deviceId: 'NONE',
        fileCreatedAt: assetStub.livePhotoWithOriginalFileName.fileCreatedAt,
        fileModifiedAt: assetStub.livePhotoWithOriginalFileName.fileModifiedAt,
        id: fileStub.livePhotoMotion.uuid,
        isVisible: false,
        libraryId: assetStub.livePhotoWithOriginalFileName.libraryId,
        localDateTime: assetStub.livePhotoWithOriginalFileName.fileCreatedAt,
        originalFileName: 'asset_1.mp4',
        originalPath: 'upload/encoded-video/user-id/li/ve/live-photo-motion-asset-MP.mp4',
        ownerId: assetStub.livePhotoWithOriginalFileName.ownerId,
        type: AssetType.VIDEO,
      });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.ownerId, 512);
      expect(mocks.storage.createFile).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.originalPath, video);
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoWithOriginalFileName.id,
        livePhotoVideoId: fileStub.livePhotoMotion.uuid,
      });
      expect(mocks.asset.update).toHaveBeenCalledTimes(2);
    });

    it('should extract the motion photo video from the XMP directory entry ', async () => {
      mocks.asset.getByIds.mockResolvedValue([{ ...assetStub.livePhotoWithOriginalFileName, livePhotoVideoId: null }]);
      mockReadTags({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
        FileCreateDate: assetStub.livePhotoWithOriginalFileName.fileCreatedAt.toISOString(),
        FileModifyDate: assetStub.livePhotoWithOriginalFileName.fileModifiedAt.toISOString(),
      });
      mocks.crypto.hashSha1.mockReturnValue(randomBytes(512));
      mocks.asset.create.mockResolvedValue(assetStub.livePhotoMotionAsset);
      mocks.crypto.randomUUID.mockReturnValue(fileStub.livePhotoMotion.uuid);
      const video = randomBytes(512);
      mocks.storage.readFile.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoWithOriginalFileName.id });
      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.livePhotoWithOriginalFileName.id], {
        faces: { person: false },
      });
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
        isVisible: false,
        libraryId: assetStub.livePhotoWithOriginalFileName.libraryId,
        localDateTime: assetStub.livePhotoWithOriginalFileName.fileCreatedAt,
        originalFileName: 'asset_1.mp4',
        originalPath: 'upload/encoded-video/user-id/li/ve/live-photo-motion-asset-MP.mp4',
        ownerId: assetStub.livePhotoWithOriginalFileName.ownerId,
        type: AssetType.VIDEO,
      });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.ownerId, 512);
      expect(mocks.storage.createFile).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.originalPath, video);
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoWithOriginalFileName.id,
        livePhotoVideoId: fileStub.livePhotoMotion.uuid,
      });
      expect(mocks.asset.update).toHaveBeenCalledTimes(2);
    });

    it('should delete old motion photo video assets if they do not match what is extracted', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.livePhotoWithOriginalFileName]);
      mockReadTags({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      mocks.crypto.hashSha1.mockReturnValue(randomBytes(512));
      mocks.asset.create.mockImplementation(
        (asset) => Promise.resolve({ ...assetStub.livePhotoMotionAsset, ...asset }) as Promise<AssetEntity>,
      );
      const video = randomBytes(512);
      mocks.storage.readFile.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoWithOriginalFileName.id });
      expect(mocks.job.queue).toHaveBeenNthCalledWith(1, {
        name: JobName.ASSET_DELETION,
        data: { id: assetStub.livePhotoWithOriginalFileName.livePhotoVideoId, deleteOnDisk: true },
      });
      expect(mocks.job.queue).toHaveBeenNthCalledWith(2, {
        name: JobName.METADATA_EXTRACTION,
        data: { id: 'random-uuid' },
      });
    });

    it('should not create a new motion photo video asset if the hash of the extracted video matches an existing asset', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.livePhotoStillAsset]);
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
      mocks.asset.getByIds.mockResolvedValue([{ ...assetStub.livePhotoStillAsset, livePhotoVideoId: null }]);
      mockReadTags({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      mocks.crypto.hashSha1.mockReturnValue(randomBytes(512));
      mocks.asset.getByChecksum.mockResolvedValue({ ...assetStub.livePhotoMotionAsset, isVisible: true });
      const video = randomBytes(512);
      mocks.storage.readFile.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoMotionAsset.id,
        isVisible: false,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
      expect(mocks.asset.update).toHaveBeenCalledTimes(3);
    });

    it('should not update storage usage if motion photo is external', async () => {
      mocks.asset.getByIds.mockResolvedValue([
        { ...assetStub.livePhotoStillAsset, livePhotoVideoId: null, isExternal: true },
      ]);
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
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags(tags);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.image.id], { faces: { person: false } });
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
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags(tags);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.image.id], { faces: { person: false } });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          timeZone: 'UTC+0',
        }),
      );
    });

    it('should extract duration', async () => {
      mocks.asset.getByIds.mockResolvedValue([{ ...assetStub.video }]);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        format: {
          ...probeStub.videoStreamH264.format,
          duration: 6.21,
        },
      });

      await sut.handleMetadataExtraction({ id: assetStub.video.id });

      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.video.id], { faces: { person: false } });
      expect(mocks.asset.upsertExif).toHaveBeenCalled();
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.image.id,
          duration: '00:00:06.210',
        }),
      );
    });

    it('should only extract duration for videos', async () => {
      mocks.asset.getByIds.mockResolvedValue([{ ...assetStub.image }]);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        format: {
          ...probeStub.videoStreamH264.format,
          duration: 6.21,
        },
      });
      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.image.id], { faces: { person: false } });
      expect(mocks.asset.upsertExif).toHaveBeenCalled();
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.image.id,
          duration: null,
        }),
      );
    });

    it('should omit duration of zero', async () => {
      mocks.asset.getByIds.mockResolvedValue([{ ...assetStub.video }]);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        format: {
          ...probeStub.videoStreamH264.format,
          duration: 0,
        },
      });

      await sut.handleMetadataExtraction({ id: assetStub.video.id });

      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.video.id], { faces: { person: false } });
      expect(mocks.asset.upsertExif).toHaveBeenCalled();
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.image.id,
          duration: null,
        }),
      );
    });

    it('should a handle duration of 1 week', async () => {
      mocks.asset.getByIds.mockResolvedValue([{ ...assetStub.video }]);
      mocks.media.probe.mockResolvedValue({
        ...probeStub.videoStreamH264,
        format: {
          ...probeStub.videoStreamH264.format,
          duration: 604_800,
        },
      });

      await sut.handleMetadataExtraction({ id: assetStub.video.id });

      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.video.id], { faces: { person: false } });
      expect(mocks.asset.upsertExif).toHaveBeenCalled();
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.video.id,
          duration: '168:00:00.000',
        }),
      );
    });

    it('should ignore duration from exif data', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags({}, { Duration: { Value: 123 } });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.update).toHaveBeenCalledWith(expect.objectContaining({ duration: null }));
    });

    it('should trim whitespace from description', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
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
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags({ Description: 1000 });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '1000',
        }),
      );
    });

    it('should skip importing metadata when the feature is disabled', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.primaryImage]);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: false } } });
      mockReadTags(metadataStub.withFace);
      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.person.getDistinctNames).not.toHaveBeenCalled();
    });

    it('should skip importing metadata face for assets without tags.RegionInfo', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.primaryImage]);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
      mockReadTags(metadataStub.empty);
      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.person.getDistinctNames).not.toHaveBeenCalled();
    });

    it('should skip importing faces without name', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.primaryImage]);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
      mockReadTags(metadataStub.withFaceNoName);
      mocks.person.getDistinctNames.mockResolvedValue([]);
      mocks.person.createAll.mockResolvedValue([]);
      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.person.createAll).not.toHaveBeenCalled();
      expect(mocks.person.refreshFaces).not.toHaveBeenCalled();
      expect(mocks.person.updateAll).not.toHaveBeenCalled();
    });

    it('should skip importing faces with empty name', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.primaryImage]);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
      mockReadTags(metadataStub.withFaceEmptyName);
      mocks.person.getDistinctNames.mockResolvedValue([]);
      mocks.person.createAll.mockResolvedValue([]);
      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.person.createAll).not.toHaveBeenCalled();
      expect(mocks.person.refreshFaces).not.toHaveBeenCalled();
      expect(mocks.person.updateAll).not.toHaveBeenCalled();
    });

    it('should apply metadata face tags creating new persons', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.primaryImage]);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
      mockReadTags(metadataStub.withFace);
      mocks.person.getDistinctNames.mockResolvedValue([]);
      mocks.person.createAll.mockResolvedValue([personStub.withName.id]);
      mocks.person.update.mockResolvedValue(personStub.withName);
      await sut.handleMetadataExtraction({ id: assetStub.primaryImage.id });
      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.primaryImage.id], { faces: { person: false } });
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
            imageWidth: 100,
            boundingBoxX1: 0,
            boundingBoxX2: 10,
            boundingBoxY1: 0,
            boundingBoxY2: 10,
            sourceType: SourceType.EXIF,
          },
        ],
        [],
      );
      expect(mocks.person.updateAll).toHaveBeenCalledWith([
        { id: 'random-uuid', ownerId: 'admin-id', faceAssetId: 'random-uuid' },
      ]);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.GENERATE_PERSON_THUMBNAIL,
          data: { id: personStub.withName.id },
        },
      ]);
    });

    it('should assign metadata face tags to existing persons', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.primaryImage]);
      mocks.systemMetadata.get.mockResolvedValue({ metadata: { faces: { import: true } } });
      mockReadTags(metadataStub.withFace);
      mocks.person.getDistinctNames.mockResolvedValue([{ id: personStub.withName.id, name: personStub.withName.name }]);
      mocks.person.createAll.mockResolvedValue([]);
      mocks.person.update.mockResolvedValue(personStub.withName);
      await sut.handleMetadataExtraction({ id: assetStub.primaryImage.id });
      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.primaryImage.id], { faces: { person: false } });
      expect(mocks.person.getDistinctNames).toHaveBeenCalledWith(assetStub.primaryImage.ownerId, { withHidden: true });
      expect(mocks.person.createAll).not.toHaveBeenCalled();
      expect(mocks.person.refreshFaces).toHaveBeenCalledWith(
        [
          {
            id: 'random-uuid',
            assetId: assetStub.primaryImage.id,
            personId: personStub.withName.id,
            imageHeight: 100,
            imageWidth: 100,
            boundingBoxX1: 0,
            boundingBoxX2: 10,
            boundingBoxY1: 0,
            boundingBoxY2: 10,
            sourceType: SourceType.EXIF,
          },
        ],
        [],
      );
      expect(mocks.person.updateAll).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalledWith();
    });

    it('should handle invalid modify date', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags({ ModifyDate: '00:00:00.000' });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          modifyDate: expect.any(Date),
        }),
      );
    });

    it('should handle invalid rating value', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags({ Rating: 6 });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: null,
        }),
      );
    });

    it('should handle valid rating value', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags({ Rating: 5 });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 5,
        }),
      );
    });

    it('should handle valid negative rating value', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags({ Rating: -1 });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: -1,
        }),
      );
    });

    it('should handle livePhotoCID not set', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);

      await expect(sut.handleMetadataExtraction({ id: assetStub.image.id })).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.image.id], { faces: { person: false } });
      expect(mocks.asset.findLivePhotoMatch).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalledWith(expect.objectContaining({ isVisible: false }));
      expect(mocks.album.removeAsset).not.toHaveBeenCalled();
    });

    it('should handle not finding a match', async () => {
      mocks.media.probe.mockResolvedValue(probeStub.videoStreamVertical2160p);
      mocks.asset.getByIds.mockResolvedValue([assetStub.livePhotoMotionAsset]);
      mockReadTags({ ContentIdentifier: 'CID' });

      await expect(sut.handleMetadataExtraction({ id: assetStub.livePhotoMotionAsset.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );

      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.livePhotoMotionAsset.id], {
        faces: { person: false },
      });
      expect(mocks.asset.findLivePhotoMatch).toHaveBeenCalledWith({
        livePhotoCID: 'CID',
        ownerId: assetStub.livePhotoMotionAsset.ownerId,
        otherAssetId: assetStub.livePhotoMotionAsset.id,
        type: AssetType.IMAGE,
      });
      expect(mocks.asset.update).not.toHaveBeenCalledWith(expect.objectContaining({ isVisible: false }));
      expect(mocks.album.removeAsset).not.toHaveBeenCalled();
    });

    it('should link photo and video', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.livePhotoStillAsset]);
      mocks.asset.findLivePhotoMatch.mockResolvedValue(assetStub.livePhotoMotionAsset);
      mockReadTags({ ContentIdentifier: 'CID' });

      await expect(sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );

      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.livePhotoStillAsset.id], {
        faces: { person: false },
      });
      expect(mocks.asset.findLivePhotoMatch).toHaveBeenCalledWith({
        livePhotoCID: 'CID',
        ownerId: assetStub.livePhotoStillAsset.ownerId,
        otherAssetId: assetStub.livePhotoStillAsset.id,
        type: AssetType.VIDEO,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: assetStub.livePhotoMotionAsset.id, isVisible: false });
      expect(mocks.album.removeAsset).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.id);
    });

    it('should notify clients on live photo link', async () => {
      mocks.asset.getByIds.mockResolvedValue([
        {
          ...assetStub.livePhotoStillAsset,
          exifInfo: { livePhotoCID: assetStub.livePhotoMotionAsset.id } as ExifEntity,
        },
      ]);
      mocks.asset.findLivePhotoMatch.mockResolvedValue(assetStub.livePhotoMotionAsset);
      mockReadTags({ ContentIdentifier: 'CID' });

      await expect(sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );

      expect(mocks.event.emit).toHaveBeenCalledWith('asset.hide', {
        userId: assetStub.livePhotoMotionAsset.ownerId,
        assetId: assetStub.livePhotoMotionAsset.id,
      });
    });

    it('should search by libraryId', async () => {
      mocks.asset.getByIds.mockResolvedValue([
        {
          ...assetStub.livePhotoStillAsset,
          libraryId: 'library-id',
        },
      ]);
      mockReadTags({ ContentIdentifier: 'CID' });

      await expect(sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );

      expect(mocks.asset.findLivePhotoMatch).toHaveBeenCalledWith({
        ownerId: 'user-id',
        otherAssetId: 'live-photo-still-asset',
        livePhotoCID: 'CID',
        libraryId: 'library-id',
        type: 'VIDEO',
      });
    });

    it.each([
      { Make: '1', Model: '2', Device: { Manufacturer: '3', ModelName: '4' }, AndroidMake: '4', AndroidModel: '5' },
      { Device: { Manufacturer: '1', ModelName: '2' }, AndroidMake: '3', AndroidModel: '4' },
      { AndroidMake: '1', AndroidModel: '2' },
    ])('should read camera make and model correct place %s', async (metaData) => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mockReadTags(metaData);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(mocks.asset.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          make: '1',
          model: '2',
        }),
      );
    });
  });

  describe('handleQueueSidecar', () => {
    it('should queue assets with sidecar files', async () => {
      mocks.asset.getAll.mockResolvedValue({ items: [assetStub.sidecar], hasNextPage: false });

      await sut.handleQueueSidecar({ force: true });

      expect(mocks.asset.getAll).toHaveBeenCalledWith({ take: 1000, skip: 0 });
      expect(mocks.asset.getWithout).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.SIDECAR_SYNC,
          data: { id: assetStub.sidecar.id },
        },
      ]);
    });

    it('should queue assets without sidecar files', async () => {
      mocks.asset.getWithout.mockResolvedValue({ items: [assetStub.image], hasNextPage: false });

      await sut.handleQueueSidecar({ force: false });

      expect(mocks.asset.getWithout).toHaveBeenCalledWith({ take: 1000, skip: 0 }, WithoutProperty.SIDECAR);
      expect(mocks.asset.getAll).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.SIDECAR_DISCOVERY,
          data: { id: assetStub.image.id },
        },
      ]);
    });
  });

  describe('handleSidecarSync', () => {
    it('should do nothing if asset could not be found', async () => {
      mocks.asset.getByIds.mockResolvedValue([]);
      await expect(sut.handleSidecarSync({ id: assetStub.image.id })).resolves.toBe(JobStatus.FAILED);
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should do nothing if asset has no sidecar path', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      await expect(sut.handleSidecarSync({ id: assetStub.image.id })).resolves.toBe(JobStatus.FAILED);
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should set sidecar path if exists (sidecar named photo.ext.xmp)', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.sidecar]);
      mocks.storage.checkFileExists.mockResolvedValue(true);

      await expect(sut.handleSidecarSync({ id: assetStub.sidecar.id })).resolves.toBe(JobStatus.SUCCESS);
      expect(mocks.storage.checkFileExists).toHaveBeenCalledWith(
        `${assetStub.sidecar.originalPath}.xmp`,
        constants.R_OK,
      );
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.sidecar.id,
        sidecarPath: assetStub.sidecar.sidecarPath,
      });
    });

    it('should set sidecar path if exists (sidecar named photo.xmp)', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.sidecarWithoutExt]);
      mocks.storage.checkFileExists.mockResolvedValueOnce(false);
      mocks.storage.checkFileExists.mockResolvedValueOnce(true);

      await expect(sut.handleSidecarSync({ id: assetStub.sidecarWithoutExt.id })).resolves.toBe(JobStatus.SUCCESS);
      expect(mocks.storage.checkFileExists).toHaveBeenNthCalledWith(
        2,
        assetStub.sidecarWithoutExt.sidecarPath,
        constants.R_OK,
      );
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.sidecarWithoutExt.id,
        sidecarPath: assetStub.sidecarWithoutExt.sidecarPath,
      });
    });

    it('should set sidecar path if exists (two sidecars named photo.ext.xmp and photo.xmp, should pick photo.ext.xmp)', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.sidecar]);
      mocks.storage.checkFileExists.mockResolvedValueOnce(true);
      mocks.storage.checkFileExists.mockResolvedValueOnce(true);

      await expect(sut.handleSidecarSync({ id: assetStub.sidecar.id })).resolves.toBe(JobStatus.SUCCESS);
      expect(mocks.storage.checkFileExists).toHaveBeenNthCalledWith(1, assetStub.sidecar.sidecarPath, constants.R_OK);
      expect(mocks.storage.checkFileExists).toHaveBeenNthCalledWith(
        2,
        assetStub.sidecarWithoutExt.sidecarPath,
        constants.R_OK,
      );
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.sidecar.id,
        sidecarPath: assetStub.sidecar.sidecarPath,
      });
    });

    it('should unset sidecar path if file does not exist anymore', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.sidecar]);
      mocks.storage.checkFileExists.mockResolvedValue(false);

      await expect(sut.handleSidecarSync({ id: assetStub.sidecar.id })).resolves.toBe(JobStatus.SUCCESS);
      expect(mocks.storage.checkFileExists).toHaveBeenCalledWith(
        `${assetStub.sidecar.originalPath}.xmp`,
        constants.R_OK,
      );
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.sidecar.id,
        sidecarPath: null,
      });
    });
  });

  describe('handleSidecarDiscovery', () => {
    it('should skip hidden assets', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.livePhotoMotionAsset]);
      await sut.handleSidecarDiscovery({ id: assetStub.livePhotoMotionAsset.id });
      expect(mocks.storage.checkFileExists).not.toHaveBeenCalled();
    });

    it('should skip assets with a sidecar path', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.sidecar]);
      await sut.handleSidecarDiscovery({ id: assetStub.sidecar.id });
      expect(mocks.storage.checkFileExists).not.toHaveBeenCalled();
    });

    it('should do nothing when a sidecar is not found ', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mocks.storage.checkFileExists.mockResolvedValue(false);
      await sut.handleSidecarDiscovery({ id: assetStub.image.id });
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should update a image asset when a sidecar is found', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mocks.storage.checkFileExists.mockResolvedValue(true);
      await sut.handleSidecarDiscovery({ id: assetStub.image.id });
      expect(mocks.storage.checkFileExists).toHaveBeenCalledWith('/original/path.jpg.xmp', constants.R_OK);
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        sidecarPath: '/original/path.jpg.xmp',
      });
    });

    it('should update a video asset when a sidecar is found', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.video]);
      mocks.storage.checkFileExists.mockResolvedValue(true);
      await sut.handleSidecarDiscovery({ id: assetStub.video.id });
      expect(mocks.storage.checkFileExists).toHaveBeenCalledWith('/original/path.ext.xmp', constants.R_OK);
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        sidecarPath: '/original/path.ext.xmp',
      });
    });
  });

  describe('handleSidecarWrite', () => {
    it('should skip assets that do not exist anymore', async () => {
      mocks.asset.getByIds.mockResolvedValue([]);
      await expect(sut.handleSidecarWrite({ id: 'asset-123' })).resolves.toBe(JobStatus.FAILED);
      expect(mocks.metadata.writeTags).not.toHaveBeenCalled();
    });

    it('should skip jobs with not metadata', async () => {
      mocks.asset.getByIds.mockResolvedValue([assetStub.sidecar]);
      await expect(sut.handleSidecarWrite({ id: assetStub.sidecar.id })).resolves.toBe(JobStatus.SKIPPED);
      expect(mocks.metadata.writeTags).not.toHaveBeenCalled();
    });

    it('should write tags', async () => {
      const description = 'this is a description';
      const gps = 12;
      const date = '2023-11-22T04:56:12.196Z';

      mocks.asset.getByIds.mockResolvedValue([assetStub.sidecar]);
      await expect(
        sut.handleSidecarWrite({
          id: assetStub.sidecar.id,
          description,
          latitude: gps,
          longitude: gps,
          dateTimeOriginal: date,
        }),
      ).resolves.toBe(JobStatus.SUCCESS);
      expect(mocks.metadata.writeTags).toHaveBeenCalledWith(assetStub.sidecar.sidecarPath, {
        Description: description,
        ImageDescription: description,
        DateTimeOriginal: date,
        GPSLatitude: gps,
        GPSLongitude: gps,
      });
    });
  });
});

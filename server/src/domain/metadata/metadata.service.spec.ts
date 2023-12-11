import { AssetType, ExifEntity, SystemConfigKey } from '@app/infra/entities';
import {
  assetStub,
  newAlbumRepositoryMock,
  newAssetRepositoryMock,
  newCommunicationRepositoryMock,
  newCryptoRepositoryMock,
  newJobRepositoryMock,
  newMediaRepositoryMock,
  newMetadataRepositoryMock,
  newMoveRepositoryMock,
  newPersonRepositoryMock,
  newStorageRepositoryMock,
  newSystemConfigRepositoryMock,
  probeStub,
} from '@test';
import { randomBytes } from 'crypto';
import { Stats } from 'fs';
import { constants } from 'fs/promises';
import { when } from 'jest-when';
import { JobName } from '../job';
import {
  CommunicationEvent,
  IAlbumRepository,
  IAssetRepository,
  ICommunicationRepository,
  ICryptoRepository,
  IJobRepository,
  IMediaRepository,
  IMetadataRepository,
  IMoveRepository,
  IPersonRepository,
  IStorageRepository,
  ISystemConfigRepository,
  ImmichTags,
  WithProperty,
  WithoutProperty,
} from '../repositories';
import { MetadataService, Orientation } from './metadata.service';

describe(MetadataService.name, () => {
  let albumMock: jest.Mocked<IAlbumRepository>;
  let assetMock: jest.Mocked<IAssetRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let cryptoRepository: jest.Mocked<ICryptoRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let metadataMock: jest.Mocked<IMetadataRepository>;
  let moveMock: jest.Mocked<IMoveRepository>;
  let mediaMock: jest.Mocked<IMediaRepository>;
  let personMock: jest.Mocked<IPersonRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;
  let communicationMock: jest.Mocked<ICommunicationRepository>;
  let sut: MetadataService;

  beforeEach(async () => {
    albumMock = newAlbumRepositoryMock();
    assetMock = newAssetRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    cryptoRepository = newCryptoRepositoryMock();
    jobMock = newJobRepositoryMock();
    metadataMock = newMetadataRepositoryMock();
    moveMock = newMoveRepositoryMock();
    personMock = newPersonRepositoryMock();
    communicationMock = newCommunicationRepositoryMock();
    storageMock = newStorageRepositoryMock();
    mediaMock = newMediaRepositoryMock();

    sut = new MetadataService(
      albumMock,
      assetMock,
      cryptoRepository,
      jobMock,
      metadataMock,
      storageMock,
      configMock,
      mediaMock,
      moveMock,
      communicationMock,
      personMock,
    );
  });

  afterEach(async () => {
    await sut.teardown();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('init', () => {
    beforeEach(async () => {
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.REVERSE_GEOCODING_ENABLED, value: true }]);

      await sut.init();
    });

    it('should return if reverse geocoding is disabled', async () => {
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.REVERSE_GEOCODING_ENABLED, value: false }]);

      await sut.init();
      expect(jobMock.pause).toHaveBeenCalledTimes(1);
      expect(metadataMock.init).toHaveBeenCalledTimes(1);
      expect(jobMock.resume).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleLivePhotoLinking', () => {
    it('should handle an asset that could not be found', async () => {
      await expect(sut.handleLivePhotoLinking({ id: assetStub.image.id })).resolves.toBe(false);
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
      expect(assetMock.findLivePhotoMatch).not.toHaveBeenCalled();
      expect(assetMock.save).not.toHaveBeenCalled();
      expect(albumMock.removeAsset).not.toHaveBeenCalled();
    });

    it('should handle an asset without exif info', async () => {
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.image, exifInfo: undefined }]);

      await expect(sut.handleLivePhotoLinking({ id: assetStub.image.id })).resolves.toBe(false);
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
      expect(assetMock.findLivePhotoMatch).not.toHaveBeenCalled();
      expect(assetMock.save).not.toHaveBeenCalled();
      expect(albumMock.removeAsset).not.toHaveBeenCalled();
    });

    it('should handle livePhotoCID not set', async () => {
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.image }]);

      await expect(sut.handleLivePhotoLinking({ id: assetStub.image.id })).resolves.toBe(true);
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
      expect(assetMock.findLivePhotoMatch).not.toHaveBeenCalled();
      expect(assetMock.save).not.toHaveBeenCalled();
      expect(albumMock.removeAsset).not.toHaveBeenCalled();
    });

    it('should handle not finding a match', async () => {
      assetMock.getByIds.mockResolvedValue([
        {
          ...assetStub.livePhotoMotionAsset,
          exifInfo: { livePhotoCID: assetStub.livePhotoStillAsset.id } as ExifEntity,
        },
      ]);

      await expect(sut.handleLivePhotoLinking({ id: assetStub.livePhotoMotionAsset.id })).resolves.toBe(true);
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.livePhotoMotionAsset.id]);
      expect(assetMock.findLivePhotoMatch).toHaveBeenCalledWith({
        livePhotoCID: assetStub.livePhotoStillAsset.id,
        ownerId: assetStub.livePhotoMotionAsset.ownerId,
        otherAssetId: assetStub.livePhotoMotionAsset.id,
        type: AssetType.IMAGE,
      });
      expect(assetMock.save).not.toHaveBeenCalled();
      expect(albumMock.removeAsset).not.toHaveBeenCalled();
    });

    it('should link photo and video', async () => {
      assetMock.getByIds.mockResolvedValue([
        {
          ...assetStub.livePhotoStillAsset,
          exifInfo: { livePhotoCID: assetStub.livePhotoMotionAsset.id } as ExifEntity,
        },
      ]);
      assetMock.findLivePhotoMatch.mockResolvedValue(assetStub.livePhotoMotionAsset);

      await expect(sut.handleLivePhotoLinking({ id: assetStub.livePhotoStillAsset.id })).resolves.toBe(true);
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.livePhotoStillAsset.id]);
      expect(assetMock.findLivePhotoMatch).toHaveBeenCalledWith({
        livePhotoCID: assetStub.livePhotoMotionAsset.id,
        ownerId: assetStub.livePhotoStillAsset.ownerId,
        otherAssetId: assetStub.livePhotoStillAsset.id,
        type: AssetType.VIDEO,
      });
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
      expect(assetMock.save).toHaveBeenCalledWith({ id: assetStub.livePhotoMotionAsset.id, isVisible: false });
      expect(albumMock.removeAsset).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.id);
    });

    it('should notify clients on live photo link', async () => {
      assetMock.getByIds.mockResolvedValue([
        {
          ...assetStub.livePhotoStillAsset,
          exifInfo: { livePhotoCID: assetStub.livePhotoMotionAsset.id } as ExifEntity,
        },
      ]);
      assetMock.findLivePhotoMatch.mockResolvedValue(assetStub.livePhotoMotionAsset);

      await expect(sut.handleLivePhotoLinking({ id: assetStub.livePhotoStillAsset.id })).resolves.toBe(true);
      expect(communicationMock.send).toHaveBeenCalledWith(
        CommunicationEvent.ASSET_HIDDEN,
        assetStub.livePhotoMotionAsset.ownerId,
        assetStub.livePhotoMotionAsset.id,
      );
    });
  });

  describe('handleQueueMetadataExtraction', () => {
    it('should queue metadata extraction for all assets without exif values', async () => {
      assetMock.getWithout.mockResolvedValue({ items: [assetStub.image], hasNextPage: false });

      await expect(sut.handleQueueMetadataExtraction({ force: false })).resolves.toBe(true);
      expect(assetMock.getWithout).toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.METADATA_EXTRACTION,
        data: { id: assetStub.image.id },
      });
    });

    it('should queue metadata extraction for all assets', async () => {
      assetMock.getAll.mockResolvedValue({ items: [assetStub.image], hasNextPage: false });

      await expect(sut.handleQueueMetadataExtraction({ force: true })).resolves.toBe(true);
      expect(assetMock.getAll).toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.METADATA_EXTRACTION,
        data: { id: assetStub.image.id },
      });
    });
  });

  describe('handleMetadataExtraction', () => {
    beforeEach(() => {
      storageMock.stat.mockResolvedValue({ size: 123456 } as Stats);
    });

    it('should handle an asset that could not be found', async () => {
      await expect(sut.handleMetadataExtraction({ id: assetStub.image.id })).resolves.toBe(false);

      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
      expect(assetMock.upsertExif).not.toHaveBeenCalled();
      expect(assetMock.save).not.toHaveBeenCalled();
    });

    it('should handle an asset with isVisible set to false', async () => {
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.image, isVisible: false }]);

      await expect(sut.handleMetadataExtraction({ id: assetStub.image.id })).resolves.toBe(false);
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
      expect(assetMock.upsertExif).not.toHaveBeenCalled();
      expect(assetMock.save).not.toHaveBeenCalled();
    });

    it('should handle a date in a sidecar file', async () => {
      const originalDate = new Date('2023-11-21T16:13:17.517Z');
      const sidecarDate = new Date('2022-01-01T00:00:00.000Z');
      assetMock.getByIds.mockResolvedValue([assetStub.sidecar]);
      when(metadataMock.readTags)
        .calledWith(assetStub.sidecar.originalPath)
        // higher priority tag
        .mockResolvedValue({ CreationDate: originalDate.toISOString() });
      when(metadataMock.readTags)
        .calledWith(assetStub.sidecar.sidecarPath as string)
        // lower priority tag, but in sidecar
        .mockResolvedValue({ CreateDate: sidecarDate.toISOString() });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.sidecar.id]);
      expect(assetMock.upsertExif).toHaveBeenCalledWith(expect.objectContaining({ dateTimeOriginal: sidecarDate }));
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetStub.image.id,
        duration: null,
        fileCreatedAt: sidecarDate,
        localDateTime: sidecarDate,
      });
    });

    it('should handle lists of numbers', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      metadataMock.readTags.mockResolvedValue({ ISO: [160] as any });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
      expect(assetMock.upsertExif).toHaveBeenCalledWith(expect.objectContaining({ iso: 160 }));
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetStub.image.id,
        duration: null,
        fileCreatedAt: assetStub.image.createdAt,
        localDateTime: new Date('2023-02-23T05:06:29.716Z'),
      });
    });

    it('should apply reverse geocoding', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.withLocation]);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.REVERSE_GEOCODING_ENABLED, value: true }]);
      metadataMock.reverseGeocode.mockResolvedValue({ city: 'City', state: 'State', country: 'Country' });
      metadataMock.readTags.mockResolvedValue({
        GPSLatitude: assetStub.withLocation.exifInfo!.latitude!,
        GPSLongitude: assetStub.withLocation.exifInfo!.longitude!,
      });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
      expect(assetMock.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ city: 'City', state: 'State', country: 'Country' }),
      );
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetStub.withLocation.id,
        duration: null,
        fileCreatedAt: assetStub.withLocation.createdAt,
        localDateTime: new Date('2023-02-22T05:06:29.716Z'),
      });
    });

    it('should discard latitude and longitude on null island', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.withLocation]);
      metadataMock.readTags.mockResolvedValue({
        GPSLatitude: 0,
        GPSLongitude: 0,
      });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
      expect(assetMock.upsertExif).toHaveBeenCalledWith(expect.objectContaining({ latitude: null, longitude: null }));
    });

    it('should not apply motion photos if asset is video', async () => {
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.livePhotoMotionAsset, isVisible: true }]);
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoMotionAsset.id });
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.livePhotoMotionAsset.id]);
      expect(storageMock.writeFile).not.toHaveBeenCalled();
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(assetMock.save).not.toHaveBeenCalledWith(
        expect.objectContaining({ assetType: AssetType.VIDEO, isVisible: false }),
      );
    });

    it('should extract the correct video orientation', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamVertical2160p);
      metadataMock.readTags.mockResolvedValue(null);

      await sut.handleMetadataExtraction({ id: assetStub.video.id });

      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.video.id]);
      expect(assetMock.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({ orientation: Orientation.Rotate270CW }),
      );
    });

    it('should apply motion photos', async () => {
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.livePhotoStillAsset, livePhotoVideoId: null }]);
      metadataMock.readTags.mockResolvedValue({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      storageMock.readFile.mockResolvedValue(randomBytes(512));
      cryptoRepository.hashSha1.mockReturnValue(randomBytes(512));
      assetMock.getByChecksum.mockResolvedValue(assetStub.livePhotoMotionAsset);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id });
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.livePhotoStillAsset.id]);
      expect(storageMock.readFile).toHaveBeenCalledWith(assetStub.livePhotoStillAsset.originalPath, expect.any(Object));
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
    });

    it('should create new motion asset if not found and link it with the photo', async () => {
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.livePhotoStillAsset, livePhotoVideoId: null }]);
      metadataMock.readTags.mockResolvedValue({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      const video = randomBytes(512);
      storageMock.readFile.mockResolvedValue(video);
      cryptoRepository.hashSha1.mockReturnValue(randomBytes(512));
      assetMock.create.mockResolvedValueOnce(assetStub.livePhotoMotionAsset);
      assetMock.save.mockResolvedValueOnce(assetStub.livePhotoMotionAsset);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id });
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.livePhotoStillAsset.id]);
      expect(storageMock.readFile).toHaveBeenCalledWith(assetStub.livePhotoStillAsset.originalPath, expect.any(Object));
      expect(assetMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AssetType.VIDEO,
          originalFileName: assetStub.livePhotoStillAsset.originalFileName,
          isVisible: false,
          isReadOnly: false,
        }),
      );
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
      expect(storageMock.writeFile).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.originalPath, video);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.METADATA_EXTRACTION,
        data: { id: assetStub.livePhotoMotionAsset.id },
      });
    });

    it('should save all metadata', async () => {
      const tags: ImmichTags = {
        BitsPerSample: 1,
        ComponentBitDepth: 1,
        ImagePixelDepth: '1',
        BitDepth: 1,
        ColorBitDepth: 1,
        ColorSpace: '1',
        DateTimeOriginal: new Date('1970-01-01').toISOString(),
        ExposureTime: '100ms',
        FocalLength: 20,
        ISO: 100,
        LensModel: 'test lens',
        MediaGroupUUID: 'livePhoto',
        Make: 'test-factory',
        Model: "'mockel'",
        ModifyDate: new Date('1970-01-01').toISOString(),
        Orientation: 0,
        ProfileDescription: 'extensive description',
        ProjectionType: 'equirectangular',
        tz: '+02:00',
      };
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      metadataMock.readTags.mockResolvedValue(tags);

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
      expect(assetMock.upsertExif).toHaveBeenCalledWith({
        assetId: assetStub.image.id,
        bitsPerSample: expect.any(Number),
        colorspace: tags.ColorSpace,
        dateTimeOriginal: new Date('1970-01-01'),
        exifImageHeight: null,
        exifImageWidth: null,
        exposureTime: tags.ExposureTime,
        fNumber: null,
        fileSizeInByte: 123456,
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
      });
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetStub.image.id,
        duration: null,
        fileCreatedAt: new Date('1970-01-01'),
        localDateTime: new Date('1970-01-01'),
      });
    });

    it('should handle duration', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      metadataMock.readTags.mockResolvedValue({ Duration: 6.21 });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
      expect(assetMock.upsertExif).toHaveBeenCalled();
      expect(assetMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.image.id,
          duration: '00:00:06.210',
        }),
      );
    });

    it('should handle duration as an object without Scale', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      metadataMock.readTags.mockResolvedValue({ Duration: { Value: 6.2 } });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
      expect(assetMock.upsertExif).toHaveBeenCalled();
      expect(assetMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.image.id,
          duration: '00:00:06.200',
        }),
      );
    });

    it('should handle duration with scale', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      metadataMock.readTags.mockResolvedValue({ Duration: { Scale: 1.11111111111111e-5, Value: 558720 } });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
      expect(assetMock.upsertExif).toHaveBeenCalled();
      expect(assetMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.image.id,
          duration: '00:00:06.207',
        }),
      );
    });
  });

  describe('handleQueueSidecar', () => {
    it('should queue assets with sidecar files', async () => {
      assetMock.getWith.mockResolvedValue({ items: [assetStub.sidecar], hasNextPage: false });

      await sut.handleQueueSidecar({ force: true });

      expect(assetMock.getWith).toHaveBeenCalledWith({ take: 1000, skip: 0 }, WithProperty.SIDECAR);
      expect(assetMock.getWithout).not.toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.SIDECAR_SYNC,
        data: { id: assetStub.sidecar.id },
      });
    });

    it('should queue assets without sidecar files', async () => {
      assetMock.getWithout.mockResolvedValue({ items: [assetStub.image], hasNextPage: false });

      await sut.handleQueueSidecar({ force: false });

      expect(assetMock.getWithout).toHaveBeenCalledWith({ take: 1000, skip: 0 }, WithoutProperty.SIDECAR);
      expect(assetMock.getWith).not.toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.SIDECAR_DISCOVERY,
        data: { id: assetStub.image.id },
      });
    });
  });

  describe('handleSidecarSync', () => {
    it('should not error', async () => {
      await sut.handleSidecarSync();
    });
  });

  describe('handleSidecarDiscovery', () => {
    it('should skip hidden assets', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.livePhotoMotionAsset]);
      await sut.handleSidecarDiscovery({ id: assetStub.livePhotoMotionAsset.id });
      expect(storageMock.checkFileExists).not.toHaveBeenCalled();
    });

    it('should skip assets with a sidecar path', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.sidecar]);
      await sut.handleSidecarDiscovery({ id: assetStub.sidecar.id });
      expect(storageMock.checkFileExists).not.toHaveBeenCalled();
    });

    it('should do nothing when a sidecar is not found ', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      storageMock.checkFileExists.mockResolvedValue(false);
      await sut.handleSidecarDiscovery({ id: assetStub.image.id });
      expect(assetMock.save).not.toHaveBeenCalled();
    });

    it('should update a image asset when a sidecar is found', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      assetMock.save.mockResolvedValue(assetStub.image);
      storageMock.checkFileExists.mockResolvedValue(true);
      await sut.handleSidecarDiscovery({ id: assetStub.image.id });
      expect(storageMock.checkFileExists).toHaveBeenCalledWith('/original/path.jpg.xmp', constants.R_OK);
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetStub.image.id,
        sidecarPath: '/original/path.jpg.xmp',
      });
    });

    it('should update a video asset when a sidecar is found', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      assetMock.save.mockResolvedValue(assetStub.video);
      storageMock.checkFileExists.mockResolvedValue(true);
      await sut.handleSidecarDiscovery({ id: assetStub.video.id });
      expect(storageMock.checkFileExists).toHaveBeenCalledWith('/original/path.ext.xmp', constants.R_OK);
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetStub.image.id,
        sidecarPath: '/original/path.ext.xmp',
      });
    });
  });

  describe('handleSidecarWrite', () => {
    it('should skip assets that do not exist anymore', async () => {
      assetMock.getByIds.mockResolvedValue([]);
      await expect(sut.handleSidecarWrite({ id: 'asset-123' })).resolves.toBe(false);
      expect(metadataMock.writeTags).not.toHaveBeenCalled();
    });

    it('should skip jobs with not metadata', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.sidecar]);
      await expect(sut.handleSidecarWrite({ id: assetStub.sidecar.id })).resolves.toBe(true);
      expect(metadataMock.writeTags).not.toHaveBeenCalled();
    });

    it('should write tags', async () => {
      const description = 'this is a description';
      const gps = 12;
      const date = '2023-11-22T04:56:12.196Z';

      assetMock.getByIds.mockResolvedValue([assetStub.sidecar]);
      await expect(
        sut.handleSidecarWrite({
          id: assetStub.sidecar.id,
          description,
          latitude: gps,
          longitude: gps,
          dateTimeOriginal: date,
        }),
      ).resolves.toBe(true);
      expect(metadataMock.writeTags).toHaveBeenCalledWith(assetStub.sidecar.sidecarPath, {
        ImageDescription: description,
        CreationDate: date,
        GPSLatitude: gps,
        GPSLongitude: gps,
      });
    });
  });
});

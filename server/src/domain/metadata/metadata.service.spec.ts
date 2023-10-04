import { AssetType, CitiesFile, ExifEntity, SystemConfigKey } from '@app/infra/entities';
import {
  assetStub,
  newAlbumRepositoryMock,
  newAssetRepositoryMock,
  newCryptoRepositoryMock,
  newJobRepositoryMock,
  newMetadataRepositoryMock,
  newStorageRepositoryMock,
  newSystemConfigRepositoryMock,
} from '@test';
import { randomBytes } from 'crypto';
import { Stats } from 'fs';
import { constants } from 'fs/promises';
import { IAlbumRepository } from '../album';
import { IAssetRepository, WithProperty, WithoutProperty } from '../asset';
import { ICryptoRepository } from '../crypto';
import { IJobRepository, JobName, QueueName } from '../job';
import { IStorageRepository } from '../storage';
import { ISystemConfigRepository } from '../system-config';
import { IMetadataRepository, ImmichTags } from './metadata.repository';
import { MetadataService } from './metadata.service';

describe(MetadataService.name, () => {
  let albumMock: jest.Mocked<IAlbumRepository>;
  let assetMock: jest.Mocked<IAssetRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let cryptoRepository: jest.Mocked<ICryptoRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let metadataMock: jest.Mocked<IMetadataRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;
  let sut: MetadataService;

  beforeEach(async () => {
    albumMock = newAlbumRepositoryMock();
    assetMock = newAssetRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    cryptoRepository = newCryptoRepositoryMock();
    jobMock = newJobRepositoryMock();
    metadataMock = newMetadataRepositoryMock();
    storageMock = newStorageRepositoryMock();

    sut = new MetadataService(albumMock, assetMock, cryptoRepository, jobMock, metadataMock, storageMock, configMock);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('init', () => {
    beforeEach(async () => {
      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.REVERSE_GEOCODING_ENABLED, value: true },
        { key: SystemConfigKey.REVERSE_GEOCODING_CITIES_FILE_OVERRIDE, value: CitiesFile.CITIES_500 },
      ]);

      await sut.init();
    });

    it('should return if reverse geocoding is disabled', async () => {
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.REVERSE_GEOCODING_ENABLED, value: false }]);

      await sut.init();
      expect(metadataMock.deleteCache).not.toHaveBeenCalled();
      expect(jobMock.pause).toHaveBeenCalledTimes(1);
      expect(metadataMock.init).toHaveBeenCalledTimes(1);
      expect(jobMock.resume).toHaveBeenCalledTimes(1);
    });

    it('should return if deleteCache is false and the cities precision has not changed', async () => {
      await sut.init();

      expect(metadataMock.deleteCache).not.toHaveBeenCalled();
      expect(jobMock.pause).toHaveBeenCalledTimes(1);
      expect(metadataMock.init).toHaveBeenCalledTimes(1);
      expect(jobMock.resume).toHaveBeenCalledTimes(1);
    });

    it('should re-init if deleteCache is false but the cities precision has changed', async () => {
      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.REVERSE_GEOCODING_CITIES_FILE_OVERRIDE, value: CitiesFile.CITIES_1000 },
      ]);

      await sut.init();

      expect(metadataMock.deleteCache).not.toHaveBeenCalled();
      expect(jobMock.pause).toHaveBeenCalledWith(QueueName.METADATA_EXTRACTION);
      expect(metadataMock.init).toHaveBeenCalledWith({ citiesFileOverride: CitiesFile.CITIES_1000 });
      expect(jobMock.resume).toHaveBeenCalledWith(QueueName.METADATA_EXTRACTION);
    });

    it('should re-init and delete cache if deleteCache is true', async () => {
      await sut.init(true);

      expect(metadataMock.deleteCache).toHaveBeenCalled();
      expect(jobMock.pause).toHaveBeenCalledWith(QueueName.METADATA_EXTRACTION);
      expect(metadataMock.init).toHaveBeenCalledWith({ citiesFileOverride: CitiesFile.CITIES_500 });
      expect(jobMock.resume).toHaveBeenCalledWith(QueueName.METADATA_EXTRACTION);
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

    it('should handle lists of numbers', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      metadataMock.getExifTags.mockResolvedValue({ ISO: [160] as any });

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
      metadataMock.getExifTags.mockResolvedValue({
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
        localDateTime: new Date('2023-02-23T05:06:29.716Z'),
      });
    });

    it('should not apply motion photos if asset is video', async () => {
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.livePhotoMotionAsset, isVisible: true }]);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoMotionAsset.id });
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.livePhotoMotionAsset.id]);
      expect(storageMock.writeFile).not.toHaveBeenCalled();
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(assetMock.save).not.toHaveBeenCalledWith(
        expect.objectContaining({ assetType: AssetType.VIDEO, isVisible: false }),
      );
    });

    it('should apply motion photos', async () => {
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.livePhotoStillAsset, livePhotoVideoId: null }]);
      metadataMock.getExifTags.mockResolvedValue({
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
      metadataMock.getExifTags.mockResolvedValue({
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
          isReadOnly: true,
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
      metadataMock.getExifTags.mockResolvedValue(tags);

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
});

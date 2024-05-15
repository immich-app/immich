import { BinaryField } from 'exiftool-vendored';
import { randomBytes } from 'node:crypto';
import { Stats } from 'node:fs';
import { constants } from 'node:fs/promises';
import { AssetType } from 'src/entities/asset.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { IAssetRepository, WithoutProperty } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { IDatabaseRepository } from 'src/interfaces/database.interface';
import { ClientEvent, IEventRepository } from 'src/interfaces/event.interface';
import { IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMediaRepository } from 'src/interfaces/media.interface';
import { IMetadataRepository, ImmichTags } from 'src/interfaces/metadata.interface';
import { IMoveRepository } from 'src/interfaces/move.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { MetadataService, Orientation } from 'src/services/metadata.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { fileStub } from 'test/fixtures/file.stub';
import { probeStub } from 'test/fixtures/media.stub';
import { newAlbumRepositoryMock } from 'test/repositories/album.repository.mock';
import { newAssetRepositoryMock } from 'test/repositories/asset.repository.mock';
import { newCryptoRepositoryMock } from 'test/repositories/crypto.repository.mock';
import { newDatabaseRepositoryMock } from 'test/repositories/database.repository.mock';
import { newEventRepositoryMock } from 'test/repositories/event.repository.mock';
import { newJobRepositoryMock } from 'test/repositories/job.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newMediaRepositoryMock } from 'test/repositories/media.repository.mock';
import { newMetadataRepositoryMock } from 'test/repositories/metadata.repository.mock';
import { newMoveRepositoryMock } from 'test/repositories/move.repository.mock';
import { newPersonRepositoryMock } from 'test/repositories/person.repository.mock';
import { newStorageRepositoryMock } from 'test/repositories/storage.repository.mock';
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { newUserRepositoryMock } from 'test/repositories/user.repository.mock';
import { Mocked } from 'vitest';

describe(MetadataService.name, () => {
  let albumMock: Mocked<IAlbumRepository>;
  let assetMock: Mocked<IAssetRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let cryptoRepository: Mocked<ICryptoRepository>;
  let jobMock: Mocked<IJobRepository>;
  let metadataMock: Mocked<IMetadataRepository>;
  let moveMock: Mocked<IMoveRepository>;
  let mediaMock: Mocked<IMediaRepository>;
  let personMock: Mocked<IPersonRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let eventMock: Mocked<IEventRepository>;
  let databaseMock: Mocked<IDatabaseRepository>;
  let userMock: Mocked<IUserRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let sut: MetadataService;

  beforeEach(() => {
    albumMock = newAlbumRepositoryMock();
    assetMock = newAssetRepositoryMock();
    cryptoRepository = newCryptoRepositoryMock();
    jobMock = newJobRepositoryMock();
    metadataMock = newMetadataRepositoryMock();
    moveMock = newMoveRepositoryMock();
    personMock = newPersonRepositoryMock();
    eventMock = newEventRepositoryMock();
    storageMock = newStorageRepositoryMock();
    systemMock = newSystemMetadataRepositoryMock();
    mediaMock = newMediaRepositoryMock();
    databaseMock = newDatabaseRepositoryMock();
    userMock = newUserRepositoryMock();
    loggerMock = newLoggerRepositoryMock();

    sut = new MetadataService(
      albumMock,
      assetMock,
      eventMock,
      cryptoRepository,
      databaseMock,
      jobMock,
      mediaMock,
      metadataMock,
      moveMock,
      personMock,
      storageMock,
      systemMock,
      userMock,
      loggerMock,
    );
  });

  afterEach(async () => {
    await sut.teardown();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('init', () => {
    it('should pause and resume queue during init', async () => {
      await sut.init();

      expect(jobMock.pause).toHaveBeenCalledTimes(1);
      expect(metadataMock.init).toHaveBeenCalledTimes(1);
      expect(jobMock.resume).toHaveBeenCalledTimes(1);
    });

    it('should return if reverse geocoding is disabled', async () => {
      systemMock.get.mockResolvedValue({ reverseGeocoding: { enabled: false } });

      await sut.init();

      expect(jobMock.pause).not.toHaveBeenCalled();
      expect(metadataMock.init).not.toHaveBeenCalled();
      expect(jobMock.resume).not.toHaveBeenCalled();
    });
  });

  describe('handleLivePhotoLinking', () => {
    it('should handle an asset that could not be found', async () => {
      await expect(sut.handleLivePhotoLinking({ id: assetStub.image.id })).resolves.toBe(JobStatus.FAILED);
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id], { exifInfo: true });
      expect(assetMock.findLivePhotoMatch).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalled();
      expect(albumMock.removeAsset).not.toHaveBeenCalled();
    });

    it('should handle an asset without exif info', async () => {
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.image, exifInfo: undefined }]);

      await expect(sut.handleLivePhotoLinking({ id: assetStub.image.id })).resolves.toBe(JobStatus.FAILED);
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id], { exifInfo: true });
      expect(assetMock.findLivePhotoMatch).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalled();
      expect(albumMock.removeAsset).not.toHaveBeenCalled();
    });

    it('should handle livePhotoCID not set', async () => {
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.image }]);

      await expect(sut.handleLivePhotoLinking({ id: assetStub.image.id })).resolves.toBe(JobStatus.SKIPPED);
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id], { exifInfo: true });
      expect(assetMock.findLivePhotoMatch).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalled();
      expect(albumMock.removeAsset).not.toHaveBeenCalled();
    });

    it('should handle not finding a match', async () => {
      assetMock.getByIds.mockResolvedValue([
        {
          ...assetStub.livePhotoMotionAsset,
          exifInfo: { livePhotoCID: assetStub.livePhotoStillAsset.id } as ExifEntity,
        },
      ]);

      await expect(sut.handleLivePhotoLinking({ id: assetStub.livePhotoMotionAsset.id })).resolves.toBe(
        JobStatus.SKIPPED,
      );
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.livePhotoMotionAsset.id], { exifInfo: true });
      expect(assetMock.findLivePhotoMatch).toHaveBeenCalledWith({
        livePhotoCID: assetStub.livePhotoStillAsset.id,
        ownerId: assetStub.livePhotoMotionAsset.ownerId,
        otherAssetId: assetStub.livePhotoMotionAsset.id,
        type: AssetType.IMAGE,
      });
      expect(assetMock.update).not.toHaveBeenCalled();
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

      await expect(sut.handleLivePhotoLinking({ id: assetStub.livePhotoStillAsset.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.livePhotoStillAsset.id], { exifInfo: true });
      expect(assetMock.findLivePhotoMatch).toHaveBeenCalledWith({
        livePhotoCID: assetStub.livePhotoMotionAsset.id,
        ownerId: assetStub.livePhotoStillAsset.ownerId,
        otherAssetId: assetStub.livePhotoStillAsset.id,
        type: AssetType.VIDEO,
      });
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
      expect(assetMock.update).toHaveBeenCalledWith({ id: assetStub.livePhotoMotionAsset.id, isVisible: false });
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

      await expect(sut.handleLivePhotoLinking({ id: assetStub.livePhotoStillAsset.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );
      expect(eventMock.clientSend).toHaveBeenCalledWith(
        ClientEvent.ASSET_HIDDEN,
        assetStub.livePhotoMotionAsset.ownerId,
        assetStub.livePhotoMotionAsset.id,
      );
    });
  });

  describe('handleQueueMetadataExtraction', () => {
    it('should queue metadata extraction for all assets without exif values', async () => {
      assetMock.getWithout.mockResolvedValue({ items: [assetStub.image], hasNextPage: false });

      await expect(sut.handleQueueMetadataExtraction({ force: false })).resolves.toBe(JobStatus.SUCCESS);
      expect(assetMock.getWithout).toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.METADATA_EXTRACTION,
          data: { id: assetStub.image.id },
        },
      ]);
    });

    it('should queue metadata extraction for all assets', async () => {
      assetMock.getAll.mockResolvedValue({ items: [assetStub.image], hasNextPage: false });

      await expect(sut.handleQueueMetadataExtraction({ force: true })).resolves.toBe(JobStatus.SUCCESS);
      expect(assetMock.getAll).toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.METADATA_EXTRACTION,
          data: { id: assetStub.image.id },
        },
      ]);
    });
  });

  describe('handleMetadataExtraction', () => {
    beforeEach(() => {
      storageMock.stat.mockResolvedValue({ size: 123_456 } as Stats);
    });

    it('should handle an asset that could not be found', async () => {
      await expect(sut.handleMetadataExtraction({ id: assetStub.image.id })).resolves.toBe(JobStatus.FAILED);

      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
      expect(assetMock.upsertExif).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalled();
    });

    it('should handle a date in a sidecar file', async () => {
      const originalDate = new Date('2023-11-21T16:13:17.517Z');
      const sidecarDate = new Date('2022-01-01T00:00:00.000Z');
      assetMock.getByIds.mockResolvedValue([assetStub.sidecar]);
      metadataMock.readTags.mockImplementation((path) => {
        const map = {
          [assetStub.sidecar.originalPath]: originalDate.toISOString(),
          [assetStub.sidecar.sidecarPath as string]: sidecarDate.toISOString(),
        };
        return Promise.resolve({ CreationDate: map[path] ?? new Date().toISOString() });
      });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.sidecar.id]);
      expect(assetMock.upsertExif).toHaveBeenCalledWith(expect.objectContaining({ dateTimeOriginal: sidecarDate }));
      expect(assetMock.update).toHaveBeenCalledWith({
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
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        duration: null,
        fileCreatedAt: assetStub.image.createdAt,
        localDateTime: new Date('2023-02-23T05:06:29.716Z'),
      });
    });

    it('should apply reverse geocoding', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.withLocation]);
      systemMock.get.mockResolvedValue({ reverseGeocoding: { enabled: true } });
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
      expect(assetMock.update).toHaveBeenCalledWith({
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
      expect(jobMock.queueAll).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalledWith(
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

    it('should extract the MotionPhotoVideo tag from Samsung HEIC motion photos', async () => {
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.livePhotoStillAsset, livePhotoVideoId: null }]);
      metadataMock.readTags.mockResolvedValue({
        Directory: 'foo/bar/',
        MotionPhotoVideo: new BinaryField(0, ''),
        // The below two are included to ensure that the MotionPhotoVideo tag is extracted
        // instead of the EmbeddedVideoFile, since HEIC MotionPhotos include both
        EmbeddedVideoFile: new BinaryField(0, ''),
        EmbeddedVideoType: 'MotionPhoto_Data',
      });
      cryptoRepository.hashSha1.mockReturnValue(randomBytes(512));
      assetMock.getByChecksum.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.livePhotoMotionAsset);
      cryptoRepository.randomUUID.mockReturnValue(fileStub.livePhotoMotion.uuid);
      const video = randomBytes(512);
      metadataMock.extractBinaryTag.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id });
      expect(metadataMock.extractBinaryTag).toHaveBeenCalledWith(
        assetStub.livePhotoStillAsset.originalPath,
        'MotionPhotoVideo',
      );
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.livePhotoStillAsset.id]);
      expect(assetMock.create).toHaveBeenCalled(); // This could have arguments added
      expect(userMock.updateUsage).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.ownerId, 512);
      expect(storageMock.writeFile).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.originalPath, video);
      expect(assetMock.update).toHaveBeenNthCalledWith(1, {
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: fileStub.livePhotoMotion.uuid,
      });
    });

    it('should extract the EmbeddedVideo tag from Samsung JPEG motion photos', async () => {
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.livePhotoStillAsset, livePhotoVideoId: null }]);
      metadataMock.readTags.mockResolvedValue({
        Directory: 'foo/bar/',
        EmbeddedVideoFile: new BinaryField(0, ''),
        EmbeddedVideoType: 'MotionPhoto_Data',
      });
      cryptoRepository.hashSha1.mockReturnValue(randomBytes(512));
      assetMock.getByChecksum.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.livePhotoMotionAsset);
      cryptoRepository.randomUUID.mockReturnValue(fileStub.livePhotoMotion.uuid);
      const video = randomBytes(512);
      metadataMock.extractBinaryTag.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id });
      expect(metadataMock.extractBinaryTag).toHaveBeenCalledWith(
        assetStub.livePhotoStillAsset.originalPath,
        'EmbeddedVideoFile',
      );
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.livePhotoStillAsset.id]);
      expect(assetMock.create).toHaveBeenCalled(); // This could have arguments added
      expect(userMock.updateUsage).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.ownerId, 512);
      expect(storageMock.writeFile).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.originalPath, video);
      expect(assetMock.update).toHaveBeenNthCalledWith(1, {
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: fileStub.livePhotoMotion.uuid,
      });
    });

    it('should extract the motion photo video from the XMP directory entry ', async () => {
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.livePhotoStillAsset, livePhotoVideoId: null }]);
      metadataMock.readTags.mockResolvedValue({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      cryptoRepository.hashSha1.mockReturnValue(randomBytes(512));
      assetMock.getByChecksum.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.livePhotoMotionAsset);
      cryptoRepository.randomUUID.mockReturnValue(fileStub.livePhotoMotion.uuid);
      const video = randomBytes(512);
      storageMock.readFile.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id });
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.livePhotoStillAsset.id]);
      expect(storageMock.readFile).toHaveBeenCalledWith(assetStub.livePhotoStillAsset.originalPath, expect.any(Object));
      expect(assetMock.create).toHaveBeenCalled(); // This could have arguments added
      expect(userMock.updateUsage).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.ownerId, 512);
      expect(storageMock.writeFile).toHaveBeenCalledWith(assetStub.livePhotoMotionAsset.originalPath, video);
      expect(assetMock.update).toHaveBeenNthCalledWith(1, {
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: fileStub.livePhotoMotion.uuid,
      });
    });

    it('should delete old motion photo video assets if they do not match what is extracted', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.livePhotoStillAsset]);
      metadataMock.readTags.mockResolvedValue({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      cryptoRepository.hashSha1.mockReturnValue(randomBytes(512));
      assetMock.getByChecksum.mockResolvedValue(null);
      assetMock.create.mockImplementation((asset) => Promise.resolve({ ...assetStub.livePhotoMotionAsset, ...asset }));
      const video = randomBytes(512);
      storageMock.readFile.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id });
      expect(jobMock.queue).toHaveBeenNthCalledWith(1, {
        name: JobName.ASSET_DELETION,
        data: { id: assetStub.livePhotoStillAsset.livePhotoVideoId },
      });
      expect(jobMock.queue).toHaveBeenNthCalledWith(2, {
        name: JobName.METADATA_EXTRACTION,
        data: { id: 'random-uuid' },
      });
    });

    it('should not create a new motion photo video asset if the hash of the extracted video matches an existing asset', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.livePhotoStillAsset]);
      metadataMock.readTags.mockResolvedValue({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      cryptoRepository.hashSha1.mockReturnValue(randomBytes(512));
      assetMock.getByChecksum.mockResolvedValue(assetStub.livePhotoMotionAsset);
      const video = randomBytes(512);
      storageMock.readFile.mockResolvedValue(video);
      storageMock.checkFileExists.mockResolvedValue(true);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id });
      expect(assetMock.create).toHaveBeenCalledTimes(0);
      expect(storageMock.writeFile).toHaveBeenCalledTimes(0);
      // The still asset gets saved by handleMetadataExtraction, but not the video
      expect(assetMock.update).toHaveBeenCalledTimes(1);
      expect(jobMock.queue).toHaveBeenCalledTimes(0);
    });

    it('should link and hide motion video asset to still asset if the hash of the extracted video matches an existing asset', async () => {
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.livePhotoStillAsset, livePhotoVideoId: null }]);
      metadataMock.readTags.mockResolvedValue({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      cryptoRepository.hashSha1.mockReturnValue(randomBytes(512));
      assetMock.getByChecksum.mockResolvedValue({ ...assetStub.livePhotoMotionAsset, isVisible: true });
      const video = randomBytes(512);
      storageMock.readFile.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id });
      expect(assetMock.update).toHaveBeenNthCalledWith(1, {
        id: assetStub.livePhotoMotionAsset.id,
        isVisible: false,
      });
      expect(assetMock.update).toHaveBeenNthCalledWith(2, {
        id: assetStub.livePhotoStillAsset.id,
        livePhotoVideoId: assetStub.livePhotoMotionAsset.id,
      });
    });

    it('should not update storage usage if motion photo is external', async () => {
      assetMock.getByIds.mockResolvedValue([
        { ...assetStub.livePhotoStillAsset, livePhotoVideoId: null, isExternal: true },
      ]);
      metadataMock.readTags.mockResolvedValue({
        Directory: 'foo/bar/',
        MotionPhoto: 1,
        MicroVideo: 1,
        MicroVideoOffset: 1,
      });
      cryptoRepository.hashSha1.mockReturnValue(randomBytes(512));
      assetMock.getByChecksum.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.livePhotoMotionAsset);
      const video = randomBytes(512);
      storageMock.readFile.mockResolvedValue(video);

      await sut.handleMetadataExtraction({ id: assetStub.livePhotoStillAsset.id });
      expect(userMock.updateUsage).not.toHaveBeenCalled();
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
        ImageDescription: 'test description',
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
        autoStackId: null,
        colorspace: tags.ColorSpace,
        dateTimeOriginal: new Date('1970-01-01'),
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
      });
      expect(assetMock.update).toHaveBeenCalledWith({
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
      expect(assetMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.image.id,
          duration: '00:00:06.210',
        }),
      );
    });

    it('should handle duration in ISO time string', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      metadataMock.readTags.mockResolvedValue({ Duration: '00:00:08.41' });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
      expect(assetMock.upsertExif).toHaveBeenCalled();
      expect(assetMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.image.id,
          duration: '00:00:08.410',
        }),
      );
    });

    it('should handle duration as an object without Scale', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      metadataMock.readTags.mockResolvedValue({ Duration: { Value: 6.2 } });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
      expect(assetMock.upsertExif).toHaveBeenCalled();
      expect(assetMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.image.id,
          duration: '00:00:06.200',
        }),
      );
    });

    it('should handle duration with scale', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      metadataMock.readTags.mockResolvedValue({ Duration: { Scale: 1.111_111_111_111_11e-5, Value: 558_720 } });

      await sut.handleMetadataExtraction({ id: assetStub.image.id });

      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
      expect(assetMock.upsertExif).toHaveBeenCalled();
      expect(assetMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetStub.image.id,
          duration: '00:00:06.207',
        }),
      );
    });
  });

  describe('handleQueueSidecar', () => {
    it('should queue assets with sidecar files', async () => {
      assetMock.getAll.mockResolvedValue({ items: [assetStub.sidecar], hasNextPage: false });

      await sut.handleQueueSidecar({ force: true });

      expect(assetMock.getAll).toHaveBeenCalledWith({ take: 1000, skip: 0 });
      expect(assetMock.getWithout).not.toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.SIDECAR_SYNC,
          data: { id: assetStub.sidecar.id },
        },
      ]);
    });

    it('should queue assets without sidecar files', async () => {
      assetMock.getWithout.mockResolvedValue({ items: [assetStub.image], hasNextPage: false });

      await sut.handleQueueSidecar({ force: false });

      expect(assetMock.getWithout).toHaveBeenCalledWith({ take: 1000, skip: 0 }, WithoutProperty.SIDECAR);
      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.SIDECAR_DISCOVERY,
          data: { id: assetStub.image.id },
        },
      ]);
    });
  });

  describe('handleSidecarSync', () => {
    it('should do nothing if asset could not be found', async () => {
      assetMock.getByIds.mockResolvedValue([]);
      await expect(sut.handleSidecarSync({ id: assetStub.image.id })).resolves.toBe(JobStatus.FAILED);
      expect(assetMock.update).not.toHaveBeenCalled();
    });

    it('should do nothing if asset has no sidecar path', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      await expect(sut.handleSidecarSync({ id: assetStub.image.id })).resolves.toBe(JobStatus.FAILED);
      expect(assetMock.update).not.toHaveBeenCalled();
    });

    it('should set sidecar path if exists (sidecar named photo.ext.xmp)', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.sidecar]);
      storageMock.checkFileExists.mockResolvedValue(true);

      await expect(sut.handleSidecarSync({ id: assetStub.sidecar.id })).resolves.toBe(JobStatus.SUCCESS);
      expect(storageMock.checkFileExists).toHaveBeenCalledWith(`${assetStub.sidecar.originalPath}.xmp`, constants.R_OK);
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.sidecar.id,
        sidecarPath: assetStub.sidecar.sidecarPath,
      });
    });

    it('should set sidecar path if exists (sidecar named photo.xmp)', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.sidecarWithoutExt]);
      storageMock.checkFileExists.mockResolvedValueOnce(false);
      storageMock.checkFileExists.mockResolvedValueOnce(true);

      await expect(sut.handleSidecarSync({ id: assetStub.sidecarWithoutExt.id })).resolves.toBe(JobStatus.SUCCESS);
      expect(storageMock.checkFileExists).toHaveBeenNthCalledWith(
        2,
        assetStub.sidecarWithoutExt.sidecarPath,
        constants.R_OK,
      );
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.sidecarWithoutExt.id,
        sidecarPath: assetStub.sidecarWithoutExt.sidecarPath,
      });
    });

    it('should set sidecar path if exists (two sidecars named photo.ext.xmp and photo.xmp, should pick photo.ext.xmp)', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.sidecar]);
      storageMock.checkFileExists.mockResolvedValueOnce(true);
      storageMock.checkFileExists.mockResolvedValueOnce(true);

      await expect(sut.handleSidecarSync({ id: assetStub.sidecar.id })).resolves.toBe(JobStatus.SUCCESS);
      expect(storageMock.checkFileExists).toHaveBeenNthCalledWith(1, assetStub.sidecar.sidecarPath, constants.R_OK);
      expect(storageMock.checkFileExists).toHaveBeenNthCalledWith(
        2,
        assetStub.sidecarWithoutExt.sidecarPath,
        constants.R_OK,
      );
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.sidecar.id,
        sidecarPath: assetStub.sidecar.sidecarPath,
      });
    });

    it('should unset sidecar path if file does not exist anymore', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.sidecar]);
      storageMock.checkFileExists.mockResolvedValue(false);

      await expect(sut.handleSidecarSync({ id: assetStub.sidecar.id })).resolves.toBe(JobStatus.SUCCESS);
      expect(storageMock.checkFileExists).toHaveBeenCalledWith(`${assetStub.sidecar.originalPath}.xmp`, constants.R_OK);
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.sidecar.id,
        sidecarPath: null,
      });
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
      expect(assetMock.update).not.toHaveBeenCalled();
    });

    it('should update a image asset when a sidecar is found', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      storageMock.checkFileExists.mockResolvedValue(true);
      await sut.handleSidecarDiscovery({ id: assetStub.image.id });
      expect(storageMock.checkFileExists).toHaveBeenCalledWith('/original/path.jpg.xmp', constants.R_OK);
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        sidecarPath: '/original/path.jpg.xmp',
      });
    });

    it('should update a video asset when a sidecar is found', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      storageMock.checkFileExists.mockResolvedValue(true);
      await sut.handleSidecarDiscovery({ id: assetStub.video.id });
      expect(storageMock.checkFileExists).toHaveBeenCalledWith('/original/path.ext.xmp', constants.R_OK);
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        sidecarPath: '/original/path.ext.xmp',
      });
    });
  });

  describe('handleSidecarWrite', () => {
    it('should skip assets that do not exist anymore', async () => {
      assetMock.getByIds.mockResolvedValue([]);
      await expect(sut.handleSidecarWrite({ id: 'asset-123' })).resolves.toBe(JobStatus.FAILED);
      expect(metadataMock.writeTags).not.toHaveBeenCalled();
    });

    it('should skip jobs with not metadata', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.sidecar]);
      await expect(sut.handleSidecarWrite({ id: assetStub.sidecar.id })).resolves.toBe(JobStatus.SKIPPED);
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
      ).resolves.toBe(JobStatus.SUCCESS);
      expect(metadataMock.writeTags).toHaveBeenCalledWith(assetStub.sidecar.sidecarPath, {
        ImageDescription: description,
        CreationDate: date,
        GPSLatitude: gps,
        GPSLongitude: gps,
      });
    });
  });
});

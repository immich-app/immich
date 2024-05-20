import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ImageFormat } from 'src/config';
import { FACE_THUMBNAIL_SIZE } from 'src/constants';
import { AccessCore, Permission } from 'src/cores/access.core';
import { StorageCore } from 'src/cores/storage.core';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { BulkIdErrorReason, BulkIdResponseDto } from 'src/dtos/asset-ids.response.dto';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AssetFaceResponseDto,
  AssetFaceUpdateDto,
  FaceDto,
  MergePersonDto,
  PeopleResponseDto,
  PeopleUpdateDto,
  PersonCreateDto,
  PersonResponseDto,
  PersonSearchDto,
  PersonStatisticsResponseDto,
  PersonUpdateDto,
  mapFaces,
  mapPerson,
} from 'src/dtos/person.dto';
import { PersonPathType } from 'src/entities/move.entity';
import { PersonEntity } from 'src/entities/person.entity';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IAssetRepository, WithoutProperty } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import {
  IBaseJob,
  IDeferrableJob,
  IEntityJob,
  IJobRepository,
  JOBS_ASSET_PAGINATION_SIZE,
  JobItem,
  JobName,
  JobStatus,
  QueueName,
} from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMachineLearningRepository } from 'src/interfaces/machine-learning.interface';
import { CropOptions, IMediaRepository, ImageDimensions } from 'src/interfaces/media.interface';
import { IMoveRepository } from 'src/interfaces/move.interface';
import { IPersonRepository, UpdateFacesData } from 'src/interfaces/person.interface';
import { ISearchRepository } from 'src/interfaces/search.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { Orientation } from 'src/services/metadata.service';
import { CacheControl, ImmichFileResponse } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';
import { isFacialRecognitionEnabled } from 'src/utils/misc';
import { usePagination } from 'src/utils/pagination';
import { IsNull } from 'typeorm';

@Injectable()
export class PersonService {
  private access: AccessCore;
  private configCore: SystemConfigCore;
  private storageCore: StorageCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IMachineLearningRepository) private machineLearningRepository: IMachineLearningRepository,
    @Inject(IMoveRepository) moveRepository: IMoveRepository,
    @Inject(IMediaRepository) private mediaRepository: IMediaRepository,
    @Inject(IPersonRepository) private repository: IPersonRepository,
    @Inject(ISystemMetadataRepository) systemMetadataRepository: ISystemMetadataRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ISearchRepository) private smartInfoRepository: ISearchRepository,
    @Inject(ICryptoRepository) cryptoRepository: ICryptoRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
    this.logger.setContext(PersonService.name);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, this.logger);
    this.storageCore = StorageCore.create(
      assetRepository,
      cryptoRepository,
      moveRepository,
      repository,
      storageRepository,
      systemMetadataRepository,
      this.logger,
    );
  }

  async getAll(auth: AuthDto, dto: PersonSearchDto): Promise<PeopleResponseDto> {
    const { machineLearning } = await this.configCore.getConfig();
    const people = await this.repository.getAllForUser(auth.user.id, {
      minimumFaceCount: machineLearning.facialRecognition.minFaces,
      withHidden: dto.withHidden || false,
    });
    const { total, hidden } = await this.repository.getNumberOfPeople(auth.user.id);

    return {
      people: people.map((person) => mapPerson(person)),
      total,
      hidden,
    };
  }

  async reassignFaces(auth: AuthDto, personId: string, dto: AssetFaceUpdateDto): Promise<PersonResponseDto[]> {
    await this.access.requirePermission(auth, Permission.PERSON_WRITE, personId);
    const person = await this.findOrFail(personId);
    const result: PersonResponseDto[] = [];
    const changeFeaturePhoto: string[] = [];
    for (const data of dto.data) {
      const faces = await this.repository.getFacesByIds([{ personId: data.personId, assetId: data.assetId }]);

      for (const face of faces) {
        await this.access.requirePermission(auth, Permission.PERSON_CREATE, face.id);
        if (person.faceAssetId === null) {
          changeFeaturePhoto.push(person.id);
        }
        if (face.person && face.person.faceAssetId === face.id) {
          changeFeaturePhoto.push(face.person.id);
        }

        await this.repository.reassignFace(face.id, personId);
      }

      result.push(person);
    }
    if (changeFeaturePhoto.length > 0) {
      // Remove duplicates
      await this.createNewFeaturePhoto([...new Set(changeFeaturePhoto)]);
    }
    return result;
  }

  async reassignFacesById(auth: AuthDto, personId: string, dto: FaceDto): Promise<PersonResponseDto> {
    await this.access.requirePermission(auth, Permission.PERSON_WRITE, personId);

    await this.access.requirePermission(auth, Permission.PERSON_CREATE, dto.id);
    const face = await this.repository.getFaceById(dto.id);
    const person = await this.findOrFail(personId);

    await this.repository.reassignFace(face.id, personId);
    if (person.faceAssetId === null) {
      await this.createNewFeaturePhoto([person.id]);
    }
    if (face.person && face.person.faceAssetId === face.id) {
      await this.createNewFeaturePhoto([face.person.id]);
    }

    return await this.findOrFail(personId).then(mapPerson);
  }

  async getFacesById(auth: AuthDto, dto: FaceDto): Promise<AssetFaceResponseDto[]> {
    await this.access.requirePermission(auth, Permission.ASSET_READ, dto.id);
    const faces = await this.repository.getFaces(dto.id);
    return faces.map((asset) => mapFaces(asset, auth));
  }

  async createNewFeaturePhoto(changeFeaturePhoto: string[]) {
    this.logger.debug(
      `Changing feature photos for ${changeFeaturePhoto.length} ${changeFeaturePhoto.length > 1 ? 'people' : 'person'}`,
    );

    const jobs: JobItem[] = [];
    for (const personId of changeFeaturePhoto) {
      const assetFace = await this.repository.getRandomFace(personId);

      if (assetFace !== null) {
        await this.repository.update({
          id: personId,
          faceAssetId: assetFace.id,
        });
        jobs.push({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id: personId } });
      }
    }

    await this.jobRepository.queueAll(jobs);
  }

  async getById(auth: AuthDto, id: string): Promise<PersonResponseDto> {
    await this.access.requirePermission(auth, Permission.PERSON_READ, id);
    return this.findOrFail(id).then(mapPerson);
  }

  async getStatistics(auth: AuthDto, id: string): Promise<PersonStatisticsResponseDto> {
    await this.access.requirePermission(auth, Permission.PERSON_READ, id);
    return this.repository.getStatistics(id);
  }

  async getThumbnail(auth: AuthDto, id: string): Promise<ImmichFileResponse> {
    await this.access.requirePermission(auth, Permission.PERSON_READ, id);
    const person = await this.repository.getById(id);
    if (!person || !person.thumbnailPath) {
      throw new NotFoundException();
    }

    return new ImmichFileResponse({
      path: person.thumbnailPath,
      contentType: mimeTypes.lookup(person.thumbnailPath),
      cacheControl: CacheControl.PRIVATE_WITHOUT_CACHE,
    });
  }

  async getAssets(auth: AuthDto, id: string): Promise<AssetResponseDto[]> {
    await this.access.requirePermission(auth, Permission.PERSON_READ, id);
    const assets = await this.repository.getAssets(id);
    return assets.map((asset) => mapAsset(asset));
  }

  create(auth: AuthDto, dto: PersonCreateDto): Promise<PersonResponseDto> {
    return this.repository.create({
      ownerId: auth.user.id,
      name: dto.name,
      birthDate: dto.birthDate,
      isHidden: dto.isHidden,
    });
  }

  async update(auth: AuthDto, id: string, dto: PersonUpdateDto): Promise<PersonResponseDto> {
    await this.access.requirePermission(auth, Permission.PERSON_WRITE, id);

    const { name, birthDate, isHidden, featureFaceAssetId: assetId } = dto;
    // TODO: set by faceId directly
    let faceId: string | undefined = undefined;
    if (assetId) {
      await this.access.requirePermission(auth, Permission.ASSET_READ, assetId);
      const [face] = await this.repository.getFacesByIds([{ personId: id, assetId }]);
      if (!face) {
        throw new BadRequestException('Invalid assetId for feature face');
      }

      faceId = face.id;
    }

    const person = await this.repository.update({ id, faceAssetId: faceId, name, birthDate, isHidden });

    if (assetId) {
      await this.jobRepository.queue({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id } });
    }

    return mapPerson(person);
  }

  async updateAll(auth: AuthDto, dto: PeopleUpdateDto): Promise<BulkIdResponseDto[]> {
    const results: BulkIdResponseDto[] = [];
    for (const person of dto.people) {
      try {
        await this.update(auth, person.id, {
          isHidden: person.isHidden,
          name: person.name,
          birthDate: person.birthDate,
          featureFaceAssetId: person.featureFaceAssetId,
        }),
          results.push({ id: person.id, success: true });
      } catch (error: Error | any) {
        this.logger.error(`Unable to update ${person.id} : ${error}`, error?.stack);
        results.push({ id: person.id, success: false, error: BulkIdErrorReason.UNKNOWN });
      }
    }
    return results;
  }

  private async delete(people: PersonEntity[]) {
    await Promise.all(people.map((person) => this.storageRepository.unlink(person.thumbnailPath)));
    await this.repository.delete(people);
    this.logger.debug(`Deleted ${people.length} people`);
  }

  private async deleteAllPeople() {
    const personPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.repository.getAll({ ...pagination, skip: 0 }),
    );

    for await (const people of personPagination) {
      await this.delete(people); // deletes thumbnails too
    }
  }

  async handlePersonCleanup(): Promise<JobStatus> {
    const people = await this.repository.getAllWithoutFaces();
    await this.delete(people);
    return JobStatus.SUCCESS;
  }

  async handleQueueDetectFaces({ force }: IBaseJob): Promise<JobStatus> {
    const { machineLearning } = await this.configCore.getConfig();
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    if (force) {
      await this.deleteAllPeople();
      await this.repository.deleteAllFaces();
    }

    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination, {
            orderDirection: 'DESC',
            withFaces: true,
            withArchived: true,
            isVisible: true,
          })
        : this.assetRepository.getWithout(pagination, WithoutProperty.FACES);
    });

    for await (const assets of assetPagination) {
      await this.jobRepository.queueAll(
        assets.map((asset) => ({ name: JobName.FACE_DETECTION, data: { id: asset.id } })),
      );
    }

    return JobStatus.SUCCESS;
  }

  async handleDetectFaces({ id }: IEntityJob): Promise<JobStatus> {
    const { machineLearning } = await this.configCore.getConfig();
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    const relations = {
      exifInfo: true,
      faces: {
        person: false,
      },
    };
    const [asset] = await this.assetRepository.getByIds([id], relations);
    if (!asset || !asset.previewPath || asset.faces?.length > 0) {
      return JobStatus.FAILED;
    }

    if (!asset.isVisible) {
      return JobStatus.SKIPPED;
    }

    const faces = await this.machineLearningRepository.detectFaces(
      machineLearning.url,
      { imagePath: asset.previewPath },
      machineLearning.facialRecognition,
    );

    this.logger.debug(`${faces.length} faces detected in ${asset.previewPath}`);
    this.logger.verbose(faces.map((face) => ({ ...face, embedding: `vector(${face.embedding.length})` })));

    if (faces.length > 0) {
      await this.jobRepository.queue({ name: JobName.QUEUE_FACIAL_RECOGNITION, data: { force: false } });

      const mappedFaces = faces.map((face) => ({
        assetId: asset.id,
        embedding: face.embedding,
        imageHeight: face.imageHeight,
        imageWidth: face.imageWidth,
        boundingBoxX1: face.boundingBox.x1,
        boundingBoxX2: face.boundingBox.x2,
        boundingBoxY1: face.boundingBox.y1,
        boundingBoxY2: face.boundingBox.y2,
      }));

      const faceIds = await this.repository.createFaces(mappedFaces);
      await this.jobRepository.queueAll(faceIds.map((id) => ({ name: JobName.FACIAL_RECOGNITION, data: { id } })));
    }

    await this.assetRepository.upsertJobStatus({
      assetId: asset.id,
      facesRecognizedAt: new Date(),
    });

    return JobStatus.SUCCESS;
  }

  async handleQueueRecognizeFaces({ force }: IBaseJob): Promise<JobStatus> {
    const { machineLearning } = await this.configCore.getConfig();
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    await this.jobRepository.waitForQueueCompletion(QueueName.THUMBNAIL_GENERATION, QueueName.FACE_DETECTION);
    const { waiting } = await this.jobRepository.getJobCounts(QueueName.FACIAL_RECOGNITION);

    if (force) {
      await this.deleteAllPeople();
    } else if (waiting) {
      this.logger.debug(
        `Skipping facial recognition queueing because ${waiting} job${waiting > 1 ? 's are' : ' is'} already queued`,
      );
      return JobStatus.SKIPPED;
    }

    const facePagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.repository.getAllFaces(pagination, { where: force ? undefined : { personId: IsNull() } }),
    );

    for await (const page of facePagination) {
      await this.jobRepository.queueAll(
        page.map((face) => ({ name: JobName.FACIAL_RECOGNITION, data: { id: face.id, deferred: false } })),
      );
    }

    return JobStatus.SUCCESS;
  }

  async handleRecognizeFaces({ id, deferred }: IDeferrableJob): Promise<JobStatus> {
    const { machineLearning } = await this.configCore.getConfig();
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    const face = await this.repository.getFaceByIdWithAssets(
      id,
      { person: true, asset: true },
      { id: true, personId: true, embedding: true },
    );
    if (!face || !face.asset) {
      this.logger.warn(`Face ${id} not found`);
      return JobStatus.FAILED;
    }

    if (face.personId) {
      this.logger.debug(`Face ${id} already has a person assigned`);
      return JobStatus.SKIPPED;
    }

    const matches = await this.smartInfoRepository.searchFaces({
      userIds: [face.asset.ownerId],
      embedding: face.embedding,
      maxDistance: machineLearning.facialRecognition.maxDistance,
      numResults: machineLearning.facialRecognition.minFaces,
    });

    // `matches` also includes the face itself
    if (machineLearning.facialRecognition.minFaces > 1 && matches.length <= 1) {
      this.logger.debug(`Face ${id} only matched the face itself, skipping`);
      return JobStatus.SKIPPED;
    }

    this.logger.debug(`Face ${id} has ${matches.length} matches`);

    const isCore = matches.length >= machineLearning.facialRecognition.minFaces && !face.asset.isArchived;
    if (!isCore && !deferred) {
      this.logger.debug(`Deferring non-core face ${id} for later processing`);
      await this.jobRepository.queue({ name: JobName.FACIAL_RECOGNITION, data: { id, deferred: true } });
      return JobStatus.SKIPPED;
    }

    let personId = matches.find((match) => match.face.personId)?.face.personId;
    if (!personId) {
      const matchWithPerson = await this.smartInfoRepository.searchFaces({
        userIds: [face.asset.ownerId],
        embedding: face.embedding,
        maxDistance: machineLearning.facialRecognition.maxDistance,
        numResults: 1,
        hasPerson: true,
      });

      if (matchWithPerson.length > 0) {
        personId = matchWithPerson[0].face.personId;
      }
    }

    if (isCore && !personId) {
      this.logger.log(`Creating new person for face ${id}`);
      const newPerson = await this.repository.create({ ownerId: face.asset.ownerId, faceAssetId: face.id });
      await this.jobRepository.queue({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id: newPerson.id } });
      personId = newPerson.id;
    }

    if (personId) {
      this.logger.debug(`Assigning face ${id} to person ${personId}`);
      await this.repository.reassignFaces({ faceIds: [id], newPersonId: personId });
    }

    return JobStatus.SUCCESS;
  }

  async handlePersonMigration({ id }: IEntityJob): Promise<JobStatus> {
    const person = await this.repository.getById(id);
    if (!person) {
      return JobStatus.FAILED;
    }

    await this.storageCore.movePersonFile(person, PersonPathType.FACE);

    return JobStatus.SUCCESS;
  }

  async handleGeneratePersonThumbnail(data: IEntityJob): Promise<JobStatus> {
    const { machineLearning, image } = await this.configCore.getConfig();
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    const person = await this.repository.getById(data.id);
    if (!person?.faceAssetId) {
      this.logger.error(`Could not generate person thumbnail: person ${person?.id} has no face asset`);
      return JobStatus.FAILED;
    }

    const face = await this.repository.getFaceByIdWithAssets(person.faceAssetId);
    if (face === null) {
      this.logger.error(`Could not generate person thumbnail: face ${person.faceAssetId} not found`);
      return JobStatus.FAILED;
    }

    const {
      assetId,
      boundingBoxX1: x1,
      boundingBoxX2: x2,
      boundingBoxY1: y1,
      boundingBoxY2: y2,
      imageWidth,
      imageHeight,
    } = face;

    const asset = await this.assetRepository.getById(assetId, { exifInfo: true });
    if (!asset?.exifInfo?.exifImageHeight || !asset.exifInfo.exifImageWidth) {
      this.logger.error(`Could not generate person thumbnail: asset ${assetId} dimensions are unknown`);
      return JobStatus.FAILED;
    }

    this.logger.verbose(`Cropping face for person: ${person.id}`);
    const thumbnailPath = StorageCore.getPersonThumbnailPath(person);
    this.storageCore.ensureFolders(thumbnailPath);

    const { width: exifWidth, height: exifHeight } = this.withOrientation(asset.exifInfo.orientation as Orientation, {
      width: asset.exifInfo.exifImageWidth,
      height: asset.exifInfo.exifImageHeight,
    });

    const widthScale = exifWidth / imageWidth;
    const heightScale = exifHeight / imageHeight;

    const halfWidth = (widthScale * (x2 - x1)) / 2;
    const halfHeight = (heightScale * (y2 - y1)) / 2;

    const middleX = Math.round(widthScale * x1 + halfWidth);
    const middleY = Math.round(heightScale * y1 + halfHeight);

    // zoom out 10%
    const targetHalfSize = Math.floor(Math.max(halfWidth, halfHeight) * 1.1);

    // get the longest distance from the center of the image without overflowing
    const newHalfSize = Math.min(
      middleX - Math.max(0, middleX - targetHalfSize),
      middleY - Math.max(0, middleY - targetHalfSize),
      Math.min(exifWidth - 1, middleX + targetHalfSize) - middleX,
      Math.min(exifHeight - 1, middleY + targetHalfSize) - middleY,
    );

    const cropOptions: CropOptions = {
      left: middleX - newHalfSize,
      top: middleY - newHalfSize,
      width: newHalfSize * 2,
      height: newHalfSize * 2,
    };

    const thumbnailOptions = {
      format: ImageFormat.JPEG,
      size: FACE_THUMBNAIL_SIZE,
      colorspace: image.colorspace,
      quality: image.quality,
      crop: cropOptions,
    } as const;

    await this.mediaRepository.generateThumbnail(asset.originalPath, thumbnailPath, thumbnailOptions);
    await this.repository.update({ id: person.id, thumbnailPath });

    return JobStatus.SUCCESS;
  }

  async mergePerson(auth: AuthDto, id: string, dto: MergePersonDto): Promise<BulkIdResponseDto[]> {
    const mergeIds = dto.ids;
    await this.access.requirePermission(auth, Permission.PERSON_WRITE, id);
    let primaryPerson = await this.findOrFail(id);
    const primaryName = primaryPerson.name || primaryPerson.id;

    const results: BulkIdResponseDto[] = [];

    const allowedIds = await this.access.checkAccess(auth, Permission.PERSON_MERGE, mergeIds);

    for (const mergeId of mergeIds) {
      const hasAccess = allowedIds.has(mergeId);
      if (!hasAccess) {
        results.push({ id: mergeId, success: false, error: BulkIdErrorReason.NO_PERMISSION });
        continue;
      }

      try {
        const mergePerson = await this.repository.getById(mergeId);
        if (!mergePerson) {
          results.push({ id: mergeId, success: false, error: BulkIdErrorReason.NOT_FOUND });
          continue;
        }

        const update: Partial<PersonEntity> = {};
        if (!primaryPerson.name && mergePerson.name) {
          update.name = mergePerson.name;
        }

        if (!primaryPerson.birthDate && mergePerson.birthDate) {
          update.birthDate = mergePerson.birthDate;
        }

        if (Object.keys(update).length > 0) {
          primaryPerson = await this.repository.update({ id: primaryPerson.id, ...update });
        }

        const mergeName = mergePerson.name || mergePerson.id;
        const mergeData: UpdateFacesData = { oldPersonId: mergeId, newPersonId: id };
        this.logger.log(`Merging ${mergeName} into ${primaryName}`);

        await this.repository.reassignFaces(mergeData);
        await this.delete([mergePerson]);

        this.logger.log(`Merged ${mergeName} into ${primaryName}`);
        results.push({ id: mergeId, success: true });
      } catch (error: Error | any) {
        this.logger.error(`Unable to merge ${mergeId} into ${id}: ${error}`, error?.stack);
        results.push({ id: mergeId, success: false, error: BulkIdErrorReason.UNKNOWN });
      }
    }
    return results;
  }

  private async findOrFail(id: string) {
    const person = await this.repository.getById(id);
    if (!person) {
      throw new BadRequestException('Person not found');
    }
    return person;
  }

  private withOrientation(orientation: Orientation, { width, height }: ImageDimensions): ImageDimensions {
    switch (orientation) {
      case Orientation.MirrorHorizontalRotate270CW:
      case Orientation.Rotate90CW:
      case Orientation.MirrorHorizontalRotate90CW:
      case Orientation.Rotate270CW: {
        return { width: height, height: width };
      }
      default: {
        return { width, height };
      }
    }
  }
}

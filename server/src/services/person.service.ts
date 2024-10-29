import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FACE_THUMBNAIL_SIZE } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { BulkIdErrorReason, BulkIdResponseDto } from 'src/dtos/asset-ids.response.dto';
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
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { FaceSearchEntity } from 'src/entities/face-search.entity';
import { PersonEntity } from 'src/entities/person.entity';
import {
  AssetType,
  CacheControl,
  ImageFormat,
  Permission,
  PersonPathType,
  SourceType,
  SystemMetadataKey,
} from 'src/enum';
import { WithoutProperty } from 'src/interfaces/asset.interface';
import {
  IBaseJob,
  IDeferrableJob,
  IEntityJob,
  INightlyJob,
  JOBS_ASSET_PAGINATION_SIZE,
  JobItem,
  JobName,
  JobStatus,
  QueueName,
} from 'src/interfaces/job.interface';
import { BoundingBox } from 'src/interfaces/machine-learning.interface';
import { CropOptions, ImageDimensions, InputDimensions } from 'src/interfaces/media.interface';
import { UpdateFacesData } from 'src/interfaces/person.interface';
import { BaseService } from 'src/services/base.service';
import { getAssetFiles } from 'src/utils/asset.util';
import { ImmichFileResponse } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';
import { isFaceImportEnabled, isFacialRecognitionEnabled } from 'src/utils/misc';
import { usePagination } from 'src/utils/pagination';
import { IsNull } from 'typeorm';

@Injectable()
export class PersonService extends BaseService {
  async getAll(auth: AuthDto, dto: PersonSearchDto): Promise<PeopleResponseDto> {
    const { withHidden = false, page, size } = dto;
    const pagination = {
      take: size,
      skip: (page - 1) * size,
    };

    const { machineLearning } = await this.getConfig({ withCache: false });
    const { items, hasNextPage } = await this.personRepository.getAllForUser(pagination, auth.user.id, {
      minimumFaceCount: machineLearning.facialRecognition.minFaces,
      withHidden,
    });
    const { total, hidden } = await this.personRepository.getNumberOfPeople(auth.user.id);

    return {
      people: items.map((person) => mapPerson(person)),
      hasNextPage,
      total,
      hidden,
    };
  }

  async reassignFaces(auth: AuthDto, personId: string, dto: AssetFaceUpdateDto): Promise<PersonResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.PERSON_UPDATE, ids: [personId] });
    const person = await this.findOrFail(personId);
    const result: PersonResponseDto[] = [];
    const changeFeaturePhoto: string[] = [];
    for (const data of dto.data) {
      const faces = await this.personRepository.getFacesByIds([{ personId: data.personId, assetId: data.assetId }]);

      for (const face of faces) {
        await this.requireAccess({ auth, permission: Permission.PERSON_CREATE, ids: [face.id] });
        if (person.faceAssetId === null) {
          changeFeaturePhoto.push(person.id);
        }
        if (face.person && face.person.faceAssetId === face.id) {
          changeFeaturePhoto.push(face.person.id);
        }

        await this.personRepository.reassignFace(face.id, personId);
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
    await this.requireAccess({ auth, permission: Permission.PERSON_UPDATE, ids: [personId] });
    await this.requireAccess({ auth, permission: Permission.PERSON_CREATE, ids: [dto.id] });
    const face = await this.personRepository.getFaceById(dto.id);
    const person = await this.findOrFail(personId);

    await this.personRepository.reassignFace(face.id, personId);
    if (person.faceAssetId === null) {
      await this.createNewFeaturePhoto([person.id]);
    }
    if (face.person && face.person.faceAssetId === face.id) {
      await this.createNewFeaturePhoto([face.person.id]);
    }

    return await this.findOrFail(personId).then(mapPerson);
  }

  async getFacesById(auth: AuthDto, dto: FaceDto): Promise<AssetFaceResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.ASSET_READ, ids: [dto.id] });
    const faces = await this.personRepository.getFaces(dto.id);
    return faces.map((asset) => mapFaces(asset, auth));
  }

  async createNewFeaturePhoto(changeFeaturePhoto: string[]) {
    this.logger.debug(
      `Changing feature photos for ${changeFeaturePhoto.length} ${changeFeaturePhoto.length > 1 ? 'people' : 'person'}`,
    );

    const jobs: JobItem[] = [];
    for (const personId of changeFeaturePhoto) {
      const assetFace = await this.personRepository.getRandomFace(personId);

      if (assetFace !== null) {
        await this.personRepository.update({ id: personId, faceAssetId: assetFace.id });
        jobs.push({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id: personId } });
      }
    }

    await this.jobRepository.queueAll(jobs);
  }

  async getById(auth: AuthDto, id: string): Promise<PersonResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PERSON_READ, ids: [id] });
    return this.findOrFail(id).then(mapPerson);
  }

  async getStatistics(auth: AuthDto, id: string): Promise<PersonStatisticsResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PERSON_READ, ids: [id] });
    return this.personRepository.getStatistics(id);
  }

  async getThumbnail(auth: AuthDto, id: string): Promise<ImmichFileResponse> {
    await this.requireAccess({ auth, permission: Permission.PERSON_READ, ids: [id] });
    const person = await this.personRepository.getById(id);
    if (!person || !person.thumbnailPath) {
      throw new NotFoundException();
    }

    return new ImmichFileResponse({
      path: person.thumbnailPath,
      contentType: mimeTypes.lookup(person.thumbnailPath),
      cacheControl: CacheControl.PRIVATE_WITHOUT_CACHE,
    });
  }

  create(auth: AuthDto, dto: PersonCreateDto): Promise<PersonResponseDto> {
    return this.personRepository.create({
      ownerId: auth.user.id,
      name: dto.name,
      birthDate: dto.birthDate,
      isHidden: dto.isHidden,
    });
  }

  async update(auth: AuthDto, id: string, dto: PersonUpdateDto): Promise<PersonResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PERSON_UPDATE, ids: [id] });

    const { name, birthDate, isHidden, featureFaceAssetId: assetId } = dto;
    // TODO: set by faceId directly
    let faceId: string | undefined = undefined;
    if (assetId) {
      await this.requireAccess({ auth, permission: Permission.ASSET_READ, ids: [assetId] });
      const [face] = await this.personRepository.getFacesByIds([{ personId: id, assetId }]);
      if (!face) {
        throw new BadRequestException('Invalid assetId for feature face');
      }

      faceId = face.id;
    }

    const person = await this.personRepository.update({ id, faceAssetId: faceId, name, birthDate, isHidden });

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
        });
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
    await this.personRepository.delete(people);
    this.logger.debug(`Deleted ${people.length} people`);
  }

  async handlePersonCleanup(): Promise<JobStatus> {
    const people = await this.personRepository.getAllWithoutFaces();
    await this.delete(people);
    return JobStatus.SUCCESS;
  }

  async handleQueueDetectFaces({ force }: IBaseJob): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    if (force) {
      await this.personRepository.deleteFaces({ sourceType: SourceType.MACHINE_LEARNING });
      await this.handlePersonCleanup();
    }

    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force === false
        ? this.assetRepository.getWithout(pagination, WithoutProperty.FACES)
        : this.assetRepository.getAll(pagination, {
            orderDirection: 'DESC',
            withFaces: true,
            withArchived: true,
            isVisible: true,
          });
    });

    for await (const assets of assetPagination) {
      await this.jobRepository.queueAll(
        assets.map((asset) => ({ name: JobName.FACE_DETECTION, data: { id: asset.id } })),
      );
    }

    if (force === undefined) {
      await this.jobRepository.queue({ name: JobName.PERSON_CLEANUP });
    }

    return JobStatus.SUCCESS;
  }

  async handleDetectFaces({ id }: IEntityJob): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    const relations = {
      exifInfo: true,
      faces: {
        person: false,
      },
      files: true,
    };
    const [asset] = await this.assetRepository.getByIds([id], relations);
    const { previewFile } = getAssetFiles(asset.files);
    if (!asset || !previewFile) {
      return JobStatus.FAILED;
    }

    if (!asset.isVisible) {
      return JobStatus.SKIPPED;
    }

    const { imageHeight, imageWidth, faces } = await this.machineLearningRepository.detectFaces(
      machineLearning.url,
      previewFile.path,
      machineLearning.facialRecognition,
    );
    this.logger.debug(`${faces.length} faces detected in ${previewFile.path}`);

    const facesToAdd: (Partial<AssetFaceEntity> & { id: string })[] = [];
    const embeddings: FaceSearchEntity[] = [];
    const mlFaceIds = new Set<string>();
    for (const face of asset.faces) {
      if (face.sourceType === SourceType.MACHINE_LEARNING) {
        mlFaceIds.add(face.id);
      }
    }

    const heightScale = imageHeight / (asset.faces[0]?.imageHeight || 1);
    const widthScale = imageWidth / (asset.faces[0]?.imageWidth || 1);
    for (const { boundingBox, embedding } of faces) {
      const scaledBox = {
        x1: boundingBox.x1 * widthScale,
        y1: boundingBox.y1 * heightScale,
        x2: boundingBox.x2 * widthScale,
        y2: boundingBox.y2 * heightScale,
      };
      const match = asset.faces.find((face) => this.iou(face, scaledBox) > 0.5);

      if (match && !mlFaceIds.delete(match.id)) {
        embeddings.push({ faceId: match.id, embedding });
      } else if (!match) {
        const faceId = this.cryptoRepository.randomUUID();
        facesToAdd.push({
          id: faceId,
          assetId: asset.id,
          imageHeight,
          imageWidth,
          boundingBoxX1: boundingBox.x1,
          boundingBoxY1: boundingBox.y1,
          boundingBoxX2: boundingBox.x2,
          boundingBoxY2: boundingBox.y2,
        });
        embeddings.push({ faceId, embedding });
      }
    }
    const faceIdsToRemove = [...mlFaceIds];

    if (facesToAdd.length > 0 || faceIdsToRemove.length > 0 || embeddings.length > 0) {
      await this.personRepository.refreshFaces(facesToAdd, faceIdsToRemove, embeddings);
    }

    if (faceIdsToRemove.length > 0) {
      this.logger.log(`Removed ${faceIdsToRemove.length} faces below detection threshold in asset ${id}`);
    }

    if (facesToAdd.length > 0) {
      this.logger.log(`Detected ${facesToAdd.length} new faces in asset ${id}`);
      const jobs = facesToAdd.map((face) => ({ name: JobName.FACIAL_RECOGNITION, data: { id: face.id } }) as const);
      await this.jobRepository.queueAll([{ name: JobName.QUEUE_FACIAL_RECOGNITION, data: { force: false } }, ...jobs]);
    } else if (embeddings.length > 0) {
      this.logger.log(`Added ${embeddings.length} face embeddings for asset ${id}`);
    }

    await this.assetRepository.upsertJobStatus({ assetId: asset.id, facesRecognizedAt: new Date() });

    return JobStatus.SUCCESS;
  }

  private iou(face: AssetFaceEntity, newBox: BoundingBox): number {
    const x1 = Math.max(face.boundingBoxX1, newBox.x1);
    const y1 = Math.max(face.boundingBoxY1, newBox.y1);
    const x2 = Math.min(face.boundingBoxX2, newBox.x2);
    const y2 = Math.min(face.boundingBoxY2, newBox.y2);

    const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const area1 = (face.boundingBoxX2 - face.boundingBoxX1) * (face.boundingBoxY2 - face.boundingBoxY1);
    const area2 = (newBox.x2 - newBox.x1) * (newBox.y2 - newBox.y1);
    const union = area1 + area2 - intersection;

    return intersection / union;
  }

  async handleQueueRecognizeFaces({ force, nightly }: INightlyJob): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    await this.jobRepository.waitForQueueCompletion(QueueName.THUMBNAIL_GENERATION, QueueName.FACE_DETECTION);

    if (nightly) {
      const [state, latestFaceDate] = await Promise.all([
        this.systemMetadataRepository.get(SystemMetadataKey.FACIAL_RECOGNITION_STATE),
        this.personRepository.getLatestFaceDate(),
      ]);

      if (state?.lastRun && latestFaceDate && state.lastRun > latestFaceDate) {
        this.logger.debug('Skipping facial recognition nightly since no face has been added since the last run');
        return JobStatus.SKIPPED;
      }
    }

    const { waiting } = await this.jobRepository.getJobCounts(QueueName.FACIAL_RECOGNITION);

    if (force) {
      await this.personRepository.unassignFaces({ sourceType: SourceType.MACHINE_LEARNING });
      await this.handlePersonCleanup();
    } else if (waiting) {
      this.logger.debug(
        `Skipping facial recognition queueing because ${waiting} job${waiting > 1 ? 's are' : ' is'} already queued`,
      );
      return JobStatus.SKIPPED;
    }

    const lastRun = new Date().toISOString();
    const facePagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.personRepository.getAllFaces(pagination, {
        where: force ? undefined : { personId: IsNull(), sourceType: SourceType.MACHINE_LEARNING },
      }),
    );

    for await (const page of facePagination) {
      await this.jobRepository.queueAll(
        page.map((face) => ({ name: JobName.FACIAL_RECOGNITION, data: { id: face.id, deferred: false } })),
      );
    }

    await this.systemMetadataRepository.set(SystemMetadataKey.FACIAL_RECOGNITION_STATE, { lastRun });

    return JobStatus.SUCCESS;
  }

  async handleRecognizeFaces({ id, deferred }: IDeferrableJob): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    const face = await this.personRepository.getFaceByIdWithAssets(
      id,
      { person: true, asset: true, faceSearch: true },
      { id: true, personId: true, sourceType: true, faceSearch: { embedding: true } },
    );
    if (!face || !face.asset) {
      this.logger.warn(`Face ${id} not found`);
      return JobStatus.FAILED;
    }

    if (face.sourceType !== SourceType.MACHINE_LEARNING) {
      this.logger.warn(`Skipping face ${id} due to source ${face.sourceType}`);
      return JobStatus.SKIPPED;
    }

    if (!face.faceSearch?.embedding) {
      this.logger.warn(`Face ${id} does not have an embedding`);
      return JobStatus.FAILED;
    }

    if (face.personId) {
      this.logger.debug(`Face ${id} already has a person assigned`);
      return JobStatus.SKIPPED;
    }

    const matches = await this.searchRepository.searchFaces({
      userIds: [face.asset.ownerId],
      embedding: face.faceSearch.embedding,
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
      const matchWithPerson = await this.searchRepository.searchFaces({
        userIds: [face.asset.ownerId],
        embedding: face.faceSearch.embedding,
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
      const newPerson = await this.personRepository.create({ ownerId: face.asset.ownerId, faceAssetId: face.id });
      await this.jobRepository.queue({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id: newPerson.id } });
      personId = newPerson.id;
    }

    if (personId) {
      this.logger.debug(`Assigning face ${id} to person ${personId}`);
      await this.personRepository.reassignFaces({ faceIds: [id], newPersonId: personId });
    }

    return JobStatus.SUCCESS;
  }

  async handlePersonMigration({ id }: IEntityJob): Promise<JobStatus> {
    const person = await this.personRepository.getById(id);
    if (!person) {
      return JobStatus.FAILED;
    }

    await this.storageCore.movePersonFile(person, PersonPathType.FACE);

    return JobStatus.SUCCESS;
  }

  async handleGeneratePersonThumbnail(data: IEntityJob): Promise<JobStatus> {
    const { machineLearning, metadata, image } = await this.getConfig({ withCache: true });
    if (!isFacialRecognitionEnabled(machineLearning) && !isFaceImportEnabled(metadata)) {
      return JobStatus.SKIPPED;
    }

    const person = await this.personRepository.getById(data.id);
    if (!person?.faceAssetId) {
      this.logger.error(`Could not generate person thumbnail: person ${person?.id} has no face asset`);
      return JobStatus.FAILED;
    }

    const face = await this.personRepository.getFaceByIdWithAssets(person.faceAssetId);
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
      imageWidth: oldWidth,
      imageHeight: oldHeight,
    } = face;

    const asset = await this.assetRepository.getById(assetId, {
      exifInfo: true,
      files: true,
    });
    if (!asset) {
      this.logger.error(`Could not generate person thumbnail: asset ${assetId} does not exist`);
      return JobStatus.FAILED;
    }

    const { width, height, inputPath } = await this.getInputDimensions(asset, { width: oldWidth, height: oldHeight });

    const thumbnailPath = StorageCore.getPersonThumbnailPath(person);
    this.storageCore.ensureFolders(thumbnailPath);

    const thumbnailOptions = {
      colorspace: image.colorspace,
      format: ImageFormat.JPEG,
      size: FACE_THUMBNAIL_SIZE,
      quality: image.thumbnail.quality,
      crop: this.getCrop({ old: { width: oldWidth, height: oldHeight }, new: { width, height } }, { x1, y1, x2, y2 }),
      processInvalidImages: process.env.IMMICH_PROCESS_INVALID_IMAGES === 'true',
    };

    await this.mediaRepository.generateThumbnail(inputPath, thumbnailOptions, thumbnailPath);
    await this.personRepository.update({ id: person.id, thumbnailPath });

    return JobStatus.SUCCESS;
  }

  async mergePerson(auth: AuthDto, id: string, dto: MergePersonDto): Promise<BulkIdResponseDto[]> {
    const mergeIds = dto.ids;
    if (mergeIds.includes(id)) {
      throw new BadRequestException('Cannot merge a person into themselves');
    }

    await this.requireAccess({ auth, permission: Permission.PERSON_UPDATE, ids: [id] });
    let primaryPerson = await this.findOrFail(id);
    const primaryName = primaryPerson.name || primaryPerson.id;

    const results: BulkIdResponseDto[] = [];

    const allowedIds = await this.checkAccess({
      auth,
      permission: Permission.PERSON_MERGE,
      ids: mergeIds,
    });

    for (const mergeId of mergeIds) {
      const hasAccess = allowedIds.has(mergeId);
      if (!hasAccess) {
        results.push({ id: mergeId, success: false, error: BulkIdErrorReason.NO_PERMISSION });
        continue;
      }

      try {
        const mergePerson = await this.personRepository.getById(mergeId);
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
          primaryPerson = await this.personRepository.update({ id: primaryPerson.id, ...update });
        }

        const mergeName = mergePerson.name || mergePerson.id;
        const mergeData: UpdateFacesData = { oldPersonId: mergeId, newPersonId: id };
        this.logger.log(`Merging ${mergeName} into ${primaryName}`);

        await this.personRepository.reassignFaces(mergeData);
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
    const person = await this.personRepository.getById(id);
    if (!person) {
      throw new BadRequestException('Person not found');
    }
    return person;
  }

  private async getInputDimensions(asset: AssetEntity, oldDims: ImageDimensions): Promise<InputDimensions> {
    if (!asset.exifInfo?.exifImageHeight || !asset.exifInfo.exifImageWidth) {
      throw new Error(`Asset ${asset.id} dimensions are unknown`);
    }

    const { previewFile } = getAssetFiles(asset.files);
    if (!previewFile) {
      throw new Error(`Asset ${asset.id} has no preview path`);
    }

    if (asset.type === AssetType.IMAGE) {
      let { exifImageWidth: width, exifImageHeight: height } = asset.exifInfo;
      if (oldDims.height > oldDims.width !== height > width) {
        [width, height] = [height, width];
      }

      return { width, height, inputPath: asset.originalPath };
    }

    const { width, height } = await this.mediaRepository.getImageDimensions(previewFile.path);
    return { width, height, inputPath: previewFile.path };
  }

  private getCrop(dims: { old: ImageDimensions; new: ImageDimensions }, { x1, y1, x2, y2 }: BoundingBox): CropOptions {
    const widthScale = dims.new.width / dims.old.width;
    const heightScale = dims.new.height / dims.old.height;

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
      Math.min(dims.new.width - 1, middleX + targetHalfSize) - middleX,
      Math.min(dims.new.height - 1, middleY + targetHalfSize) - middleY,
    );

    return {
      left: middleX - newHalfSize,
      top: middleY - newHalfSize,
      width: newHalfSize * 2,
      height: newHalfSize * 2,
    };
  }
}

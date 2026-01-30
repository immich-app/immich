import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Insertable, Updateable } from 'kysely';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { Person } from 'src/database';
import { Chunked, OnJob } from 'src/decorators';
import { BulkIdErrorReason, BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AssetFaceCreateDto,
  AssetFaceDeleteDto,
  AssetFaceResponseDto,
  AssetFaceUpdateDto,
  FaceDto,
  mapFaces,
  mapPerson,
  MergePersonDto,
  PeopleResponseDto,
  PeopleUpdateDto,
  PersonCreateDto,
  PersonResponseDto,
  PersonSearchDto,
  PersonStatisticsResponseDto,
  PersonUpdateDto,
} from 'src/dtos/person.dto';
import {
  AssetVisibility,
  CacheControl,
  JobName,
  JobStatus,
  Permission,
  PersonPathType,
  QueueName,
  SourceType,
  SystemMetadataKey,
  VectorIndex,
} from 'src/enum';
import { BoundingBox } from 'src/repositories/machine-learning.repository';
import { UpdateFacesData } from 'src/repositories/person.repository';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { FaceSearchTable } from 'src/schema/tables/face-search.table';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';
import { getDimensions } from 'src/utils/asset.util';
import { ImmichFileResponse } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';
import { isFacialRecognitionEnabled } from 'src/utils/misc';

@Injectable()
export class PersonService extends BaseService {
  async getAll(auth: AuthDto, dto: PersonSearchDto): Promise<PeopleResponseDto> {
    const { withHidden = false, closestAssetId, closestPersonId, page, size } = dto;
    let closestFaceAssetId = closestAssetId;
    const pagination = {
      take: size,
      skip: (page - 1) * size,
    };

    if (closestPersonId) {
      const person = await this.personRepository.getById(closestPersonId);
      if (!person?.faceAssetId) {
        throw new NotFoundException('Person not found');
      }
      closestFaceAssetId = person.faceAssetId;
    }
    const { machineLearning } = await this.getConfig({ withCache: false });
    const { items, hasNextPage } = await this.personRepository.getAllForUser(pagination, auth.user.id, {
      minimumFaceCount: machineLearning.facialRecognition.minFaces,
      withHidden,
      closestFaceAssetId,
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
    await this.requireAccess({ auth, permission: Permission.PersonUpdate, ids: [personId] });
    const person = await this.findOrFail(personId);
    const result: PersonResponseDto[] = [];
    const changeFeaturePhoto: string[] = [];
    for (const data of dto.data) {
      const faces = await this.personRepository.getFacesByIds([{ personId: data.personId, assetId: data.assetId }]);

      for (const face of faces) {
        await this.requireAccess({ auth, permission: Permission.PersonCreate, ids: [face.id] });
        if (person.faceAssetId === null) {
          changeFeaturePhoto.push(person.id);
        }
        if (face.person && face.person.faceAssetId === face.id) {
          changeFeaturePhoto.push(face.person.id);
        }

        await this.personRepository.reassignFace(face.id, personId);
      }

      result.push(mapPerson(person));
    }
    if (changeFeaturePhoto.length > 0) {
      // Remove duplicates
      await this.createNewFeaturePhoto([...new Set(changeFeaturePhoto)]);
    }
    return result;
  }

  async reassignFacesById(auth: AuthDto, personId: string, dto: FaceDto): Promise<PersonResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PersonUpdate, ids: [personId] });
    await this.requireAccess({ auth, permission: Permission.PersonCreate, ids: [dto.id] });
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
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [dto.id] });
    const faces = await this.personRepository.getFaces(dto.id);
    const asset = await this.assetRepository.getById(dto.id, { edits: true, exifInfo: true });
    const assetDimensions = getDimensions(asset!.exifInfo!);

    return faces.map((face) => mapFaces(face, auth, asset!.edits!, assetDimensions));
  }

  async createNewFeaturePhoto(changeFeaturePhoto: string[]) {
    this.logger.debug(
      `Changing feature photos for ${changeFeaturePhoto.length} ${changeFeaturePhoto.length > 1 ? 'people' : 'person'}`,
    );

    const jobs: JobItem[] = [];
    for (const personId of changeFeaturePhoto) {
      const assetFace = await this.personRepository.getRandomFace(personId);

      if (assetFace) {
        await this.personRepository.update({ id: personId, faceAssetId: assetFace.id });
        jobs.push({ name: JobName.PersonGenerateThumbnail, data: { id: personId } });
      }
    }

    await this.jobRepository.queueAll(jobs);
  }

  async getById(auth: AuthDto, id: string): Promise<PersonResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PersonRead, ids: [id] });
    return this.findOrFail(id).then(mapPerson);
  }

  async getStatistics(auth: AuthDto, id: string): Promise<PersonStatisticsResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PersonRead, ids: [id] });
    return this.personRepository.getStatistics(id);
  }

  async getThumbnail(auth: AuthDto, id: string): Promise<ImmichFileResponse> {
    await this.requireAccess({ auth, permission: Permission.PersonRead, ids: [id] });
    const person = await this.personRepository.getById(id);
    if (!person || !person.thumbnailPath) {
      throw new NotFoundException();
    }

    return new ImmichFileResponse({
      path: person.thumbnailPath,
      contentType: mimeTypes.lookup(person.thumbnailPath),
      cacheControl: CacheControl.PrivateWithoutCache,
    });
  }

  async create(auth: AuthDto, dto: PersonCreateDto): Promise<PersonResponseDto> {
    const person = await this.personRepository.create({
      ownerId: auth.user.id,
      name: dto.name,
      birthDate: dto.birthDate,
      isHidden: dto.isHidden,
      isFavorite: dto.isFavorite,
      color: dto.color,
    });

    return mapPerson(person);
  }

  async update(auth: AuthDto, id: string, dto: PersonUpdateDto): Promise<PersonResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PersonUpdate, ids: [id] });

    const { name, birthDate, isHidden, featureFaceAssetId: assetId, isFavorite, color } = dto;
    // TODO: set by faceId directly
    let faceId: string | undefined = undefined;
    if (assetId) {
      await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [assetId] });
      const [face] = await this.personRepository.getFacesByIds([{ personId: id, assetId }]);
      if (!face) {
        throw new BadRequestException('Invalid assetId for feature face');
      }

      if (face.asset.isOffline) {
        throw new BadRequestException('An offline asset cannot be used for feature face');
      }

      faceId = face.id;
    }

    const person = await this.personRepository.update({
      id,
      faceAssetId: faceId,
      name,
      birthDate,
      isHidden,
      isFavorite,
      color,
    });

    if (assetId) {
      await this.jobRepository.queue({ name: JobName.PersonGenerateThumbnail, data: { id } });
    }

    return mapPerson(person);
  }

  delete(auth: AuthDto, id: string): Promise<void> {
    return this.deleteAll(auth, { ids: [id] });
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
          isFavorite: person.isFavorite,
        });
        results.push({ id: person.id, success: true });
      } catch (error: Error | any) {
        this.logger.error(`Unable to update ${person.id} : ${error}`, error?.stack);
        results.push({ id: person.id, success: false, error: BulkIdErrorReason.UNKNOWN });
      }
    }
    return results;
  }

  async deleteAll(auth: AuthDto, { ids }: BulkIdsDto): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.PersonDelete, ids });
    const people = await this.personRepository.getForPeopleDelete(ids);
    await this.removeAllPeople(people);
  }

  @Chunked()
  private async removeAllPeople(people: { id: string; thumbnailPath: string }[]) {
    await Promise.all(people.map((person) => this.storageRepository.unlink(person.thumbnailPath)));
    await this.personRepository.delete(people.map((person) => person.id));
    this.logger.debug(`Deleted ${people.length} people`);
  }

  @OnJob({ name: JobName.PersonCleanup, queue: QueueName.BackgroundTask })
  async handlePersonCleanup(): Promise<JobStatus> {
    const people = await this.personRepository.getAllWithoutFaces();
    await this.removeAllPeople(people);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetDetectFacesQueueAll, queue: QueueName.FaceDetection })
  async handleQueueDetectFaces({ force }: JobOf<JobName.AssetDetectFacesQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    if (force) {
      await this.personRepository.deleteFaces({ sourceType: SourceType.MachineLearning });
      await this.handlePersonCleanup();
      await this.personRepository.vacuum({ reindexVectors: true });
    }

    let jobs: JobItem[] = [];
    const assets = this.assetJobRepository.streamForDetectFacesJob(force);
    for await (const asset of assets) {
      jobs.push({ name: JobName.AssetDetectFaces, data: { id: asset.id } });

      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(jobs);
        jobs = [];
      }
    }

    await this.jobRepository.queueAll(jobs);

    if (force === undefined) {
      await this.jobRepository.queue({ name: JobName.PersonCleanup });
    }

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetDetectFaces, queue: QueueName.FaceDetection })
  async handleDetectFaces({ id }: JobOf<JobName.AssetDetectFaces>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    const asset = await this.assetJobRepository.getForDetectFacesJob(id);
    const previewFile = asset?.files[0];
    if (!asset || asset.files.length !== 1 || !previewFile) {
      return JobStatus.Failed;
    }

    if (asset.visibility === AssetVisibility.Hidden) {
      return JobStatus.Skipped;
    }

    const { imageHeight, imageWidth, faces } = await this.machineLearningRepository.detectFaces(
      previewFile.path,
      machineLearning.facialRecognition,
    );
    this.logger.debug(`${faces.length} faces detected in ${previewFile.path}`);

    const facesToAdd: (Insertable<AssetFaceTable> & { id: string })[] = [];
    const embeddings: FaceSearchTable[] = [];
    const mlFaceIds = new Set<string>();

    for (const face of asset.faces) {
      if (face.sourceType === SourceType.MachineLearning) {
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
      const jobs = facesToAdd.map((face) => ({ name: JobName.FacialRecognition, data: { id: face.id } }) as const);
      await this.jobRepository.queueAll([{ name: JobName.FacialRecognitionQueueAll, data: { force: false } }, ...jobs]);
    } else if (embeddings.length > 0) {
      this.logger.log(`Added ${embeddings.length} face embeddings for asset ${id}`);
    }

    await this.assetRepository.upsertJobStatus({ assetId: asset.id, facesRecognizedAt: new Date() });

    return JobStatus.Success;
  }

  private iou(
    face: { boundingBoxX1: number; boundingBoxY1: number; boundingBoxX2: number; boundingBoxY2: number },
    newBox: BoundingBox,
  ): number {
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

  @OnJob({ name: JobName.FacialRecognitionQueueAll, queue: QueueName.FacialRecognition })
  async handleQueueRecognizeFaces({ force, nightly }: JobOf<JobName.FacialRecognitionQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    await this.jobRepository.waitForQueueCompletion(QueueName.ThumbnailGeneration, QueueName.FaceDetection);

    if (nightly) {
      const [state, latestFaceDate] = await Promise.all([
        this.systemMetadataRepository.get(SystemMetadataKey.FacialRecognitionState),
        this.personRepository.getLatestFaceDate(),
      ]);

      if (state?.lastRun && latestFaceDate && state.lastRun > latestFaceDate) {
        this.logger.debug('Skipping facial recognition nightly since no face has been added since the last run');
        return JobStatus.Skipped;
      }
    }

    const { waiting } = await this.jobRepository.getJobCounts(QueueName.FacialRecognition);

    if (force) {
      await this.personRepository.unassignFaces({ sourceType: SourceType.MachineLearning });
      await this.handlePersonCleanup();
      await this.personRepository.vacuum({ reindexVectors: false });
    } else if (waiting) {
      this.logger.debug(
        `Skipping facial recognition queueing because ${waiting} job${waiting > 1 ? 's are' : ' is'} already queued`,
      );
      return JobStatus.Skipped;
    }

    await this.databaseRepository.prewarm(VectorIndex.Face);

    const lastRun = new Date().toISOString();
    const facePagination = this.personRepository.getAllFaces(
      force ? undefined : { personId: null, sourceType: SourceType.MachineLearning },
    );

    let jobs: { name: JobName.FacialRecognition; data: { id: string; deferred: false } }[] = [];
    for await (const face of facePagination) {
      jobs.push({ name: JobName.FacialRecognition, data: { id: face.id, deferred: false } });

      if (jobs.length === JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(jobs);
        jobs = [];
      }
    }

    await this.jobRepository.queueAll(jobs);

    await this.systemMetadataRepository.set(SystemMetadataKey.FacialRecognitionState, { lastRun });

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.FacialRecognition, queue: QueueName.FacialRecognition })
  async handleRecognizeFaces({ id, deferred }: JobOf<JobName.FacialRecognition>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    const face = await this.personRepository.getFaceForFacialRecognitionJob(id);
    if (!face || !face.asset) {
      this.logger.warn(`Face ${id} not found`);
      return JobStatus.Failed;
    }

    if (face.sourceType !== SourceType.MachineLearning) {
      this.logger.warn(`Skipping face ${id} due to source ${face.sourceType}`);
      return JobStatus.Skipped;
    }

    if (!face.faceSearch?.embedding) {
      this.logger.warn(`Face ${id} does not have an embedding`);
      return JobStatus.Failed;
    }

    if (face.personId) {
      this.logger.debug(`Face ${id} already has a person assigned`);
      return JobStatus.Skipped;
    }

    const matches = await this.searchRepository.searchFaces({
      userIds: [face.asset.ownerId],
      embedding: face.faceSearch.embedding,
      maxDistance: machineLearning.facialRecognition.maxDistance,
      numResults: machineLearning.facialRecognition.minFaces,
      minBirthDate: face.asset.fileCreatedAt ?? undefined,
    });

    // `matches` also includes the face itself
    if (machineLearning.facialRecognition.minFaces > 1 && matches.length <= 1) {
      this.logger.debug(`Face ${id} only matched the face itself, skipping`);
      return JobStatus.Skipped;
    }

    this.logger.debug(`Face ${id} has ${matches.length} matches`);

    const isCore =
      matches.length >= machineLearning.facialRecognition.minFaces &&
      face.asset.visibility === AssetVisibility.Timeline;
    if (!isCore && !deferred) {
      this.logger.debug(`Deferring non-core face ${id} for later processing`);
      await this.jobRepository.queue({ name: JobName.FacialRecognition, data: { id, deferred: true } });
      return JobStatus.Skipped;
    }

    let personId = matches.find((match) => match.personId)?.personId;
    if (!personId) {
      const matchWithPerson = await this.searchRepository.searchFaces({
        userIds: [face.asset.ownerId],
        embedding: face.faceSearch.embedding,
        maxDistance: machineLearning.facialRecognition.maxDistance,
        numResults: 1,
        hasPerson: true,
        minBirthDate: face.asset.fileCreatedAt ?? undefined,
      });

      if (matchWithPerson.length > 0) {
        personId = matchWithPerson[0].personId;
      }
    }

    if (isCore && !personId) {
      this.logger.log(`Creating new person for face ${id}`);
      const newPerson = await this.personRepository.create({ ownerId: face.asset.ownerId, faceAssetId: face.id });
      await this.jobRepository.queue({ name: JobName.PersonGenerateThumbnail, data: { id: newPerson.id } });
      personId = newPerson.id;
    }

    if (personId) {
      this.logger.debug(`Assigning face ${id} to person ${personId}`);
      await this.personRepository.reassignFaces({ faceIds: [id], newPersonId: personId });
    }

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.PersonFileMigration, queue: QueueName.Migration })
  async handlePersonMigration({ id }: JobOf<JobName.PersonFileMigration>): Promise<JobStatus> {
    const person = await this.personRepository.getById(id);
    if (!person) {
      return JobStatus.Failed;
    }

    await this.storageCore.movePersonFile(person, PersonPathType.Face);

    return JobStatus.Success;
  }

  async mergePerson(auth: AuthDto, id: string, dto: MergePersonDto): Promise<BulkIdResponseDto[]> {
    const mergeIds = dto.ids;
    if (mergeIds.includes(id)) {
      throw new BadRequestException('Cannot merge a person into themselves');
    }

    await this.requireAccess({ auth, permission: Permission.PersonUpdate, ids: [id] });
    let primaryPerson = await this.findOrFail(id);
    const primaryName = primaryPerson.name || primaryPerson.id;

    const results: BulkIdResponseDto[] = [];

    const allowedIds = await this.checkAccess({
      auth,
      permission: Permission.PersonMerge,
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

        const update: Updateable<Person> & { id: string } = { id: primaryPerson.id };
        if (!primaryPerson.name && mergePerson.name) {
          update.name = mergePerson.name;
        }

        if (!primaryPerson.birthDate && mergePerson.birthDate) {
          update.birthDate = mergePerson.birthDate;
        }

        if (Object.keys(update).length > 0) {
          primaryPerson = await this.personRepository.update(update);
        }

        const mergeName = mergePerson.name || mergePerson.id;
        const mergeData: UpdateFacesData = { oldPersonId: mergeId, newPersonId: id };
        this.logger.log(`Merging ${mergeName} into ${primaryName}`);

        await this.personRepository.reassignFaces(mergeData);
        await this.removeAllPeople([mergePerson]);

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

  // TODO return a asset face response
  async createFace(auth: AuthDto, dto: AssetFaceCreateDto): Promise<void> {
    await Promise.all([
      this.requireAccess({ auth, permission: Permission.AssetRead, ids: [dto.assetId] }),
      this.requireAccess({ auth, permission: Permission.PersonRead, ids: [dto.personId] }),
    ]);

    await this.personRepository.createAssetFace({
      personId: dto.personId,
      assetId: dto.assetId,
      imageHeight: dto.imageHeight,
      imageWidth: dto.imageWidth,
      boundingBoxX1: dto.x,
      boundingBoxX2: dto.x + dto.width,
      boundingBoxY1: dto.y,
      boundingBoxY2: dto.y + dto.height,
      sourceType: SourceType.Manual,
    });
  }

  async deleteFace(auth: AuthDto, id: string, dto: AssetFaceDeleteDto): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.FaceDelete, ids: [id] });

    return dto.force ? this.personRepository.deleteAssetFace(id) : this.personRepository.softDeleteAssetFaces(id);
  }
}
